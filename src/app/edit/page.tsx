"use client";
import { useImageStore } from "../../store/imageStore";
import { useState } from "react";
import Image from "next/image";

export default function EditImagePage() {
  const img = useImageStore((s) => s.selectedImage) as string | ImageData | { data: Uint8ClampedArray | number[]; width: number; height: number } | null;
  const [prompt, setPrompt] = useState("");
  const [pollingUrl, setPollingUrl] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [finalImages, setFinalImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Additional images state
  const [additionalImages, setAdditionalImages] = useState<string[]>(["", "", ""]);

  if (!img) {
    return <div className="text-center text-red-400">No image selected.</div>;
  }

  // Polling function
  const pollForResult = async (url: string) => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setFinalImage(null);
    setFinalImages([]);
    try {
      for (let i = 0; i < 30; i++) {
        // poll up to 30 times (~30s)
        const res = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url: url }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          setErrorDetails(errorData.details || "No additional details available");
          throw new Error(errorData.error || `API error: ${res.status}`);
        }
        
        const data: { status: string; result?: { sample?: string }; images?: string[]; details?: string } = await res.json();
        
        if (data.status === "Ready" && data.result?.sample) {
          console.log("Edit result received successfully");
          setFinalImage(data.result.sample);
          if (data.images && Array.isArray(data.images)) {
            setFinalImages(data.images);
          }
          setLoading(false);
          return;
        }
        
        if (data.status === "Error") {
          setErrorDetails(data.details || null);
          throw new Error("Error in image processing");
        }
        
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s
      }
      setError("Timed out waiting for image result.");
    } catch (err: unknown) {
      console.error("Poll error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  function isNativeImageData(obj: any): obj is ImageData {
    return (
      typeof window !== "undefined" &&
      typeof obj === "object" &&
      obj !== null &&
      typeof window.ImageData !== "undefined" &&
      obj instanceof window.ImageData
    );
  }

  function imageLikeToDataURL(
    image: string | { data: Uint8ClampedArray | number[]; width: number; height: number } | ImageData
  ): string {
    // If it's already a string, verify if it's a data URL or needs to be converted
    if (typeof image === "string") {
      // Check if it's already a data URL (starts with data:image/)
      if (image.startsWith("data:image/")) {
        return image;
      }
      
      // Check if it's a URL (not a data URL)
      if (image.startsWith("http")) {
        console.warn("Cannot convert remote URL to data URL. API might not accept this format.");
        return image;
      }
      
      // Assume it's raw base64, convert to data URL
      try {
        return `data:image/png;base64,${image}`;
      } catch (err) {
        console.error("Failed to format base64 string as data URL:", err);
        return image; // Return as-is if conversion fails
      }
    }
    
    // Handle native ImageData
    if (isNativeImageData(image)) {
      // Convert native ImageData to data URL
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.putImageData(image, 0, 0);
      // Use PNG for better quality
      return canvas.toDataURL("image/png", 1.0);
    }
    
    // If it's a custom object, reconstruct native ImageData
    const { data, width, height } = image;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const arr = data instanceof Uint8ClampedArray ? data : new Uint8ClampedArray(data);
    const nativeImageData = new window.ImageData(arr, width, height);
    ctx.putImageData(nativeImageData, 0, 0);
    // Use PNG for better quality
    return canvas.toDataURL("image/png", 1.0);
  }

  // Normalize image to a standard format that the API will accept
  function normalizeImageForAPI(
    image: string | { data: Uint8ClampedArray | number[]; width: number; height: number } | ImageData
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // First convert to data URL if not already
        const dataUrl = imageLikeToDataURL(image);
        
        // Create an Image element to load the data URL
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Create a canvas with standard dimensions
            const canvas = document.createElement('canvas');
            
            // Keep aspect ratio but limit size to reasonable dimensions
            const MAX_SIZE = 1024; // Most APIs work well with images up to 1024px
            let width = img.width;
            let height = img.height;
            
            if (width > height && width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw the image onto the canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Use better quality settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw white background first (in case of transparent images)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            
            // Then draw the image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG format (widely compatible)
            const normalizedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            console.log(`Normalized image: ${width}x${height}, starts with: ${normalizedDataUrl.substring(0, 30)}...`);
            resolve(normalizedDataUrl);
          } catch (err) {
            console.error('Error normalizing image:', err);
            // Fall back to original data URL
            resolve(dataUrl);
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load image for normalization');
          // Fall back to original data URL
          resolve(dataUrl);
        };
        
        img.src = dataUrl;
      } catch (err) {
        console.error('Error in image normalization:', err);
        reject(err);
      }
    });
  }

  const handleEdit = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setFinalImage(null);
    setFinalImages([]);
    setPollingUrl(null);
    try {
      console.log("Processing image for edit request...");
      
      // Convert and normalize the image to a standard format
      const normalizedImage = await normalizeImageForAPI(img).catch(err => {
        console.error("Image normalization failed, falling back to simple conversion:", err);
        return imageLikeToDataURL(img);
      });
      
      // Process additional images
      const processedAdditionalImages = [];
      for (const additionalImg of additionalImages) {
        if (additionalImg) {
          try {
            const normalized = await normalizeImageForAPI(additionalImg);
            processedAdditionalImages.push(normalized);
          } catch (err) {
            console.error("Failed to process additional image:", err);
            processedAdditionalImages.push(additionalImg);
          }
        }
      }
      
      console.log("Images prepared for API, sending edit request...");
      
      const requestBody: any = { 
        prompt, 
        input_image: normalizedImage 
      };
      
      if (processedAdditionalImages.length > 0) {
        requestBody.additional_images = processedAdditionalImages;
      }
      
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrorDetails(data.details || "No additional details available");
        throw new Error(data.error || "Failed to edit image");
      }
      
      console.log("Edit request response:", data);
      
      if (data.polling_url) {
        console.log("Received polling URL:", data.polling_url);
        setPollingUrl(data.polling_url);
        pollForResult(data.polling_url);
      } else if (data.result?.sample) {
        setFinalImage(data.result.sample);
        if (data.images && Array.isArray(data.images)) {
          setFinalImages(data.images);
        }
      } else if (data.image) {
        setFinalImage(data.image);
      } else {
        setError("No image or polling URL returned.");
        setErrorDetails(JSON.stringify(data));
      }
    } catch (err: unknown) {
      console.error("Edit error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  // Handle additional image upload
  const handleAdditionalImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const newImages = [...additionalImages];
        newImages[index] = result;
        setAdditionalImages(newImages);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = "";
    setAdditionalImages(newImages);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] px-4 py-8">
      <div className="max-w-6xl w-full flex flex-col items-center">
        
        {/* Additional Images Upload Section */}
        <div className="w-full max-w-4xl mb-8">
          <h3 className="text-white text-lg font-semibold mb-4 text-center">Additional Reference Images (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="relative w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
                  {additionalImages[index] ? (
                    <>
                      <Image
                        src={additionalImages[index]}
                        alt={`Reference ${index + 1}`}
                        className="object-cover w-full h-full"
                        fill
                        sizes="128px"
                      />
                      <button
                        onClick={() => removeAdditionalImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-700 transition">
                      <span className="text-gray-400 text-sm text-center">Upload Image {index + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAdditionalImageUpload(index, file);
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-2">Reference {index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-6xl">
          {/* Original Image */}
          <div className="flex flex-col items-center">
            <div className="relative w-72 h-72">
              {img && (
                <Image
                  src={imageLikeToDataURL(img)}
                  alt="To edit"
                  className="rounded-xl object-contain"
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  priority
                />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-2">Original Image</span>
          </div>
          
          {/* Final Edited Images */}
          {finalImages.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-1 gap-4">
                {finalImages.map((imageUrl, index) => (
                  <div key={index} className="relative w-72 h-72">
                    <Image
                      src={imageUrl}
                      alt={`Edited ${index + 1}`}
                      className="rounded-xl object-contain"
                      fill
                      sizes="(max-width: 768px) 100vw, 384px"
                      priority
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400 mt-2">Edited Images</span>
            </div>
          ) : finalImage ? (
            <div className="flex flex-col items-center">
              <div className="relative w-72 h-72">
                <Image
                  src={finalImage}
                  alt="Edited"
                  className="rounded-xl object-contain"
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  priority
                />
              </div>
              <span className="text-xs text-gray-400 mt-2">Edited Image</span>
            </div>
          ) : null}
        </div>
        {/* Edit Input with Button inside */}
        <div className="relative w-full max-w-xl mt-8 mb-4">
          <input
            type="text"
            placeholder="how do you want to edit this image"
            className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 pr-32 outline-none border-none placeholder:text-gray-400"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleEdit}
            disabled={loading || !prompt}
            style={{ minWidth: 90 }}
          >
            {loading ? "Editing..." : "Submit"}
          </button>
        </div>
        
        {/* Info about additional images */}
        {additionalImages.some(img => img) && (
          <div className="text-gray-400 text-sm mb-4 text-center">
            Using {additionalImages.filter(img => img).length} additional reference image(s)
          </div>
        )}
        
        {error && (
          <div className="text-red-400 mt-4">
            <div className="font-semibold">Error: {error}</div>
            {errorDetails && (
              <div className="text-sm mt-1 text-red-300 max-w-md overflow-auto">
                <details>
                  <summary>Technical Details</summary>
                  <pre className="text-xs mt-2 bg-[#333] p-2 rounded">
                    {errorDetails}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
        
        {pollingUrl && !finalImage && !error && (
          <div className="text-gray-400 mt-4">Waiting for edited image...</div>
        )}
        
        {loading && !pollingUrl && (
          <div className="text-gray-400 mt-4">Processing your edit request...</div>
        )}
      </div>
    </div>
  );
}

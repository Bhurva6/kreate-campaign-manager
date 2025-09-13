import { useImageStore, type ImageData } from "@/store/imageStore";
import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCreditManagement } from "./useCreditManagement";

export function useImageOperations() {
  const { user } = useAuth();
  const { 
    consumeImageGeneration, 
    consumeImageEdit,
    canUseImageGeneration,
    canUseImageEdit,
    setShowPricingModal
  } = useCreditManagement();
  const { addImage, addImages } = useImageStore();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const generateImages = useCallback(async (
    prompt: string, 
    sampleCount = 1, 
    aspectRatio = "1:1",
    userId?: string
  ) => {
    // Use user.uid if no userId is provided
    const userIdentifier = userId || user?.uid;
    
    if (!userIdentifier) {
      setError("You must be logged in to generate images");
      throw new Error("User not authenticated");
    }
    
    // Check if user has enough credits
    if (!canUseImageGeneration) {
      setShowPricingModal(true);
      setError("You have reached your image generation limit");
      throw new Error("Image generation limit reached");
    }
    
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sampleCount, aspectRatio, userId: userIdentifier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorDetails(errorData.details || null);
        throw new Error(errorData.error || "Failed to generate images");
      }

      const data = await response.json();
      
      // Only consume credit if API call was successful
      consumeImageGeneration();
      
      // Convert API response to ImageData format
      const imageData: ImageData[] = data.images.map((img: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        url: img.url, // R2 public URL
        dataUrl: img.dataUrl, // Base64 for immediate display
        prompt: img.prompt || prompt,
        r2Key: img.r2Key,
        signedUrl: img.signedUrl,
        category: "generated",
        uploadedAt: new Date().toISOString(),
        userId: userIdentifier,
      }));

      // Add to store
      addImages(imageData);
      
      return imageData;
    } catch (error: any) {
      console.error("Error generating images:", error);
      setError(error.message || "Failed to generate images");
      throw error;
    }
  }, [addImages, user, canUseImageGeneration, consumeImageGeneration, setShowPricingModal]);

  // Function to compress an existing data URL image
  const compressImageDataUrl = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create canvas for processing
          const canvas = document.createElement("canvas");
          
          // Calculate new dimensions, maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 1600; // Reduce from 2048 to 1600 for edit operations
          
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get data URL with lower quality for edit operations
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (err) {
          console.error("Error compressing image:", err);
          // If compression fails, return original image
          resolve(dataUrl);
        }
      };
      
      img.onerror = () => {
        console.error("Failed to load image for compression");
        // If image loading fails, return original image
        resolve(dataUrl);
      };
      
      img.src = dataUrl;
    });
  };

  const editImage = useCallback(async (
    inputImage: string,
    prompt: string,
    userId?: string
  ) => {
    // Use user.uid if no userId is provided
    const userIdentifier = userId || user?.uid;
    
    if (!userIdentifier) {
      setError("You must be logged in to edit images");
      throw new Error("User not authenticated");
    }
    
    // Check if user has enough credits
    if (!canUseImageEdit) {
      setShowPricingModal(true);
      setError("You have reached your image edit limit");
      throw new Error("Image edit limit reached");
    }
    
    // Validate input parameters
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      setError("Invalid prompt");
      throw new Error("Invalid prompt");
    }
    
    if (!inputImage || typeof inputImage !== 'string') {
      setError("Invalid image data");
      throw new Error("Invalid image data");
    }
    
    // Validate image format
    if (!inputImage.startsWith('data:image/')) {
      console.error("Invalid image format. Image must start with data:image/");
      setError("Invalid image format");
      throw new Error("Image must be in data URL format");
    }
    
    // Basic validation for base64 content
    const base64Parts = inputImage.split(',');
    if (base64Parts.length !== 2) {
      console.error("Invalid data URL format");
      setError("Invalid image data");
      throw new Error("Invalid image data");
    }
    
    const base64Content = base64Parts[1];
    if (!base64Content || base64Content.length < 100) {
      console.error("Invalid base64 image data:", 
        base64Content ? `Length: ${base64Content.length}, Preview: ${base64Content.substring(0, 20)}...` : "No base64 content");
      setError("Invalid image data");
      throw new Error("Invalid image data");
    }
    
    try {
      // Prepare image to ensure it's not too large
      console.log("Image type:", typeof inputImage);
      console.log("Image preview:", `${inputImage.substring(0, 50)}...`);
      
      // Log image size estimate in KB
      const imageSizeEstimate = Math.round(inputImage.length * 0.75 / 1024);
      console.log(`Estimated image size: ~${imageSizeEstimate}KB`);
      
      // Optimize image if it's too large (over 3MB)
      let optimizedImage = inputImage;
      if (imageSizeEstimate > 3000) {
        console.log("Image is large, attempting optimization before sending");
        optimizedImage = await compressImageDataUrl(inputImage);
        console.log("Image prepared for editing:", `${optimizedImage.substring(0, 50)}...`);
      }
      
      // Start the edit process
      console.log("Sending image edit request...");
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input_image: optimizedImage, 
          prompt: prompt.trim(),
          userId: userIdentifier 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Edit image API error:", errorData);
        setErrorDetails(errorData.details || null);
        throw new Error(errorData.error || "Failed to start image editing");
      }

      const data = await response.json();
      console.log("Edit image response:", data);
      
      // Only consume credit when we successfully get a response
      consumeImageEdit();
      
      if (data.polling_url) {
        // Poll for results if we have a polling URL
        return pollEditResult(data.polling_url, prompt, userIdentifier);
      } else if (data.result && data.result.sample) {
        // Handle direct result without polling (like from Nano Banana API)
        console.log("Direct edit result received without polling");
        
        // Check if we also have multiple images in the response
        const additionalUrls = data.images && Array.isArray(data.images) && data.images.length > 0
          ? data.images.filter((url: string) => url !== data.result.sample)
          : undefined;
          
        const imageData: ImageData = {
          id: `edited-${Date.now()}`,
          url: data.result.sample,
          prompt: prompt || "edited-image",
          r2Key: data.r2?.key,
          signedUrl: data.r2?.signedUrl,
          category: "edited",
          uploadedAt: new Date().toISOString(),
          userId: userIdentifier,
          additionalUrls: additionalUrls,
        };
        
        addImage(imageData);
        return imageData;
      } else if (data.images && data.images.length > 0) {
        // Handle response with multiple images array
        console.log("Multiple edit results received");
        const imageData: ImageData = {
          id: `edited-${Date.now()}`,
          url: data.images[0], // Use the first image as the main one
          prompt: prompt || "edited-image",
          category: "edited",
          uploadedAt: new Date().toISOString(),
          userId: userIdentifier,
          additionalUrls: data.images.slice(1), // Store any additional images
        };
        
        addImage(imageData);
        return imageData;
      }

      throw new Error("No valid image result or polling URL received");
    } catch (error: any) {
      console.error("Error editing image:", error);
      setError(error.message || "Failed to edit image");
      throw error;
    }
  }, [user, canUseImageEdit, setShowPricingModal, consumeImageEdit]);

  const pollEditResult = useCallback(async (
    pollingUrl: string,
    prompt?: string,
    userId?: string,
    maxAttempts = 40 // Increased from 30 to 40 for more resilience
  ): Promise<ImageData> => {
    let consecutiveErrors = 0;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const elapsedSecs = Math.round((Date.now() - startTime) / 1000);
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts} (${elapsedSecs}s elapsed)`);
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url: pollingUrl, prompt, userId }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Poll error:", errorData);
          
          // Handle 202 status code specially - this means processing is continuing
          if (response.status === 202 && errorData.recoverable) {
            console.log("Recoverable error, continuing to poll:", errorData.progress || errorData.suggestion);
            // Wait a bit longer between polls when we get a recoverable error
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          
          setErrorDetails(errorData.details || null);
          throw new Error(errorData.error || "Failed to poll edit result");
        }
        
        // Reset consecutive errors counter on successful response
        consecutiveErrors = 0;

        const data = await response.json();
        console.log("Poll response:", data);

        if (data.status === "Ready" && data.result?.sample) {
          console.log("Edit result ready");
          const imageData: ImageData = {
            id: `edited-${Date.now()}`,
            url: data.r2?.publicUrl || data.result.sample, // Prefer R2 URL
            prompt: prompt || "edited-image",
            r2Key: data.r2?.key,
            signedUrl: data.r2?.signedUrl,
            category: "edited",
            uploadedAt: new Date().toISOString(),
            userId,
          };

          addImage(imageData);
          return imageData;
        }

        if (data.status === "Error") {
          setErrorDetails(data.details || null);
          throw new Error(data.error || "Image editing failed");
        }

        // Wait before next poll (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`Poll attempt ${attempt + 1} failed:`, error);
        
        // Track consecutive errors to determine if we should continue
        consecutiveErrors++;
        
        // If we have too many consecutive errors, or it's the final attempt, give up
        if (consecutiveErrors >= 5 || attempt === maxAttempts - 1) {
          // If we've been polling for at least 40 seconds, consider this a timeout
          const totalElapsedTime = Date.now() - startTime;
          if (totalElapsedTime > 40000) {
            throw new Error("Image editing timed out. The service might be experiencing high load.");
          } else {
            throw error;
          }
        }
        
        // Exponential backoff with jitter for retries
        const baseDelay = 2000; // 2 seconds
        const maxDelay = 8000; // 8 seconds 
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay * Math.pow(1.5, consecutiveErrors - 1), maxDelay) + jitter;
        
        console.log(`Waiting ${Math.round(delay/1000)}s before next polling attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error("Image editing timed out");
  }, [addImage]);

  

  return {
    generateImages,
    editImage,
    pollEditResult,
    canUseImageGeneration,
    canUseImageEdit,
    error,
    errorDetails,
    setError,
    clearError: () => {
      setError(null);
      setErrorDetails(null);
    }
  };
}

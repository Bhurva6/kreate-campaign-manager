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
      // Start the edit process
      console.log("Sending image edit request...");
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input_image: inputImage, 
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
      
      if (data.polling_url) {
        // Only consume credit when we successfully start the edit
        consumeImageEdit();
        
        // Poll for results
        return pollEditResult(data.polling_url, prompt, userIdentifier);
      }

      throw new Error("No polling URL received");
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
    maxAttempts = 30
  ): Promise<ImageData> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
        const response = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url: pollingUrl, prompt, userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Poll error:", errorData);
          setErrorDetails(errorData.details || null);
          throw new Error(errorData.error || "Failed to poll edit result");
        }

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
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
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

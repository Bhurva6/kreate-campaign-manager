import { useImageStore, type ImageData } from "@/store/imageStore";
import { useCallback } from "react";

export function useImageOperations() {
  const { addImage, addImages } = useImageStore();

  const generateImages = useCallback(async (
    prompt: string, 
    sampleCount = 1, 
    aspectRatio = "1:1",
    userId?: string
  ) => {
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sampleCount, aspectRatio, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate images");
      }

      const data = await response.json();
      
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
        userId,
      }));

      // Add to store
      addImages(imageData);
      
      return imageData;
    } catch (error) {
      console.error("Error generating images:", error);
      throw error;
    }
  }, [addImages]);

  const editImage = useCallback(async (
    inputImage: string,
    prompt: string,
    userId?: string
  ) => {
    try {
      // Start the edit process
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_image: inputImage, prompt, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start image editing");
      }

      const data = await response.json();
      
      if (data.polling_url) {
        // Poll for results
        return pollEditResult(data.polling_url, prompt, userId);
      }

      throw new Error("No polling URL received");
    } catch (error) {
      console.error("Error editing image:", error);
      throw error;
    }
  }, []);

  const pollEditResult = useCallback(async (
    pollingUrl: string,
    prompt?: string,
    userId?: string,
    maxAttempts = 30
  ): Promise<ImageData> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url: pollingUrl, prompt, userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to poll edit result");
        }

        const data = await response.json();

        if (data.status === "Ready" && data.result?.sample) {
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
          throw new Error(data.error || "Image editing failed");
        }

        // Wait before next poll (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
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
  };
}

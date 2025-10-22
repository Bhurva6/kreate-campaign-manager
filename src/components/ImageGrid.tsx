"use client";

import { useState, useRef } from "react";

const images = [
  {
    src: "/yellowbottle.jpeg",
    prompt:
      "Place the uploded image on top of the bottle in the center facing front exactly as big and where the text your brand here is.",
  },
  {
    src: "/blackbottle.jpeg",
    prompt:
      "Place the uploded image on top of the bottle in the center facing front exactly as big and where the text your brand here is.",
  },
  {
    src: "/maroonbox.png",
    prompt:
      "Place the uploded image on top of all the boxes in the center of the box facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Minimalist Dropper Composition.png",
    prompt:
      "Place the uploded image on top of the bottle in the center of the bottle box facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Minimalist Skincare Tube.png",
    prompt:
      "Remove all the text on the tube. Place the uploded image on top of the tube in the center of the tube facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Screenshot 2025-10-23 at 1.30.03 AM.png",
    prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Screenshot 2025-10-23 at 1.30.25 AM.png",
    prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Screenshot 2025-10-23 at 1.30.37 AM.png",
    prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Screenshot 2025-10-23 at 1.30.47 AM.png",
    prompt:
      " Place the uploded image on top of all the bottles in the center of the bottles facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "/Screenshot 2025-10-23 at 1.31.26 AM.png",
    prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 1.31.48 AM.png",
    prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 2.01.05 AM.png",
    prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 2.01.41 AM.png",
    prompt:
      " Place the uploded image on top of all the bottles in the center of the bottles facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 2.01.48 AM.png",
   prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 2.01.53 AM.png",
   prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 2.02.33 AM.png",
   prompt:
      " Place the uploded image on top of all the bottles in the center of the bottles facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  {
    src: "Screenshot 2025-10-23 at 2.02.41 AM.png",
   prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
    {
    src: "Screenshot 2025-10-23 at 2.02.56 AM.png",
   prompt:
      " Place the uploded image on top of the bottle in the center of the bottle facing front which is clearly visible and correctly blended with the entire image to look very natural.",
  },
  

];

export default function ImageGrid() {
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    prompt: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = (image: { src: string; prompt: string }) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    setError(null);
    setIsLoading(false);
    if (editedImage) {
      URL.revokeObjectURL(editedImage);
      setEditedImage(null);
    }
  };

  const handleUseThis = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert uploaded file to base64
      const uploadedImageBase64 = await fileToBase64(file);

      // Convert selected image URL to base64
      const selectedImageBase64 = await urlToBase64(selectedImage.src);

      const requestBody = {
        prompt: selectedImage.prompt,
        input_image: uploadedImageBase64,
        additional_images: [selectedImageBase64],
      };

      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        try {
          const responseData = await response.json();
          if (responseData.error) {
            setError(responseData.error);
            return;
          }

          if (responseData.image) {
            console.log(
              "Received image data:",
              responseData.image.substring(0, 100) + "..."
            );
            // Check if the base64 string already includes the data URL prefix
            const base64Data = responseData.image.startsWith("data:")
              ? responseData.image
              : `data:image/jpeg;base64,${responseData.image.replace(
                  /^data:image\/(png|jpeg|jpg);base64,/,
                  ""
                )}`;
            setEditedImage(base64Data);
            console.log("Image edited successfully");
          } else {
            setError("No image data received");
            return;
          }
        } catch (parseError) {
          const text = await response.text();
          setError(text || "Unknown error occurred");
          return;
        }
        // Don't close modal, show the result
      } else {
        // Try to parse error response
        try {
          const errorData = await response.json();
          setError(
            errorData.error ||
              `Error: ${response.status} ${response.statusText}`
          );
        } catch (parseError) {
          setError(`Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error sending edit request:", error);
      setError("Network error: Failed to send request");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper function to convert image URL to base64
  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {images.map((image, index) => (
          <div
            key={index}
            className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openModal(image)}
          >
            <img
              src={image.src}
              alt={`Vibe ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-5xl w-full mx-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <h2 className="text-xl font-bold text-center mb-4 text-black dark:text-white">
                  Selected Vibe
                </h2>
                <div className="relative h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.src}
                    alt="Selected vibe"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>
              {editedImage ? (
                <div>
                  <h3 className="text-xl font-bold text-center mb-4 text-black dark:text-white">
                    Output Image
                  </h3>
                  <div className="relative h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={editedImage}
                      alt="Edited output"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-center mb-4 text-black dark:text-white">
                    Upload Image
                  </h2>
                  <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center p-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const label = document.querySelector(
                              'label[for="file-upload"]'
                            );
                            if (label) {
                              label.textContent = file.name;
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md">
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                {editedImage ? "Close" : "Cancel"}
              </button>
              {editedImage ? (
                <a
                  href={editedImage}
                  download="edited-image.png"
                  className="px-4 py-2 bg-[#6C2F83] text-white rounded-md hover:bg-[#502D81] transition-colors flex items-center gap-2"
                >
                  Download
                </a>
              ) : (
                <button
                  onClick={handleUseThis}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#6C2F83] text-white rounded-md hover:bg-[#502D81] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                  Use This
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useImageStore, type ImageData } from "@/store/imageStore";
import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  category?: string;
  showUploadInfo?: boolean;
}

export default function ImageGallery({
  category,
  showUploadInfo = false,
}: ImageGalleryProps) {
  const {
    images,
    selectedImage,
    setSelectedImage,
    removeImage,
    getImagesByCategory,
  } = useImageStore();
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const displayImages = category ? getImagesByCategory(category) : images;

  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image);
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    removeImage(id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  function isNativeImageData(obj: unknown): obj is ImageData {
    return (
      typeof window !== "undefined" &&
      typeof obj === "object" &&
      obj !== null &&
      typeof window.ImageData !== "undefined" &&
      obj instanceof window.ImageData
    );
  }

  if (displayImages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No images found {category && `in ${category} category`}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayImages.map((image) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              typeof selectedImage === "object" &&
              selectedImage !== null &&
              "id" in selectedImage &&
              selectedImage.id === image.id
                ? "border-blue-500 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleImageClick(image)}
          >
            <div className="aspect-square relative">
              {/* Badge for images with variations */}
              {image.additionalUrls && image.additionalUrls.length > 0 && (
                <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  +{image.additionalUrls.length} variations
                </div>
              )}
              
              <Image
                src={image.dataUrl || image.url}
                alt={image.prompt || "Generated image"}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to R2 URL if dataUrl fails
                  const target = e.target as HTMLImageElement;
                  if (target.src !== image.url && image.url) {
                    target.src = image.url;
                  }
                }}
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(
                        showDetails === image.id ? null : image.id
                      );
                    }}
                    className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-100"
                  >
                    Info
                  </button>
                  <button
                    onClick={(e) => handleRemoveImage(image.id, e)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Image details */}
            {showDetails === image.id && (
              <div className="absolute inset-0 bg-black bg-opacity-90 text-white p-4 text-xs overflow-y-auto">
                <div className="space-y-2">
                  <div>
                    <strong>Prompt:</strong> {image.prompt || "N/A"}
                  </div>
                  <div>
                    <strong>Category:</strong> {image.category || "N/A"}
                  </div>
                  <div>
                    <strong>Uploaded:</strong>{" "}
                    {image.uploadedAt
                      ? new Date(image.uploadedAt).toLocaleString()
                      : "N/A"}
                  </div>
                  {showUploadInfo && (
                    <>
                      <div>
                        <strong>R2 Key:</strong>
                        <div
                          className="text-blue-300 cursor-pointer hover:text-blue-200 break-all"
                          onClick={() => copyToClipboard(image.r2Key || "")}
                        >
                          {image.r2Key || "N/A"}
                        </div>
                      </div>
                      <div>
                        <strong>Public URL:</strong>
                        <div
                          className="text-blue-300 cursor-pointer hover:text-blue-200 break-all"
                          onClick={() => copyToClipboard(image.url)}
                        >
                          {image.url}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(null);
                  }}
                  className="mt-4 bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected image preview */}
      {selectedImage && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Selected Image</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              {selectedImage && (
                <Image
                  src={
                    typeof selectedImage === "string"
                      ? selectedImage
                      : selectedImage.dataUrl || selectedImage.url
                  }
                  alt={
                    typeof selectedImage === "string"
                      ? "Selected image"
                      : selectedImage.prompt || "Selected image"
                  }
                  width={300}
                  height={300}
                  className="rounded-lg object-cover w-full"
                />
              )}
            </div>
            <div className="md:w-2/3 space-y-2">
              <div>
                <strong>Prompt:</strong>{" "}
                {typeof selectedImage === "string"
                  ? "N/A"
                  : selectedImage.prompt || "N/A"}
              </div>
              <div>
                <strong>Category:</strong>{" "}
                {typeof selectedImage === "string"
                  ? "N/A"
                  : selectedImage.category || "N/A"}
              </div>
              <div>
                <strong>Upload Date:</strong>{" "}
                {typeof selectedImage === "string"
                  ? "N/A"
                  : selectedImage.uploadedAt
                  ? new Date(selectedImage.uploadedAt).toLocaleString()
                  : "N/A"}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() =>
                    typeof selectedImage === "string"
                      ? copyToClipboard(selectedImage)
                      : copyToClipboard(selectedImage.url)
                  }
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Copy URL
                </button>
                <button
                  onClick={() =>
                    typeof selectedImage === "string"
                      ? window.open(selectedImage, "_blank")
                      : window.open(selectedImage.url, "_blank")
                  }
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
          
          {/* Display additional variations if available */}
          {typeof selectedImage === "object" && 
           selectedImage !== null && 
           "additionalUrls" in selectedImage && 
           selectedImage.additionalUrls && 
           selectedImage.additionalUrls.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3">Image Variations ({selectedImage.additionalUrls.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedImage.additionalUrls.map((url, index) => (
                  <div key={`variation-${index}`} className="relative aspect-square rounded-md overflow-hidden border border-gray-200">
                    <Image
                      src={url}
                      alt={`Variation ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(url);
                          }}
                          className="bg-white text-black px-2 py-1 rounded text-xs hover:bg-gray-100"
                        >
                          Copy URL
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(url, "_blank");
                          }}
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

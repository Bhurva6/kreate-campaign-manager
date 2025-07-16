"use client";

import { useImageStore } from "@/store/imageStore";
import ImageGallery from "@/components/ImageGallery";
import { useState } from "react";

export default function AdminPage() {
  const { images, clearImages } = useImageStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "generated", "edited", "brand-kit", "architecture", "graphics", "interior", "advertisements"];
  
  const getImageStats = () => {
    const stats = images.reduce((acc, img) => {
      const category = img.category || "unknown";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return stats;
  };

  const stats = getImageStats();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">R2 Image Management</h1>
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Images</h3>
            <p className="text-2xl font-bold text-blue-600">{images.length}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Generated</h3>
            <p className="text-2xl font-bold text-green-600">{stats.generated || 0}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Edited</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.edited || 0}</p>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800">Categories</h3>
            <p className="text-2xl font-bold text-orange-600">{Object.keys(stats).length}</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {category !== "all" && stats[category] && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                  {stats[category]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => clearImages()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            disabled={images.length === 0}
          >
            Clear All Images
          </button>
          <button
            onClick={() => {
              const data = {
                images: images,
                exportedAt: new Date().toISOString(),
                stats: stats,
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `kreate-images-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={images.length === 0}
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery 
        category={selectedCategory === "all" ? undefined : selectedCategory}
        showUploadInfo={true}
      />
    </div>
  );
}

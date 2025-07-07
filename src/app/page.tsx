"use client";
import { useState, useRef } from "react";
import { FaImage, FaUpload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useImageStore } from "../store/imageStore";

type GeneratedImage = { url: string; prompt?: string };

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [sampleCount, setSampleCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const setSelectedImage = useImageStore((s) => s.setSelectedImage);

  const categories = [
    { name: "Brand kit", link: "/brand-kit" },
    { name: "Graphics", link: "/graphics" },
    { name: "Interior designing", link: "/interior-designing" },
    { name: "Architecture", link: "/architecture" },
    { name: "Copy the ad", link: "/copy-the-ad" },
    { name: "Make it better", link: "/make-it-better" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sampleCount, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate images");
      setImages(data.images);
      setGallery(prev => [...data.images, ...prev]); // prepend new images to gallery
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setShowUploadModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadChoice = (choice: 'edit' | 'generate') => {
    if (choice === 'edit' && uploadedImage) {
      setSelectedImage(uploadedImage);
      setShowUploadModal(false);
      setUploadedImage(null);
      router.push("/edit");
    } else {
      setShowUploadModal(false);
      setUploadedImage(null);
      // Stay on homepage for generation
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center pb-12">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        {/* Icon and Title */}
        <div className="flex flex-col items-center mb-8 pt-12">    
          <h1 className="text-3xl font-bold text-white mb-2">Get started</h1>
        </div>

        {/* Category Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full mb-8 justify-center lg:flex lg:flex-row lg:gap-12 lg:space-x-12 lg:space-y-0">
          {categories.map(cat => {
            return (
              <div
                key={cat.link}
                className="bg-[#181818] rounded-2xl shadow-lg p-6 flex items-center justify-center border border-[#222] hover:bg-[#222] transition cursor-pointer min-w-[120px]"
                onClick={() => router.push(cat.link)}
              >
                <span className="text-white text-lg font-medium">{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* Upload Button */}
        <div className="bg-[#181818] rounded-2xl shadow-lg w-full p-6 flex flex-col items-center mb-8">
          <div className="w-full mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none hover:bg-[#333] transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              <FaUpload className="text-xl" />
              Upload Photo
            </button>
          </div>
        </div>

        {/* Prompt Input Card */}
        <div className="bg-[#181818] rounded-2xl shadow-lg w-full p-6 flex flex-col items-center mb-8">
          <div className="w-full mb-4">
            <input
              type="text"
              placeholder="Describe an image and click generate..."
              className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>
          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-6 w-full">
            <span className="bg-[#222] text-gray-300 px-3 py-1 rounded-full text-xs">
              <label>
                Count:
                <select
                  className="bg-transparent ml-1"
                  value={sampleCount}
                  onChange={e => setSampleCount(Number(e.target.value))}
                  disabled={loading}
                >
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </span>
            <span className="bg-[#222] text-gray-300 px-3 py-1 rounded-full text-xs">
              <label>
                Aspect:
                <select
                  className="bg-transparent ml-1"
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value)}
                  disabled={loading}
                >
                  <option value="1:1">1:1</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                </select>
              </label>
            </span>
          </div>
          {/* Generate Button */}
          <div className="w-full flex justify-end">
            <button
              className="bg-white text-black font-semibold px-8 py-3 rounded-xl shadow hover:bg-gray-200 transition disabled:opacity-50"
              onClick={handleGenerate}
              disabled={loading || !prompt}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
          {error && <div className="text-red-400 mt-4">{error}</div>}
        </div>

        {/* Gallery Grid */}
        {gallery.length > 0 && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((img, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center bg-[#181818] rounded-xl p-2 border border-[#222] group"
              >
                {/* Plus button */}
                <button
                  className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  onClick={() => {
                    setSelectedImage(img.url);
                    router.push("/edit");
                  }}
                  title="Edit this image"
                >
                  +
                </button>
                <img
                  src={img.url}
                  alt={img.prompt || `Generated ${i + 1}`}
                  className="rounded-lg max-h-48 object-contain mb-2"
                />
                {img.prompt && (
                  <span className="text-xs text-gray-400 text-center break-words">{img.prompt}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && uploadedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 text-center">What would you like to do?</h3>
            <div className="mb-4">
              <img 
                src={uploadedImage} 
                alt="Uploaded" 
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUploadChoice('edit')}
                className="flex-1 bg-blue-600 text-white font-semibold px-4 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Edit This Image
              </button>
              <button
                onClick={() => handleUploadChoice('generate')}
                className="flex-1 bg-[#222] text-white font-semibold px-4 py-3 rounded-xl hover:bg-[#333] transition"
              >
                Generate New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useImageStore } from "../../store/imageStore";

export default function GraphicsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [sampleCount, setSampleCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [images, setImages] = useState<{ url: string; prompt?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSelectedImage = useImageStore((s) => s.setSelectedImage);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setImages([]);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sampleCount, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate images");
      setImages(data.images);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] relative">
      <button
        className="absolute top-8 left-8 bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition"
        onClick={() => router.push("/")}
      >
        ← Back
      </button>
      <h1 className="text-4xl font-bold text-white mb-8">Graphics</h1>
      {/* Generated Images */}
      {images.length > 0 && (
        <div className="w-full flex flex-wrap justify-center gap-4 mb-8">
          {images.map((img, i) => (
            <div key={i} className="relative flex flex-col items-center group">
              <img
                src={img.url}
                alt={img.prompt || `Generated ${i + 1}`}
                className="rounded-xl max-h-64 mb-2 cursor-pointer"
                onClick={() => {
                  setSelectedImage(img.url);
                  router.push("/edit");
                }}
              />
              {/* Download Button */}
              <a
                href={img.url}
                download={`graphic-${i + 1}.png`}
                className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition"
                title="Download image"
                onClick={e => e.stopPropagation()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-9 8h10" />
                </svg>
              </a>
              {img.prompt && <span className="text-xs text-gray-400 text-center break-words">{img.prompt}</span>}
            </div>
          ))}
        </div>
      )}
      {/* Input Card */}
      <div className="bg-[#181818] rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-md">
        <input
          type="text"
          placeholder="what kind of graphics do you want to generate"
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 mb-4"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
        />
        <div className="flex flex-wrap gap-2 mb-4 w-full">
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
        <button
          className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50 w-full"
          onClick={handleGenerate}
          disabled={loading || !prompt}
        >
          {loading ? "Generating..." : "Submit"}
        </button>
        {error && <div className="text-red-400 mt-4">{error}</div>}
      </div>
    </div>
  );
} 
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useImageStore } from "../../store/imageStore";
import Image from "next/image";

export default function GraphicsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [sampleCount, setSampleCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [images, setImages] = useState<{ url: string; prompt?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSelectedImage = useImageStore((s) => s.setSelectedImage);

  // Style options with preview images
  const styleOptions = [
    { 
      id: "photorealistic", 
      name: "Photorealistic", 
      image: "/photorealistic.jpeg",
      description: "Realistic photography style"
    },
    { 
      id: "artistic", 
      name: "Artistic", 
      image: "/artistic.jpeg",
      description: "Creative and artistic style"
    },
    { 
      id: "minimalist", 
      name: "Minimalist", 
      image: "/minimalist.jpeg",
      description: "Clean and simple design"
    },
    { 
      id: "vibrant", 
      name: "Vibrant", 
      image: "/vibrant.jpeg",
      description: "Bold and colorful style"
    },
    { 
      id: "illustration", 
      name: "Illustration", 
      image: "/illustration.jpeg",
      description: "Hand-drawn illustration style"
    },
    { 
      id: "product", 
      name: "Product", 
      image: "/product.jpeg",
      description: "Professional product photography"
    }
  ];

  // Background images with sample prompts for demonstration
  const [backgroundImages] = useState([
    { url: "/girl1.jpeg", prompt: "Portrait photography with natural lighting" },
    { url: "/girl2.jpeg", prompt: "Modern lifestyle photography" },
    { url: "/girl3.jpeg", prompt: "Creative portrait with artistic composition" },
    { url: "/girl4.jpeg", prompt: "Fashion photography with contemporary style" },
    { url: "/baker.jpeg", prompt: "Professional food photography" },
    { url: "/labubuastro.jpeg", prompt: "Character illustration with space theme" },
    { url: "/blue-cereal.png", prompt: "Product photography with clean background" },
    { url: "/bright-cereal.png", prompt: "Colorful product showcase design" },
    { url: "/image.png", prompt: "Architectural visualization and design" },
    { url: "/images.jpeg", prompt: "Creative marketing visuals" },
    { url: "/golocologo.png", prompt: "Professional brand logo design" },
    { url: "/unnamed.png", prompt: "Minimalist graphic design concept" },
  ]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setImages([]);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sampleCount, aspectRatio, style: selectedStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate images");
      setImages(data.images);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#111] overflow-hidden">      
      {/* Animated Background Grid */}
      <div className="fixed inset-0 z-0">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-1 md:gap-2 p-1 md:p-2 h-screen opacity-40">
          {backgroundImages.map((img, i) => (
            <div
              key={`bg-${i}`}
              className="relative aspect-square rounded-md overflow-hidden group cursor-pointer bg-gray-800/50"
              style={{
                animation: `float ${15 + (i % 5) * 2}s ease-in-out infinite ${i * 0.2}s`,
              }}
            >
              <img
                src={img.url}
                alt={`Background ${i}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onLoad={() => console.log('✅ BG image loaded:', img.url)}
                onError={(e) => {
                  console.error('❌ BG image failed:', img.url);
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Hover Overlay with Prompt */}
              <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-1">
                <p className="text-white text-[10px] md:text-xs text-center font-medium leading-tight">
                  {img.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/40 z-10"></div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center">
        <button
          className="absolute top-8 left-8 bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition z-20"
          onClick={() => router.push("/")}
        >
          ← Back
        </button>
        
        <h1 className="text-4xl font-bold text-white mb-8">Graphics</h1>
        
        {/* Generated Images */}
        {images.length > 0 && (
          <div className="w-full flex flex-wrap justify-center gap-4 mb-8 max-w-6xl">
            {images.map((img, i) => (
              <div key={i} className="relative flex flex-col items-center group bg-[#181818] rounded-xl p-4">
                <div className="relative w-64 h-64">
                  <Image
                    src={img.url}
                    alt={img.prompt || `Generated ${i + 1}`}
                    className="rounded-xl object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, 256px"
                    priority={i === 0}
                    onClick={() => {
                      setSelectedImage(img.url);
                      router.push("/edit");
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </div>
                {/* Download Button */}
                <a
                  href={img.url}
                  download={`graphic-${i + 1}.png`}
                  className="absolute bottom-6 right-6 bg-blue-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition"
                  title="Download image"
                  onClick={e => e.stopPropagation()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4m-9 8h10" />
                  </svg>
                </a>
                {img.prompt && <span className="text-xs text-gray-400 text-center break-words mt-2">{img.prompt}</span>}
              </div>
            ))}
          </div>
        )}
        
        {/* Input Card */}
        <div className="bg-[#181818]/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center w-full max-w-2xl border border-[#333]">
          <input
            type="text"
            placeholder="what kind of graphics do you want to generate"
            className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 mb-6"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
          />
          
          {/* Style Selection */}
          <div className="w-full mb-6">
            <label className="text-white text-sm font-medium mb-3 block">Style</label>
            <div className="grid grid-cols-3 gap-3">
              {styleOptions.map((style) => (
                <div
                  key={style.id}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedStyle === style.id
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div 
                    className="aspect-square relative bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${style.image})` }}
                  >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-2">
                      <span className="text-white text-xs font-semibold text-center">{style.name}</span>
                      <span className="text-gray-300 text-[10px] text-center mt-1">{style.description}</span>
                    </div>
                    {/* Selected indicator */}
                    {selectedStyle === style.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Count and Aspect Ratio */}
          <div className="flex flex-wrap gap-2 mb-6 w-full">
            <span className="bg-[#222] text-gray-300 px-3 py-1 rounded-full text-xs">
              <label>
                Count:
                <select
                  className="bg-transparent ml-1 text-white"
                  value={sampleCount}
                  onChange={e => setSampleCount(Number(e.target.value))}
                  disabled={loading}
                >
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n} className="bg-[#222]">{n}</option>
                  ))}
                </select>
              </label>
            </span>
            <span className="bg-[#222] text-gray-300 px-3 py-1 rounded-full text-xs">
              <label>
                Aspect:
                <select
                  className="bg-transparent ml-1 text-white"
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value)}
                  disabled={loading}
                >
                  <option value="1:1" className="bg-[#222]">1:1</option>
                  <option value="3:4" className="bg-[#222]">3:4</option>
                  <option value="4:3" className="bg-[#222]">4:3</option>
                  <option value="16:9" className="bg-[#222]">16:9</option>
                  <option value="9:16" className="bg-[#222]">9:16</option>
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

      <style jsx global>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) scale(1); 
          }
          25% { 
            transform: translateY(-8px) scale(1.02); 
          }
          50% { 
            transform: translateY(-3px) scale(0.98); 
          }
          75% { 
            transform: translateY(-12px) scale(1.01); 
          }
        }
      `}</style>
    </div>
  );
} 
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Helper for API calls
async function callGenerateImage(prompt: string) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate image");
  return data.images && data.images[0]?.url;
}

async function callEditImage(prompt: string, input_image: string) {
  const res = await fetch("/api/edit-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, input_image }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to edit image");
  return data.image || (data.result && data.result.sample);
}

export default function DemoPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Generate image
  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError(null);
    setGenImage(null);
    setEditImage(null);
    try {
      const url = await callGenerateImage(prompt);
      setGenImage(url);
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Edit image
  const handleEdit = async () => {
    if (!genImage || !editPrompt) return;
    setEditLoading(true);
    setEditError(null);
    setEditImage(null);
    try {
      const url = await callEditImage(editPrompt, genImage);
      setEditImage(url);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-lime-400 transition"
          >
            ← Back
          </button>
          <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} />
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition"
            onClick={() => router.push("/signin")}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 transition"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6 max-w-2xl">
          Juicebox Live Demo
        </h1>
        <p className="text-lg md:text-xl text-gray-300 text-center mb-10 max-w-xl">
          Experience the power of AI-generated images and instant editing
        </p>

        {/* Demo Interface */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Generated Image Display */}
          {genImage && (
            <div className="w-full flex justify-center mb-8">
              <img
                src={genImage}
                alt="Generated"
                className="rounded-2xl shadow-lg w-full max-w-md object-contain"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          )}

          {/* Generation Input */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="flex-1 bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400"
                disabled={genLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && prompt && !genLoading) {
                    handleGenerate();
                  }
                }}
              />
              <button
                className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-8 py-4 rounded-xl shadow transition"
                onClick={handleGenerate}
                disabled={genLoading || !prompt}
              >
                {genLoading ? "Creating..." : "Generate"}
              </button>
            </div>
            {genError && <div className="text-red-400 mt-4 text-center">{genError}</div>}
          </div>

          {/* Edited Image Display */}
          {editImage && (
            <div className="w-full flex justify-center mb-8">
              <img
                src={editImage}
                alt="Edited"
                className="rounded-2xl shadow-lg w-full max-w-md object-contain"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          )}

          {/* Edit Input */}
          {genImage && (
            <div className="w-full max-w-2xl mx-auto mb-8">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe how you want to edit the image..."
                  className="flex-1 bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400"
                  disabled={editLoading}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && editPrompt && !editLoading) {
                      handleEdit();
                    }
                  }}
                />
                <button
                  className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-4 rounded-xl shadow transition"
                  onClick={handleEdit}
                  disabled={editLoading || !editPrompt}
                >
                  {editLoading ? "Editing..." : "Edit"}
                </button>
              </div>
              {editError && <div className="text-red-400 mt-4 text-center">{editError}</div>}
            </div>
          )}

          {/* Action Buttons */}
          {(genImage || editImage) && (
            <div className="flex justify-center gap-4 mb-12">
              <button
                className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-3 rounded-xl shadow transition"
                onClick={() => {
                  const imageUrl = editImage || genImage;
                  if (imageUrl) {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = 'juicebox-image.png';
                    link.click();
                  }
                }}
              >
                Download
              </button>
              <button
                className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-3 rounded-xl shadow transition"
                onClick={() => {
                  const imageUrl = editImage || genImage;
                  if (imageUrl && navigator.share) {
                    navigator.share({
                      title: 'Check out my Juicebox creation!',
                      url: imageUrl
                    });
                  } else {
                    navigator.clipboard.writeText(imageUrl || '');
                    alert('Image URL copied to clipboard!');
                  }
                }}
              >
                Share
              </button>
            </div>
          )}

          {/* Example Prompts */}
          <div className="w-full max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white text-center mb-6">
              Try these example prompts:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "a cute cat wearing sunglasses",
                "a futuristic cityscape at sunset",
                "a magical forest with glowing mushrooms",
                "a vintage car on a mountain road"
              ].map((example, i) => (
                <button
                  key={i}
                  className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl text-left transition"
                  onClick={() => setPrompt(example)}
                  disabled={genLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Case Studies */}
        <div className="mt-20 w-full max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Brand Success Stories
          </h2>
          <p className="text-lg text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            See how leading brands are using Juicebox to create stunning visual content
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Panache Greens",
                category: "Sustainable Building Materials",
                image: "/panache_green_logo.jpeg",
                description: "Eco-friendly building materials and green construction campaigns"
              },
              {
                name: "Evolv",
                category: "Mobility & Logistics",
                image: "/evolvlogo.png",
                description: "EV fleet provider"
              },
              {
                name: "Urban Café",
                category: "Food & Beverage",
                image: "/bright-cereal.png",
                description: "Social media content and menu visualization"
              },
              {
                name: "EcoStyle Fashion",
                category: "Fashion",
                image: "/girl1.jpeg",
                description: "Sustainable fashion campaigns and lookbooks"
              },
              {
                name: "FitLife Wellness",
                category: "Health & Fitness",
                image: "/girl2.jpeg",
                description: "Wellness journey visualization and motivation content"
              },
              {
                name: "ArtSpace Gallery",
                category: "Arts & Culture",
                image: "/labubuastro.jpeg",
                description: "Digital art curation and exhibition materials"
              },
              {
                name: "NextGen Gaming",
                category: "Gaming",
                image: "/girl3.jpeg",
                description: "Game asset creation and promotional content"
              },
              {
                name: "Green Earth Co.",
                category: "Sustainability",
                image: "/girl4.jpeg",
                description: "Environmental awareness and impact visualization"
              }
            ].map((brand, index) => (
              <div
                key={brand.name}
                className="relative group cursor-pointer rounded-2xl overflow-hidden h-64 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                onClick={() => {
                  if (brand.name === "Panache Greens") {
                    router.push("/panache-greens");
                  } else if (brand.name === "Evolv") {
                    router.push("/evolv");
                  } else {
                    // You can add navigation to individual case study pages here
                    console.log(`Clicked on ${brand.name} case study`);
                  }
                }}
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${brand.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="relative h-full flex flex-col justify-end p-6 text-white">
                  <div className="mb-2">
                    <span className="inline-block bg-lime-400 text-black text-xs font-semibold px-2 py-1 rounded-full mb-2">
                      {brand.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-lime-400 transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-sm text-gray-300 opacity-90">
                    {brand.description}
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition border border-white/20 hover:border-white/40"
              onClick={() => {
                // Navigate to full case studies page
                console.log("View all case studies");
              }}
            >
              View All Case Studies →
            </button>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to explore more features?
          </h3>
          <button
            className="bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-black font-semibold px-8 py-4 rounded-xl shadow-lg transition"
            onClick={() => router.push("/home")}
          >
            Get Full Access
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <span>Built in India</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

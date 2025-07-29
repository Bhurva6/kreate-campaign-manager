"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function MakeItBetterPage() {
  const router = useRouter();
  const [img, setImg] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPollingUrl, setEditPollingUrl] = useState<string | null>(null);

  const [genPrompt, setGenPrompt] = useState("");
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Polling function for edit
  const pollForEditResult = async (url: string) => {
    setEditLoading(true);
    setEditError(null);
    setEditResult(null);
    try {
      for (let i = 0; i < 30; i++) {
        const res = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url: url }),
        });
        const data = await res.json();
        if (data.status === "Ready" && data.result?.sample) {
          setEditResult(data.result.sample);
          setEditLoading(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setEditError("Timed out waiting for image result.");
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImg(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Call edit image API
  const handleEditImage = async () => {
    if (!img || !editPrompt) return;
    setEditLoading(true);
    setEditError(null);
    setEditResult(null);
    setEditPollingUrl(null);
    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editPrompt, input_image: img }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit image");
      if (data.polling_url) {
        setEditPollingUrl(data.polling_url);
        pollForEditResult(data.polling_url);
      } else if (data.image) {
        setEditResult(data.image);
      } else {
        setEditError("No image or polling URL returned.");
      }
    } catch (err: any) {
      setEditError(err.message);
      setEditLoading(false);
    }
  };

  // Call generate image API
  const handleGenerate = async () => {
    if (!genPrompt) return;
    setGenLoading(true);
    setGenError(null);
    setGenResult(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: genPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      if (data.images && data.images[0]?.url) {
        setGenResult(data.images[0].url);
      } else {
        setGenError("No image returned.");
      }
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] relative">
      <button
        className="absolute top-8 left-8 bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition"
        onClick={() => router.push("/")}
      >
        ← Back
      </button>
      <h1 className="text-4xl font-bold text-white mb-8">Make it better</h1>
      {/* Upload Image Section */}
      <div className="bg-[#181818] rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-md mb-8">
        <h2 className="text-xl text-white font-semibold mb-4">Upload Image</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mb-4 text-white"
        />
        {img && (
          <img src={img} alt="Preview" className="rounded-xl max-h-48 mb-4" />
        )}
        <input
          type="text"
          placeholder="Edit image instructions..."
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-3 outline-none border-none placeholder:text-gray-400 mb-4"
          value={editPrompt}
          onChange={e => setEditPrompt(e.target.value)}
          disabled={editLoading}
        />
        <button
          className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleEditImage}
          disabled={editLoading || !img || !editPrompt}
        >
          {editLoading ? "Editing..." : "Edit Image"}
        </button>
        {editError && <div className="text-red-400 mt-4">{editError}</div>}
        {editPollingUrl && !editResult && (
          <div className="text-gray-400 mt-4">Waiting for edited image...</div>
        )}
        {editResult && (
          <div className="flex flex-col items-center mt-4">
            <img src={editResult} alt="Edited" className="rounded-xl max-h-48 mb-2" />
            <span className="text-xs text-gray-400 mt-2">Edited Image</span>
          </div>
        )}
      </div>
      {/* Text to Image Generation Section */}
      <div className="bg-[#181818] rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-md">
        <h2 className="text-xl text-white font-semibold mb-4">Generate Image from Text</h2>
        <input
          type="text"
          placeholder="Describe how to make it better..."
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-3 outline-none border-none placeholder:text-gray-400 mb-4"
          value={genPrompt}
          onChange={e => setGenPrompt(e.target.value)}
          disabled={genLoading}
        />
        <button
          className="bg-green-600 text-white font-semibold px-8 py-3 rounded-xl shadow hover:bg-green-700 transition disabled:opacity-50"
          onClick={handleGenerate}
          disabled={genLoading || !genPrompt}
        >
          {genLoading ? "Generating..." : "Submit"}
        </button>
        {genError && <div className="text-red-400 mt-4">{genError}</div>}
        {genResult && (
          <div className="flex flex-col items-center mt-4">
            <img src={genResult} alt="Generated" className="rounded-xl max-h-48 mb-2" />
            <span className="text-xs text-gray-400 mt-2">Generated Image</span>
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 
"use client";

import { useState } from 'react';

// API call functions
const callGenerateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
};

const callEditImage = async (prompt: string, sourceImage: string): Promise<string> => {
  try {
    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, sourceImage }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to edit image');
    }
    
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error editing image:', error);
    throw new Error('Failed to edit image');
  }
};

export default function LiveDemoWithApi() {
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
    <div className="w-full flex flex-col items-center">
      {/* Show generated image above input */}
      {genImage && (
        <img
          src={genImage}
          alt="Generated"
          className="rounded-2xl shadow-lg w-full max-w-md object-contain mb-8"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      )}
      <div className="w-full max-w-xl mx-auto mb-8 flex items-center justify-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="generate any image"
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 text-center"
          style={{ fontFamily: "monospace", letterSpacing: 1 }}
          disabled={genLoading}
        />
        <button
          className="ml-4 bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-2 rounded-xl shadow transition"
          onClick={handleGenerate}
          disabled={genLoading || !prompt}
        >
          {genLoading ? "Generating..." : "Create"}
        </button>
      </div>
      {genError && <div className="text-red-400 mb-4">{genError}</div>}

      {/* Show edited image above edit input */}
      {editImage && (
        <img
          src={editImage}
          alt="Edited"
          className="rounded-2xl shadow-lg w-full max-w-md object-contain mb-8"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      )}
      <div className="w-full max-w-xl mx-auto flex items-center justify-center mb-4">
        <input
          type="text"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="want to edit it? just type your change"
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 text-center"
          style={{ fontFamily: "monospace", letterSpacing: 1 }}
          disabled={editLoading || !genImage}
        />
        <button
          className="ml-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-2 rounded-xl shadow transition"
          onClick={handleEdit}
          disabled={editLoading || !editPrompt || !genImage}
        >
          {editLoading ? "Editing..." : "Edit"}
        </button>
      </div>
      <div className="flex gap-4 mb-8">
        <button
          className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-2 rounded-xl shadow transition"
          disabled={!genImage && !editImage}
        >
          Download
        </button>
        <button
          className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-2 rounded-xl shadow transition"
          disabled={!genImage && !editImage}
        >
          Share
        </button>
      </div>
      {editError && <div className="text-red-400 mb-4">{editError}</div>}
    </div>
  );
}

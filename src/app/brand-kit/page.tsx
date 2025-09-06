"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function BrandKitPage() {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPollingUrl, setEditPollingUrl] = useState<string | null>(null);

  const [genPrompt, setGenPrompt] = useState("");
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [brandKitPrompt, setBrandKitPrompt] = useState("");
  const [brandKitResult, setBrandKitResult] = useState<string | null>(null);
  const [brandKitLoading, setBrandKitLoading] = useState(false);
  const [brandKitError, setBrandKitError] = useState<string | null>(null);
  const [brandKitPollingUrl, setBrandKitPollingUrl] = useState<string | null>(null);

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

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Call edit image API
  const handleEditLogo = async () => {
    if (!logo || !editPrompt) return;
    setEditLoading(true);
    setEditError(null);
    setEditResult(null);
    setEditPollingUrl(null);
    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editPrompt, input_image: logo }),
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] relative">
      <button
        className="absolute top-8 left-8 bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition"
        onClick={() => router.push("/")}
      >
        ← Back
      </button>
      <h1 className="text-4xl font-bold text-white mb-8">Brand kit</h1>
      {/* Upload Logo Section */}
      <div className="bg-[#181818] rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-md mb-8">
        <h2 className="text-xl text-white font-semibold mb-4">Upload Logo</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handleLogoUpload}
          className="mb-4 text-white"
        />
        {logo && (
          <>
            <img src={logo} alt="Logo preview" className="rounded-xl max-h-48 mb-4" />
            {/* Brand Kit Specifications Input */}
            <input
              type="text"
              placeholder="add brand kit specifications with reference of this logo"
              className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-3 outline-none border-none placeholder:text-gray-400 mb-4"
              value={brandKitPrompt}
              onChange={e => setBrandKitPrompt(e.target.value)}
              disabled={brandKitLoading}
            />
            <button
              className="bg-purple-600 text-white font-semibold px-8 py-3 rounded-xl shadow hover:bg-purple-700 transition disabled:opacity-50 mb-4"
              onClick={async () => {
                if (!logo || !brandKitPrompt) return;
                setBrandKitLoading(true);
                setBrandKitError(null);
                setBrandKitResult(null);
                setBrandKitPollingUrl(null);
                try {
                  const res = await fetch("/api/edit-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: brandKitPrompt, input_image: logo }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed to edit image");
                  if (data.polling_url) {
                    setBrandKitPollingUrl(data.polling_url);
                    // Poll for result
                    for (let i = 0; i < 30; i++) {
                      const pollRes = await fetch("/api/poll-edit-result", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ polling_url: data.polling_url }),
                      });
                      const pollData = await pollRes.json();
                      if (pollData.status === "Ready" && pollData.result?.sample) {
                        setBrandKitResult(pollData.result.sample);
                        setBrandKitLoading(false);
                        return;
                      }
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                    setBrandKitError("Timed out waiting for image result.");
                  } else if (data.image) {
                    setBrandKitResult(data.image);
                  } else {
                    setBrandKitError("No image or polling URL returned.");
                  }
                } catch (err: any) {
                  setBrandKitError(err.message);
                  setBrandKitLoading(false);
                } finally {
                  setBrandKitLoading(false);
                }
              }}
              disabled={brandKitLoading || !brandKitPrompt}
            >
              {brandKitLoading ? "Submitting..." : "Submit"}
            </button>
            {brandKitError && <div className="text-red-400 mt-2">{brandKitError}</div>}
            {brandKitPollingUrl && !brandKitResult && (
              <div className="text-gray-400 mt-2">Waiting for brand kit result...</div>
            )}
            {brandKitResult && (
              <div className="flex flex-col items-center mt-2">
                <img src={brandKitResult} alt="Brand Kit Result" className="rounded-xl max-h-48 mb-2" />
                <span className="text-xs text-gray-400 mt-2">Brand Kit Result</span>
              </div>
            )}
          </>
        )}
      </div>
      {/* Generate Without Logo Section */}
      <div className="bg-[#181818] rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-md">
        <h2 className="text-xl text-white font-semibold mb-4">Generate Without Logo</h2>
        <input
          type="text"
          placeholder="Generate without logo..."
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
          {genLoading ? "Generating..." : "Generate"}
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
  );
} 
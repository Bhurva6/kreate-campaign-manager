"use client";
import { useImageStore } from "../../store/imageStore";
import { useState } from "react";

export default function EditImagePage() {
  const img = useImageStore((s) => s.selectedImage);
  const [prompt, setPrompt] = useState("");
  const [pollingUrl, setPollingUrl] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!img) {
    return <div className="text-center text-red-400">No image selected.</div>;
  }

  // Polling function
  const pollForResult = async (url: string) => {
    setLoading(true);
    setError(null);
    setFinalImage(null);
    try {
      for (let i = 0; i < 30; i++) { // poll up to 30 times (~30s)
        const res = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url: url }),
        });
        const data = await res.json();
        if (data.status === "Ready" && data.result?.sample) {
          setFinalImage(data.result.sample);
          setLoading(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1s
      }
      setError("Timed out waiting for image result.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    setError(null);
    setFinalImage(null);
    setPollingUrl(null);
    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, input_image: img }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit image");
      if (data.polling_url) {
        setPollingUrl(data.polling_url);
        pollForResult(data.polling_url);
      } else if (data.image) {
        setFinalImage(data.image);
      } else {
        setError("No image or polling URL returned.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] px-4">
      <div className="max-w-3xl w-full flex flex-col items-center">
        <div className="flex flex-col md:flex-row gap-8 items-center w-full">
          {/* Original Image */}
          <div className="flex flex-col items-center">
            <img src={img} alt="To edit" className="rounded-xl max-h-96 mb-2" />
            <span className="text-xs text-gray-400 mt-2">Original Image</span>
          </div>
          {/* Final Edited Image */}
          {finalImage && (
            <div className="flex flex-col items-center">
              <img src={finalImage} alt="Edited" className="rounded-xl max-h-96 mb-2" />
              <span className="text-xs text-gray-400 mt-2">Edited Image</span>
            </div>
          )}
        </div>
        {/* Edit Input with Button inside */}
        <div className="relative w-full max-w-xl mt-8 mb-4">
          <input
            type="text"
            placeholder="how do you want to edit this image"
            className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 pr-32 outline-none border-none placeholder:text-gray-400"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
          />
          <button
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleEdit}
            disabled={loading || !prompt}
            style={{ minWidth: 90 }}
          >
            {loading ? "Editing..." : "Submit"}
          </button>
        </div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
        {pollingUrl && !finalImage && (
          <div className="text-gray-400 mt-4">Waiting for edited image...</div>
        )}
      </div>
    </div>
  );
} 
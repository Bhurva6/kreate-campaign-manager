"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaLinkedin, FaInstagram } from "react-icons/fa";

const platforms = [
  {
    name: "LinkedIn Post",
    logo: <FaLinkedin className="text-blue-700 text-2xl" />,
    layouts: ["1:1", "16:9"]
  },
  {
    name: "Instagram Post",
    logo: <FaInstagram className="text-pink-500 text-2xl" />,
    layouts: ["1:1", "4:5"]
  },
  {
    name: "Instagram Story",
    logo: <FaInstagram className="text-pink-500 text-2xl" />,
    layouts: ["9:16"]
  }
];

export default function CampaignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<{ [key: string]: boolean }>({});
  const [selectedPlatformLayouts, setSelectedPlatformLayouts] = useState<{ [key: string]: boolean }>({});
  const [schedule, setSchedule] = useState({ frequency: "once", time: "" });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handlePlatformCheck = (name: string) => {
    setSelectedPlatforms((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handlePlatformLayoutCheck = (platform: string, layout: string) => {
    const key = `${platform}__${layout}`;
    setSelectedPlatformLayouts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSchedule((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle form submission, API call, etc.
    router.push("/campaign-schedule");
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-2xl bg-[#181818] rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Create and schedule your campaign</h1>
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Input and File Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-white font-medium">Campaign Content</label>
            <input
              type="text"
              className="bg-[#222] text-white rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 mb-2"
              placeholder="What do you want to create"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 w-fit hover:bg-blue-700 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Files
            </button>
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((file, idx) => (
                <span key={idx} className="bg-[#222] text-gray-300 px-3 py-1 rounded-full text-xs">
                  {file.name}
                </span>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="text-white font-medium mb-2 block">Select Platforms & Aspect Ratios</label>
            <div className="flex flex-wrap gap-4">
              {platforms.flatMap((platform) =>
                platform.layouts.map((layout) => {
                  const key = `${platform.name}__${layout}`;
                  return (
                    <div key={key} className="bg-[#222] rounded-xl p-4 flex flex-col items-center min-w-[140px] relative border border-[#333]">
                      <div className="absolute top-2 right-2">
                        <input
                          type="checkbox"
                          checked={!!selectedPlatformLayouts[key]}
                          onChange={() => handlePlatformLayoutCheck(platform.name, layout)}
                          className="w-5 h-5 accent-blue-600"
                        />
                      </div>
                      <div className="mb-2">{platform.logo}</div>
                      <span className="text-white font-semibold text-sm mb-2 text-center">{platform.name}</span>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-400">{layout}</span>
                        <div
                          className={`border ${!!selectedPlatformLayouts[key] ? "border-blue-600" : "border-[#333]"} bg-[#111] rounded flex items-center justify-center text-xs text-gray-400`}
                          style={{ width: layout === "1:1" ? 36 : layout === "16:9" ? 48 : layout === "4:5" ? 32 : layout === "9:16" ? 24 : 36, height: layout === "1:1" ? 36 : layout === "16:9" ? 24 : layout === "4:5" ? 40 : layout === "9:16" ? 48 : 36 }}
                        >
                          {layout}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div className="flex flex-col gap-2">
            <label className="text-white font-medium">Schedule Posts</label>
            <div className="flex gap-4 flex-wrap">
              <label className="text-gray-300 flex items-center gap-2">
                Frequency:
                <select
                  name="frequency"
                  className="bg-[#222] text-white rounded px-2 py-1"
                  value={schedule.frequency}
                  onChange={handleScheduleChange}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="text-gray-300 flex items-center gap-2">
                Time:
                <input
                  type="time"
                  name="time"
                  className="bg-[#222] text-white rounded px-2 py-1"
                  value={schedule.time}
                  onChange={handleScheduleChange}
                />
              </label>
            </div>
          </div>

          {/* Generate Campaign Button */}
          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow hover:bg-blue-700 transition"
          >
            Generate Campaign
          </button>
        </form>
      </div>
    </div>
  );
} 
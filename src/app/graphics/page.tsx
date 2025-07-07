"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function GraphicsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] relative">
      <button
        className="absolute top-8 left-8 bg-[#222] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition"
        onClick={() => router.push("/")}
      >
        ← Back
      </button>
      <h1 className="text-4xl font-bold text-white">Graphics</h1>
    </div>
  );
} 
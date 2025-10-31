'use client';

import Link from 'next/link';

export default function CreateModelPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/fashion" className="text-[#3C38A4] hover:text-[#6C2F83] mb-8 inline-block">
          ← Back to Fashion
        </Link>
        <h1 className="text-3xl font-bold mb-8">Create Your Own Model</h1>
        <p className="text-lg mb-8">This feature is coming soon! You'll be able to create custom AI models for your photoshoots.</p>
        <div className="bg-white/10 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-xl font-semibold mb-4">Custom Model Creation</h2>
          <p className="text-white/70">Upload reference images, define characteristics, and generate unique models for your brand.</p>
        </div>
      </div>
    </div>
  );
}

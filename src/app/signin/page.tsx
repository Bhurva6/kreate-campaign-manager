'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] px-4">
      <div className="bg-white/10 rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-6">Sign In</h2>
        <div className="text-lime-300 font-semibold mb-4">Free forever, no card required</div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-lg bg-[#222] text-white border-none outline-none text-lg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-lg bg-[#222] text-white border-none outline-none text-lg"
        />
        <button className="w-full bg-lime-400 text-black font-semibold py-3 rounded-lg mb-4 hover:bg-lime-300 transition">Sign In</button>
        <button className="w-full bg-white/20 text-white font-semibold py-3 rounded-lg mb-4 hover:bg-white/30 transition flex items-center justify-center gap-2">
          <img src="/google.svg" alt="Google" className="w-5 h-5" /> Sign in with Google
        </button>
        <div className="text-gray-300 mt-2">
          New here?{' '}
          <span className="text-lime-300 cursor-pointer hover:underline" onClick={() => router.push('/signup')}>
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
} 
'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import OpenRoute from "@/components/OpenRoute";

export default function SignInPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      if (result.success) {
        // AuthContext handles the redirect automatically after successful login
        router.push("/home");
      }
    } catch (err: any) {
      if (err.message.startsWith('EMAIL_VERIFICATION_REQUIRED:')) {
        const emailFromError = err.message.split(':')[1];
        router.push(`/verify-email?email=${encodeURIComponent(emailFromError)}`);
      } else {
        setError(err.message || "Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await googleLogin();
      if (result.success) {
        // AuthContext handles the redirect automatically after successful Google login
        router.push("/home");
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OpenRoute>
      <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <Link href="/">
          <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} className="cursor-pointer" />
        </Link>
        <Link href="/signup">
          <button className="px-6 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 transition">
            Sign Up
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Welcome back
            </h1>
            <p className="text-gray-300 text-center mb-8">
              Sign in to your Juicebox account
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#222] text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-lime-400 transition placeholder:text-gray-400"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#222] text-white rounded-xl px-4 py-3 pr-12 outline-none border border-white/20 focus:border-lime-400 transition placeholder:text-gray-400"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-[#222] text-lime-400 focus:ring-lime-400"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-lime-400 hover:text-lime-300 transition"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold py-3 rounded-xl text-lg transition shadow-lg bg-gradient-to-r from-lime-400 to-lime-500 text-black hover:from-lime-300 hover:to-lime-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#111] text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-white/20 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-3" />
                Sign in with Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-lime-400 hover:text-lime-300 font-semibold transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </OpenRoute>
  );
} 
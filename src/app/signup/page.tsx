'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import OpenRoute from "@/components/OpenRoute";

export default function SignUpPage() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions.");
      setIsLoading(false);
      return;
    }

    try {
      await register(username, email, password);
      // Redirect to email verification page
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await googleLogin();
      // Google login handles authentication and redirect automatically
    } catch (err: any) {
      setError(err.message || "Google sign-up failed. Please try again.");
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
        <Link href="/signin">
          <button className="px-6 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition">
            Sign In
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Create your account
            </h1>
            <p className="text-gray-300 text-center mb-8">
              Join Juicebox and start creating amazing visuals
            </p>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#222] text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-lime-400 transition placeholder:text-gray-400"
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>

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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#222] text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-lime-400 transition placeholder:text-gray-400"
                  placeholder="Create a password"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#222] text-white rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-lime-400 transition placeholder:text-gray-400"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 mt-1 rounded border-white/20 bg-[#222] text-lime-400 focus:ring-lime-400"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
                  I agree to the{" "}
                  <Link href="/terms" className="text-lime-400 hover:text-lime-300 transition">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-lime-400 hover:text-lime-300 transition">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold py-3 rounded-xl text-lg transition shadow-lg bg-gradient-to-r from-lime-400 to-lime-500 text-black hover:from-lime-300 hover:to-lime-400 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
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
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-white/20 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-3" />
                Sign up with Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="text-lime-400 hover:text-lime-300 font-semibold transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </OpenRoute>
  );
} 
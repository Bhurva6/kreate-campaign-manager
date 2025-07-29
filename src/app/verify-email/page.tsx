"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaEnvelope, FaArrowLeft, FaStar, FaSpinner } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendOTP } = useAuth();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      // If no email in URL, redirect to signin
      router.push('/signin');
    }
  }, [searchParams, router]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyEmail(email, otp);
      setSuccess("Email verified successfully! Redirecting...");
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      await resendOTP(email);
      setSuccess("New OTP sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push("/signin")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
            <div className="flex items-center space-x-2">
              <FaStar className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Kreate</span>
            </div>
            <div className="w-20" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaEnvelope className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Verify your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-sm font-medium text-blue-600">{email}</p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 text-center mb-2">
                  Enter verification code
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={handleOtpChange}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend code"}
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Make sure to check your spam folder if you don't see the email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

import Script from 'next/script';
import { useAuth } from '@/lib/auth';
import { API } from '@/lib/config';
import axios from 'axios';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Play, Sparkles, Zap, Shield, Upload, CreditCard, Loader2 } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

// Types
interface Profile {
  credits: number;
  email?: string;
}

interface Package {
  credits: number;
  price: number;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PostAnimatorPage = () => {
  const { user, token, loading: authLoading, signInWithGoogle } = useAuth();
  const { theme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  
  // Animation functionality states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [packages, setPackages] = useState<Record<string, Package>>({});
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);

  useEffect(() => {
    // Always fetch packages on component mount
    fetchPackages();
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: getAuthHeaders()
      });
      setProfile(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const response = await axios.get(`${API}/packages`);
      console.log('Packages response:', response.data);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setPackagesLoading(false);
    }
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      // Calculate aspect ratio
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const aspectRatioText = `${img.width}×${img.height} (${ratio.toFixed(2)}:1)`;
        setImageAspectRatio(aspectRatioText);
        
        // Determine video aspect ratio (9:16 or 16:9)
        if (ratio < 1) {
          setVideoAspectRatio('9:16 (Portrait)');
        } else {
          setVideoAspectRatio('16:9 (Landscape)');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      // Call Perplexity API for prompt enhancement
      const response = await axios.post(
        '/api/perplexity-enhance', // Assuming you have this endpoint
        { prompt: prompt.trim() }
      );
      
      if (response.data.enhanced_prompt) {
        // Update the prompt input box with enhanced prompt
        setPrompt(response.data.enhanced_prompt);
        toast.success('Prompt enhanced successfully!');
      } else {
        throw new Error('No enhanced prompt received');
      }
    } catch (error: any) {
      console.error('Prompt enhancement error:', error);
      toast.error(error.response?.data?.error || 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    if (!user) {
      setShowAuth(true);
      return;
    }

    // Allow unlimited generation for golocostudios@gmail.com
    if (user.email !== 'golocostudios@gmail.com' && (profile?.credits || 0) <= 0) {
      toast.error('You need more credits to generate');
      setShowCreditsDialog(true);
      return;
    }

    setIsGenerating(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Use custom prompt if available, otherwise use default prompt
        const finalPrompt = prompt.trim() || 'Animate this image with smooth, natural motion';
        
        // Call the gif generation API
        const response = await axios.post(
          '/api/generate-gif',
          {
            prompt: finalPrompt,
            aspectRatio: videoAspectRatio?.includes('9:16') ? '9:16' : '16:9',
            sampleCount: 1,
            durationSeconds: "6",
            personGeneration: "allow_all",
            addWatermark: false,
            includeRaiReason: true,
            generateAudio: false,
            resolution: "720p",
            startingFrame: base64Image,
            finishingFrame: base64Image // Use same image for ending frame
          }
        );

        if (response.data.success && response.data.videos) {
          setGeneratedVideos(response.data.videos);
          toast.success('Video generated successfully!');
        } else {
          throw new Error(response.data.error || 'Failed to generate video');
        }
        
        // Refresh profile to update credits
        await fetchProfile();
      };
      reader.readAsDataURL(imageFile);
    } catch (error: any) {
      console.error('Video generation error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = (video: any, index: number) => {
    try {
      // Convert base64 to blob
      const base64Data = video.base64Data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: video.mimeType || 'video/mp4' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `motion-maker-video-${index + 1}.mp4`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Video downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  };

  const handleBuyCredits = async (packageId: string) => {
    try {
      const keyResponse = await axios.get(`${API}/razorpay-key`);
      const razorpayKey = keyResponse.data.key;

      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/checkout/session`,
        { package_id: packageId, origin_url: originUrl },
        { headers: getAuthHeaders() }
      );

      const orderId = response.data.session_id;

      if (!window.Razorpay) {
        toast.error('Payment system not loaded. Please refresh the page.');
        return;
      }

      const options = {
        key: razorpayKey,
        amount: packages[packageId].price * 100,
        currency: 'INR',
        name: 'MotionMaker',
        description: `${packages[packageId].credits} Credits`,
        order_id: orderId,
        handler: async function (razorpayResponse: RazorpayResponse) {
          try {
            await axios.post(
              `${API}/verify-payment`,
              {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              },
              { headers: getAuthHeaders() }
            );

            toast.success('Payment successful! Credits added to your account.');
            setShowCreditsDialog(false);
            await fetchProfile();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          email: user?.email || '',
          name: user?.displayName || ''
        },
        theme: {
          color: '#06b6d4'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initialize payment');
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">MotionMaker</span>
              
              {/* Credits Display for authenticated users who have uploaded an image */}
              {user && profile && imageFile && (
                <div className="ml-4 px-4 py-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-2 border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <div>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Credits</p>
                      <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
                        {profile.credits || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {user && profile?.email !== 'golocostudios@gmail.com' && imageFile && (
                <button
                  className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => setShowCreditsDialog(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Buy Credits
                </button>
              )}
              {/* Only show user profile if they have uploaded an image or are already authenticated and have done something */}
              {user && imageFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <img
                    src={user.photoURL || 'https://via.placeholder.com/40'}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-slate-900 dark:text-white hidden sm:block">
                    {user.displayName || user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
            <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">AI-Powered Video Generation</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Transform Your Posts into
            <span className="block text-cyan-500">Viral Animations</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
            Transform your social media posts into engaging animated content. Perfect for Instagram, TikTok, and YouTube.
          </p>

          
        </div>
      </section>

      {/* Create Animation Section */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900" data-scroll-to="creation">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            Create Your Animation
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Upload Image</h3>
              
              {!imagePreview ? (
                <label
                  htmlFor="image-upload"
                  className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 text-center cursor-pointer hover:border-cyan-500 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Click to upload an image</p>
                  <p className="text-sm text-slate-500">PNG, JPG, WEBP up to 10MB</p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto"
                    />
                  </div>
                  
                  {imageAspectRatio && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <span className="font-medium">Image:</span> {imageAspectRatio}
                      </p>
                      <p className="text-sm text-blue-900 dark:text-blue-100 mt-1">
                        <span className="font-medium">Video output:</span> {videoAspectRatio}
                      </p>
                    </div>
                  )}
                  
                  <button
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setImageAspectRatio(null);
                      setVideoAspectRatio(null);
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            {/* Animation Control Section */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Customize Animation</h3>
              
              <div className="space-y-4">
                {/* Main Animate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!imageFile || isGenerating}
                  className="w-full inline-flex items-center justify-center px-4 py-6 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-md shadow-sm text-lg font-medium disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Animate This'}
                </button>

                {/* Write Your Own Prompt Button */}
                {!showCustomPrompt ? (
                  <button
                    onClick={() => setShowCustomPrompt(true)}
                    disabled={isGenerating}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Write Your Own Prompt
                  </button>
                ) : (
                  <>
                    {/* Custom Prompt Input */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Custom Prompt
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          value={prompt}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                          placeholder="Describe the animation you want..."
                          className="min-h-[100px] flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleEnhancePrompt}
                          disabled={isEnhancing || !prompt.trim()}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isEnhancing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowCustomPrompt(false);
                            setPrompt('');
                          }}
                          disabled={isEnhancing}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {user && profile && (
                  <p className="text-sm text-center text-slate-500">
                    Cost: 1 credit • You have {profile.credits || 0} credits
                  </p>
                )}
                
                {!user && imageFile && (
                  <p className="text-sm text-center text-slate-500">
                    Click "Animate This" to sign in and start creating
                  </p>
                )}
                
                {!imageFile && (
                  <p className="text-sm text-center text-slate-500">
                    Upload an image to get started
                  </p>
                )}

                {/* Generated Videos Section */}
                {generatedVideos.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4">
                      🎉 Videos Generated Successfully!
                    </h4>
                    <div className="space-y-3">
                      {generatedVideos.map((video, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                              <Play className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Video {index + 1}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Ready for download
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadVideo(video, index)}
                            className="inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md shadow-sm text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Video
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setGeneratedVideos([]);
                        setImageFile(null);
                        setImagePreview(null);
                        setImageAspectRatio(null);
                        setVideoAspectRatio(null);
                        setShowCustomPrompt(false);
                        setPrompt('');
                      }}
                      className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-green-300 dark:border-green-600 rounded-md shadow-sm text-sm font-medium text-green-700 dark:text-green-200 bg-white dark:bg-slate-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      Start New Animation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            Why Choose MotionMaker?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Instant Generation
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Upload an image and watch it transform into a stunning video animation in seconds. No technical skills required.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                AI-Enhanced Prompts
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Our AI intelligently enhances your prompts to create more cinematic and professional video outputs.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Your Creations, Saved
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                All your generated videos are securely stored and accessible anytime from your personal dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Upload Image</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Select any image from your device to animate
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Add Prompt (Optional)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Describe the animation you want, or let AI enhance it for you
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Get Your Video</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Watch your image come to life with stunning animations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Create Magic?
          </h2>
          <p className="text-xl text-cyan-50 mb-8">
            Get your first video generation free. No credit card required.
          </p>
          <button
            onClick={() => {
              // Always scroll to creation section - auth will happen when they try to generate
              document.querySelector('[data-scroll-to="creation"]')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white text-cyan-600 hover:bg-slate-100 px-8 py-6 text-lg rounded-xl transition-colors"
            data-testid="footer-cta-btn"
          >
            Start Creating
          </button>
        </div>
      </section>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />
      
      {/* Full Screen Loader */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="w-20 h-20 border-4 border-cyan-200 dark:border-cyan-800 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Creating Your Animation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Our AI is working its magic to bring your image to life. This usually takes 30-60 seconds.
            </p>
            
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please don't close this tab while we generate your video...
            </p>
          </div>
        </div>
      )}

      {/* Credits Dialog */}
      {showCreditsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-testid="credits-dialog">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Buy Credits</h2>
                <button 
                  onClick={() => setShowCreditsDialog(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {packagesLoading ? (
                  <div className="col-span-2 text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-400">Loading payment plans...</p>
                  </div>
                ) : Object.entries(packages).length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400">No payment plans available</p>
                    <button
                      onClick={fetchPackages}
                      className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  Object.entries(packages).map(([id, pkg]) => (
                    <div key={id} className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow" data-testid={`package-${id}`}>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{pkg.credits}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Credits</p>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">₹{pkg.price}</p>
                      </div>
                      <button
                        onClick={() => handleBuyCredits(id)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md shadow-sm text-sm font-medium"
                        data-testid={`buy-package-${id}-btn`}
                      >
                        Purchase
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PostAnimatorPage;
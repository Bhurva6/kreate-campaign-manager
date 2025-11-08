'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { Space_Grotesk } from 'next/font/google';
import { useAuth } from '@/lib/auth';
import axios from 'axios';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Play, Sparkles, Zap, Shield, Upload, Loader2 } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

// Font configuration
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

// Types - removed unused payment and profile types

const PostAnimatorPage = () => {
  const { user, token, loading: authLoading, signInWithGoogle } = useAuth();
  const { theme } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  
  // Animation functionality states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Debug effect to track isGenerating state changes
  useLayoutEffect(() => {
    console.log('isGenerating state changed to:', isGenerating);
    if (isGenerating) {
      console.log('Loader should be visible now');
      // Force document body to not scroll when loader is active
      document.body.style.overflow = 'hidden';
    } else {
      console.log('Loader should be hidden now');
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to restore scroll on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isGenerating]);

  // Removed unused API functions that don't exist in this project



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is logged in first
    if (!user) {
      toast.error('Please sign in first to upload images');
      setShowAuth(true);
      // Reset the input value so the same file can be selected again after login
      e.target.value = '';
      return;
    }

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

    // No credit checking needed for this demo

    console.log('About to set isGenerating to true');
    
    // Use flushSync to force synchronous state update
    flushSync(() => {
      setIsGenerating(true);
      setGenerationError(null); // Clear any previous errors
    });
    
    console.log('isGenerating state should now be true');
    
    // Force a small delay to ensure DOM update is processed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
      
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
      
      // No need to refresh profile since we're not using credits
    } catch (error: any) {
      console.error('Video generation error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate video';
      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('Video generation finished, hiding loader...');
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

  // Removed payment functionality as no payment APIs exist in this project

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-space-grotesk ${spaceGrotesk.className}`} style={{ fontFamily: spaceGrotesk.style.fontFamily }}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Post Animator</span>
            </div>
            
            <div className="flex items-center gap-3">
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
            Transform Images into
            <span className="block text-cyan-500">Viral Animations</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
Upload an image, click animate, and watch AI bring it to life with cinematic motion.          </p>

          
        </div>
        <div className="max-w-6xl mx-auto">
        
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Upload Image</h3>
              
              {!imagePreview ? (
                <label
                  htmlFor="image-upload"
                  className={`block border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                    user 
                      ? 'border-slate-300 dark:border-slate-600 cursor-pointer hover:border-cyan-500' 
                      : 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${user ? 'text-slate-400' : 'text-slate-300'}`} />
                  <p className={`mb-2 ${user ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {user ? 'Click to upload an image' : 'Sign in to upload an image'}
                  </p>
                  <p className={`text-sm ${user ? 'text-slate-500' : 'text-slate-400'}`}>
                    {user ? 'PNG, JPG, WEBP up to 10MB' : 'Authentication required'}
                  </p>
                  {!user && (
                    <button
                      type="button"
                      onClick={() => setShowAuth(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md shadow-sm text-sm font-medium transition-colors"
                    >
                      Sign In to Continue
                    </button>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={!user}
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
                      setGenerationError(null);
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
                  onClick={() => {
                    console.log('Animate button clicked, current isGenerating:', isGenerating);
                    handleGenerate();
                  }}
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

                {/* Generation Status Text */}
                {isGenerating && (
                  <div className="text-center">
                    <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium animate-pulse">
                      Generating your video...
                    </p>
                  </div>
                )}
                
                {/* Error Display */}
                {generationError && !isGenerating && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                          Generation Failed
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-200">
                          {generationError}
                        </p>
                        <button
                          onClick={() => setGenerationError(null)}
                          className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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

                {!user && (
                  <p className="text-sm text-center text-slate-500">
                    Please sign in to upload images and create animations
                  </p>
                )}
                
                {user && !imageFile && (
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
                        setGenerationError(null);
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
            Why Choose Post Animator?
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
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: isGenerating ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '400px',
            width: '100%',
            padding: '32px',
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 16px auto', 
              position: 'relative' 
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                border: '4px solid #e2e8f0',
                borderRadius: '50%'
              }}></div>
              <div style={{
                width: '80px',
                height: '80px',
                border: '4px solid #06b6d4',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                position: 'absolute',
                top: 0,
                left: 0
              }}></div>
            </div>
          </div>
          
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Generating your video...
          </h3>
          <p style={{
            color: '#64748b',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            Please wait while our AI creates your animation. This usually takes 30-60 seconds.
          </p>
          
          <div style={{
            backgroundColor: '#f1f5f9',
            borderRadius: '999px',
            height: '8px',
            marginBottom: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(to right, #22d3ee, #06b6d4)',
              height: '8px',
              width: '70%',
              borderRadius: '999px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></div>
          </div>
          
          <p style={{
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            Please don&apos;t close this tab while we generate your video...
          </p>
          
        
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Credits Dialog removed - no payment functionality in this demo */}
    </div>
    </>
  );
};

export default PostAnimatorPage;
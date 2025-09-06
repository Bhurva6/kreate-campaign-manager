"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { useCredits } from "../../lib/credits";
import { useImageOperations } from "../../hooks/useImageOperations";

// No longer need tab types since we're using a separate page for My Creations
import { getSafeImageUrl, handleImageError } from "@/lib/image-utils";

// Type for user images
interface UserImage {
  key: string;
  url: string;
  publicUrl: string;
  metadata?: {
    prompt?: string;
    category?: string;
    uploadedAt?: string;
  };
}

// Helper for API calls
async function callGenerateImage(prompt: string, userId?: string) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, sampleCount: 1, aspectRatio: "1:1", userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate image");
  
  // Return the public URL from R2 if available, otherwise use the original URL
  if (data.images && data.images.length > 0) {
    return data.images[0].r2?.publicUrl || data.images[0].url;
  }
  throw new Error("No image generated");
}

/**
 * Deprecated: This function is replaced by direct API calls in handleDemoEdit.
 * Keeping it for reference and backward compatibility.
 */
async function callEditImage(prompt: string, input_image: string) {
  try {
    // Prepare the request body and validate it
    const requestBody = { prompt, input_image };
    
    // Check if the input_image string is reasonable in size
    if (input_image.length > 20 * 1024 * 1024) { // 20MB limit
      throw new Error("Image data too large (max 20MB)");
    }
    
    // Validate input_image is a proper data URL
    if (!input_image.startsWith('data:image/')) {
      throw new Error("Invalid image format - must be a data URL");
    }
    
    console.log("callEditImage is deprecated, use direct API calls instead");
    
    const res = await fetch("/api/edit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    
    // Handle non-JSON responses
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response");
    }
    
    // Parse JSON response with error handling
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      throw new Error("Failed to parse server response");
    }
    
    if (!res.ok) {
      // Handle rate limiting specially
      if (res.status === 429) {
        console.log("Rate limited - duplicate request detected");
        throw new Error("Duplicate request detected. Please wait before trying again.");
      }
      throw new Error(data.error || "Failed to edit image");
    }
    
    // If we get a polling_url, we need to poll for results
    if (data.polling_url) {
      return await pollEditResult(data.polling_url, prompt);
    }
    
    // If we get a direct result
    return data.image || (data.result && data.result.sample);
  } catch (error: any) {
    console.error("Edit image error:", error);
    throw error;
  }
}

// Global state to track active pollings and avoid duplicate requests
const activePollings = new Set<string>();

// Improved polling with exponential backoff and better status updates
async function pollEditResult(polling_url: string, prompt: string, onProgress?: (message: string) => void): Promise<string> {
  const maxAttempts = 30; // Maximum number of attempts
  let attempts = 0;
  
  // Use URL as unique identifier for this polling session
  const pollingId = polling_url.split('?')[0]; // Remove query params for cleaner ID
  
  // Check if we're already polling this URL to avoid duplicate polling sequences
  if (activePollings.has(pollingId)) {
    console.log(`Already polling ${pollingId}, using existing poll`);
    
    // Wait for existing polling to complete or timeout after 30 seconds
    let waitAttempts = 0;
    while (activePollings.has(pollingId) && waitAttempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitAttempts++;
    }
    
    // If we're still polling, something went wrong
    if (activePollings.has(pollingId)) {
      activePollings.delete(pollingId);
      throw new Error("Polling timed out - please try again");
    }
    
    // The other polling process should have updated the UI
    throw new Error("Another edit operation completed");
  }
  
  // Mark this URL as being polled
  activePollings.add(pollingId);
  console.log(`Started polling ${pollingId}`);
  
  try {
    while (attempts < maxAttempts) {
      try {
        // Calculate wait time with exponential backoff (1s, 1.5s, 2s, 2.5s...)
        // This reduces server load while still being responsive
        const waitTime = Math.min(1000 + (attempts * 500), 3000);
        
        // Update progress with attempt count
        if (onProgress) {
          const progressStage = attempts <= 1 ? "Initiating edit..." : 
                               attempts < 5 ? "Processing your edit..." :
                               attempts < 15 ? "Working on details..." : 
                               "Finalizing your image...";
          onProgress(progressStage);
        }
        
        const res = await fetch("/api/poll-edit-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polling_url, prompt }),
        });
        
        // Handle non-JSON responses
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response during polling");
        }
        
        // Parse JSON with error handling
        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          throw new Error("Failed to parse polling response");
        }
        
        if (!res.ok) throw new Error(data.error || "Failed to poll edit result");
        
        // Success case
        if (data.status === "Ready" && data.result?.sample) {
          console.log(`Polling completed successfully for ${pollingId} after ${attempts + 1} attempts`);
          // Return R2 URL if available, otherwise the original URL
          return data.r2?.publicUrl || data.result.sample;
        }
        
        // Error case
        if (data.status === "Error") {
          const errorMessage = data.error || "Image editing failed";
          console.error(`Edit processing error for ${pollingId}:`, errorMessage);
          throw new Error(errorMessage);
        }
        
        // Progress update if available
        if (data.progress && onProgress) {
          onProgress(`${data.progress}...`);
        }
        
        // Wait before polling again (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempts++;
      } catch (error: any) {
        if (error.message.includes("Failed to fetch")) {
          // Network error, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          continue;
        }
        throw error;
      }
    }
    
    // If we reached max attempts, throw timeout error
    throw new Error("Image editing timed out - please try again");
  } finally {
    // Always clean up the active polling entry
    activePollings.delete(pollingId);
    console.log(`Finished polling ${pollingId} (success or failure)`);
  }
}

export default function DemoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    imageGenerationsUsed,
    imageEditsUsed,
    isUnlimitedUser,
    showPricingModal,
    setShowPricingModal,
  } = useCredits();
  
  // Use our enhanced image operations hook with integrated credit management
  const {
    generateImages,
    editImage,
    pollEditResult,
    canUseImageGeneration,
    canUseImageEdit,
    error: operationError,
    setError: setOperationError,
    clearError: clearOperationError
  } = useImageOperations();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Demo state
  const [demoImage, setDemoImage] = useState<string | null>(null);
  const [demoPrompt, setDemoPrompt] = useState("");
  const [demoEditPrompt, setDemoEditPrompt] = useState("");
  const [demoGenerating, setDemoGenerating] = useState(false);
  const [demoEditing, setDemoEditing] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if there's an image URL in localStorage for editing and preload it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const editImageUrl = localStorage.getItem('editImageUrl');
      if (editImageUrl) {
        // Attempt to preload the image
        const img = new Image();
        img.onload = () => {
          console.log('Successfully preloaded image from localStorage');
          setDemoImage(editImageUrl);
          localStorage.removeItem('editImageUrl');
        };
        img.onerror = () => {
          console.error('Failed to preload image from localStorage:', editImageUrl);
          setDemoError('Failed to load the image from previous session. Please try again.');
          localStorage.removeItem('editImageUrl');
        };
        // Use the safe URL with proxy if needed
        img.src = getSafeImageUrl(editImageUrl);
      }
    }
  }, []);

  // Demo functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setDemoImage(imageDataUrl);
        setDemoError(null);
        setDemoSuccess("Image uploaded successfully! ✨");
        
        // If user is logged in, save the uploaded image to their collection
        if (user) {
          try {
            // Convert data URL to blob for upload
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            // Create form data for upload
            const formData = new FormData();
            formData.append('image', blob, file.name);
            formData.append('userId', user.uid);
            formData.append('prompt', 'Uploaded image');
            
            // Upload to server
            const uploadRes = await fetch('/api/upload-image', {
              method: 'POST',
              body: formData,
            });
            
            if (uploadRes.ok) {
              // Notify that a new image was created (for My Creations refresh)
              localStorage.setItem('newImageCreated', Date.now().toString());
            }
          } catch (error) {
            console.error('Failed to save uploaded image:', error);
          }
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setDemoSuccess(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Support both standard image types and HEIC format
      if (file.type.startsWith('image/') || 
          file.name.toLowerCase().endsWith('.heic') ||
          file.name.toLowerCase().endsWith('.heif') ||
          file.type.toLowerCase().includes('heic')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const imageDataUrl = e.target?.result as string;
          setDemoImage(imageDataUrl);
          setDemoError(null);
          setDemoSuccess("Image uploaded successfully! ✨");
          
          // If user is logged in, save the uploaded image to their collection
          if (user) {
            try {
              // Convert data URL to blob for upload
              const response = await fetch(imageDataUrl);
              const blob = await response.blob();
              
              // Create form data for upload
              const formData = new FormData();
              formData.append('image', blob, file.name);
              formData.append('userId', user.uid);
              formData.append('prompt', 'Uploaded image');
              
              // Upload to server
              const uploadRes = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
              });
              
              if (uploadRes.ok) {
                // Notify that a new image was created (for My Creations refresh)
                localStorage.setItem('newImageCreated', Date.now().toString());
              }
            } catch (error) {
              console.error('Failed to save uploaded image:', error);
            }
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => setDemoSuccess(null), 3000);
        };
        reader.readAsDataURL(file);
      } else {
        setDemoError("Please upload a valid image file");
      }
    }
  };

  // Updated handleDemoGenerate to use our enhanced hook
  const handleDemoGenerate = async () => {
    if (!demoPrompt.trim()) return;
    
    setDemoGenerating(true);
    setDemoError(null);
    setDemoSuccess(null);
    clearOperationError();
    
    try {
      // generateImages handles credit checking and consumption internally
      const imageResults = await generateImages(demoPrompt, 1, "1:1", user?.uid);
      
      if (imageResults && imageResults.length > 0) {
        // Get the URL from the returned image data
        setDemoImage(imageResults[0].url);
        setDemoSuccess("Image generated successfully! ✨");
        
        // Notify that a new image was created (for My Creations refresh)
        localStorage.setItem('newImageCreated', Date.now().toString());
        
        setTimeout(() => setDemoSuccess(null), 3000);
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      // Use error from operation if available, otherwise use the caught error
      setDemoError(operationError || err.message);
    } finally {
      setDemoGenerating(false);
    }
  };

  // Track last edit time to prevent duplicate submissions
  const [lastEditTime, setLastEditTime] = useState(0);

  // Updated handleDemoEdit to use our enhanced hook
  const handleDemoEdit = async () => {
    // Prevent duplicate submissions within 2 seconds
    const now = Date.now();
    if (now - lastEditTime < 2000) {
      console.log("Edit request prevented - too soon after last request");
      return;
    }
    setLastEditTime(now);
    
    // Standard validation checks
    if (!demoImage || !demoEditPrompt.trim()) return;
    
    // Prevent concurrent edit operations
    if (demoEditing) {
      console.log("Edit already in progress, ignoring duplicate request");
      return;
    }
    
    console.log("Edit image request initiated:", now);
    setDemoEditing(true);
    setDemoError(null);
    setDemoSuccess(null);
    clearOperationError();
    setEditingProgress("Starting edit...");
    try {
      let imageUrl = demoImage;
      
      // Handle image conversion with better error handling
      if (!demoImage.startsWith('data:')) {
        try {
          setEditingProgress("Converting image format...");
          
          // Use our proxy API for R2 images to avoid CORS issues
          const isR2Image = demoImage.includes('r2.cloudflarestorage.com') || 
                            demoImage.includes('.r2.') ||
                            demoImage.includes('cloudflare');
          
          let imageToFetch = demoImage;
          if (isR2Image) {
            // Use our proxy API to avoid CORS issues
            imageToFetch = `/api/proxy-image?url=${encodeURIComponent(demoImage)}`;
          }
          
          const response = await fetch(imageToFetch);
          if (!response.ok) throw new Error("Failed to fetch image");
          
          const blob = await response.blob();
          if (blob.size === 0) throw new Error("Empty image data");
          
          // Size validation - prevent overly large images (>10MB)
          if (blob.size > 10 * 1024 * 1024) {
            throw new Error("Image too large (max 10MB)");
          }
          
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Validate the data URL format
              if (!result || !result.startsWith('data:image/')) {
                reject(new Error("Invalid image format"));
                return;
              }
              resolve(result);
            };
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(blob);
          });
        } catch (convertError: any) {
          throw new Error(`Image preparation failed: ${convertError.message || "Unknown error"}`);
        }
      }
      
      setEditingProgress("Processing your edit...");
      
      try {
        // Use our enhanced editImage function which handles credit management internally
        const result = await editImage(demoEditPrompt, imageUrl);
        
        if (!result) {
          throw new Error("Edit operation failed - no result returned");
        }
        
        // Update UI with result
        setDemoImage(result.url);
        setDemoEditPrompt("");
        setDemoSuccess(`Edit applied successfully! ${7 - imageEditsUsed - 1} free edit${7 - imageEditsUsed - 1 === 1 ? '' : 's'} remaining ✨`);
        
        // Notify that a new image was created (for My Creations refresh)
        localStorage.setItem('newImageCreated', Date.now().toString());
      } catch (editError: any) {
        // If there's a specific polling error or other issue, handle it here
        if (editError.message === "Another edit operation completed") {
          // This is actually a success case - another polling operation completed
          console.log("Used result from another polling operation");
          return;
        }
        
        throw editError; // Rethrow to be caught by the outer catch block
      }
      
      setTimeout(() => setDemoSuccess(null), 3000);
    } catch (err: any) {
      console.error("Edit operation failed:", err.message);
      
      // Special handling for duplicate request errors
      if (err.message.includes("Duplicate request")) {
        // Just reset the UI without showing an error
        setDemoError("Please wait a moment before submitting again");
      } else {
        // Use error from operation if available, otherwise use the caught error
        setDemoError(operationError || err.message);
      }
    } finally {
      setDemoEditing(false);
      setEditingProgress("");
    }
  };

  const handleDemoReset = () => {
    setDemoImage(null);
    setDemoPrompt("");
    setDemoEditPrompt("");
    setDemoError(null);
    setDemoSuccess(null);
    setEditingProgress("");
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (!demoImage) return;
    
    // Use our utility function to get a safe URL
    const imageUrl = getSafeImageUrl(demoImage);
    
    // Create a download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'GoLoco-creation.png';
    
    // Track download attempt
    console.log(`Attempting to download image from: ${imageUrl}`);
    
    // Add error handling for download
    link.onerror = () => {
      console.error('Download failed');
      setDemoError('Download failed. Please try again.');
    };
    
    link.click();
  };

  // No longer need handleImageDelete function in demo page as we moved it to my-creations page

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F]' 
        : 'bg-gradient-to-br from-[#FDFBF7] via-[#FFFFFF] to-[#F8F8F8]'
    }`}>
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-4 md:p-6 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
            } backdrop-blur-sm`}
            title="Back to Home"
          >
            <span className="text-lg">←</span>
          </button>
          <div className={`text-2xl md:text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
          }`}>
            GoLoco Demo
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {user && (
            <button
              onClick={() => router.push('/my-creations')}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-[#F3752A]/20 text-white hover:bg-[#F3752A]/40' 
                  : 'bg-[#F3752A]/20 text-black hover:bg-[#F3752A]/40'
              } backdrop-blur-sm flex items-center gap-2`}
              title="View Your Creations"
            >
              <span className="text-sm">🖼️</span>
              <span className="hidden md:inline">My Creations</span>
            </button>
          )}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
            } backdrop-blur-sm`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main Demo Content */}
      <div className="flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className={`text-4xl md:text-6xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
            }`}>
              Try GoLoco Free
            </h1>
            <p className={`text-lg md:text-xl mb-6 max-w-3xl mx-auto transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
              Experience the power of AI image editing. Generate or upload an image, then edit it with simple text prompts. 
              Get 7 free edits to see the magic! ✨
            </p>
            
            {/* Edit Counter */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'bg-black/10 text-black border border-black/20'
            }`}>
              <span>🎯</span>
              <span>{imageEditsUsed}/7 free edits used</span>
              {imageEditsUsed < 7 && (
                <span className="text-[#E72C19] font-bold">
                  • {7 - imageEditsUsed} remaining
                </span>
              )}
              {isUnlimitedUser && (
                <span className="text-green-600 font-bold ml-2">Unlimited</span>
              )}
            </div>
          </div>
            {/* Demo Section - Only shown when logged in */}
      {user && (
        <div className={`w-full py-8 px-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-[#1E1E1E] border-b border-[#0171B9]/20' 
            : 'bg-[#FDFBF7] border-b border-[#0171B9]/20'
        }`}>
          <div className="max-w-4xl mx-auto">
            {/* Usage Display */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className={`flex-1 p-4 rounded-2xl border-2 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-[#333] border-[#0171B9]/20' 
                  : 'bg-white border-[#0171B9]/20'
              }`}>
              <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                {isUnlimitedUser ? '✨ Unlimited Access' : '🎯 Your Free Credits'}
              </h3>
              {isUnlimitedUser ? (
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  You have unlimited access to all features!
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                      }`}>Image Generations</span>
                      <span className={`text-sm font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                      }`}>{imageGenerationsUsed}/3</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#0171B9] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(imageGenerationsUsed / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                      }`}>Image Edits</span>
                      <span className={`text-sm font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                      }`}>{imageEditsUsed}/7</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#004684] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(imageEditsUsed / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}          {/* Main Demo Interface */}
          <div className={`rounded-3xl p-6 md:p-12 border-2 transition-colors duration-300 shadow-2xl ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20 shadow-[#F3752A]/10' 
              : 'bg-white border-[#F3752A]/20 shadow-[#F3752A]/5'
          }`}>
            
            {/* Image Display Area */}
            {demoImage ? (
              <div className="flex justify-center mb-8 md:mb-12">
                <div className="relative group">
                  <img
                    src={getSafeImageUrl(demoImage)}
                    alt="Demo Image"
                    className="rounded-2xl shadow-2xl max-w-full w-full object-contain border-4 border-white/20"
                    style={{ maxHeight: '400px', maxWidth: '600px' }}
                    onError={(e) => handleImageError(e, setDemoError)}
                    loading="eager"
                    crossOrigin="anonymous"
                  />
                  {(demoGenerating || demoEditing) && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center text-white">
                        <div className="animate-spin text-4xl md:text-5xl mb-4">⚡</div>
                        <div className="text-lg md:text-xl font-semibold">
                          {demoGenerating ? "Generating your image..." : editingProgress || "Editing..."}
                        </div>
                        <div className="text-sm opacity-70 mt-2">
                          This may take 10-30 seconds
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Action Buttons */}
                  {!demoGenerating && !demoEditing && (
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={handleDownload}
                        className="p-2 bg-[#F3752A] text-white rounded-full hover:bg-[#F53057] transition shadow-lg"
                        title="Download Image"
                      >
                        <span className="text-lg">📥</span>
                      </button>
                      <button
                        onClick={handleDemoReset}
                        className="p-2 bg-[#A20222] text-white rounded-full hover:bg-[#F3752A] transition shadow-lg"
                        title="Start Over"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-8 md:mb-12">
                <div className={`w-full max-w-lg h-64 md:h-80 rounded-2xl border-2 border-dashed border-[#F3752A]/40 flex flex-col items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-white/5' : 'bg-[#F2F2F2]'
                } ${demoGenerating ? 'animate-pulse' : ''}`}>
                  {demoGenerating ? (
                    <div className="text-center">
                      <div className="animate-spin text-6xl md:text-7xl mb-6">⚡</div>
                      <p className={`text-center font-semibold text-lg md:text-xl transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                      }`}>
                        Creating your image...
                      </p>
                      <p className={`text-center text-sm md:text-base mt-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                      }`}>
                        This may take 10-30 seconds
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-6xl md:text-7xl mb-6">🎨</div>
                      <p className={`text-center text-lg md:text-xl font-semibold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                      }`}>
                        Your canvas awaits
                      </p>
                      <p className={`text-center text-sm md:text-base transition-colors duration-300 ${
                        isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                      }`}>
                        Generate or upload an image to start creating
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Generation and Upload/Edit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-12">
              {/* Generate Image - Only shown when no image is present */}
              {!demoImage && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <span className="text-xl">🪄</span>
                      <h3 className="text-xl md:text-2xl font-bold text-[#F3752A]">Generate Image</h3>
                    </div>
                    <p className={`text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                    }`}>
                      Describe any image and watch AI create it
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <textarea
                      value={demoPrompt}
                      onChange={(e) => setDemoPrompt(e.target.value)}
                      placeholder="Describe your image... (e.g., 'a cat wearing sunglasses on a beach at sunset')"
                      className={`w-full h-24 text-base md:text-lg rounded-xl px-4 py-3 outline-none border-2 focus:border-[#F3752A] transition resize-none ${
                        isDarkMode 
                          ? 'bg-white/10 text-white border-[#F3752A]/20 placeholder:text-white/50' 
                          : 'bg-white text-[#1E1E1E] border-[#F3752A]/20 placeholder:text-black/50'
                      }`}
                      disabled={demoGenerating}
                    />
                    <button
                      onClick={handleDemoGenerate}
                      disabled={demoGenerating || !demoPrompt.trim()}
                      className="w-full px-6 py-4 rounded-xl bg-[#F3752A] text-white font-semibold hover:bg-[#F53057] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base md:text-lg shadow-lg hover:shadow-xl"
                    >
                      {demoGenerating ? (
                        <>
                          <div className="animate-spin text-xl">⚡</div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span className="text-lg">🪄</span>
                          Generate Image
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Image or Edit Image based on whether an image is present */}
              {!demoImage ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <span className="text-xl">📤</span>
                      <h3 className="text-xl md:text-2xl font-bold text-[#F53057]">Upload Image</h3>
                    </div>
                    <p className={`text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                    }`}>
                      Have an image? Upload it to start editing
                    </p>
                  </div>
                  
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer group min-h-[200px] flex flex-col justify-center ${
                      isDragOver 
                        ? 'border-[#F53057] bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20 scale-105 shadow-lg shadow-[#F53057]/20' 
                        : isDarkMode 
                          ? 'border-[#F53057]/30 hover:border-[#F53057] hover:bg-[#F53057]/5 hover:scale-102' 
                          : 'border-[#F53057]/30 hover:border-[#F53057] hover:bg-[#F53057]/5 hover:scale-102'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    <div className={`transition-all duration-300 ${isDragOver ? 'animate-bounce' : 'group-hover:scale-110'}`}>
                      <div className={`text-5xl md:text-6xl mb-4 transition-all duration-300 ${
                        isDragOver ? 'animate-pulse text-6xl md:text-7xl' : ''
                      }`}>
                        {isDragOver ? '🎯' : '📁'}
                      </div>
                      <p className={`font-bold text-lg md:text-xl mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                      } ${isDragOver ? 'text-[#F53057]' : ''}`}>
                        {isDragOver ? 'Perfect! Drop it here!' : 'Upload Your Image'}
                      </p>
                      <p className={`text-sm md:text-base mb-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                      }`}>
                        {isDragOver ? 'Release to upload and start editing' : 'Drag & drop your image here or click to browse'}
                      </p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all duration-300 ${
                        isDragOver 
                          ? 'bg-[#F53057] text-white' 
                          : isDarkMode 
                            ? 'bg-white/10 text-white opacity-70' 
                            : 'bg-black/10 text-black opacity-70'
                      }`}>
                        <span>✨</span>
                        <span>Supports JPG, PNG, GIF, WebP</span>
                      </div>
                    </div>
                    
                    {/* Animated border effect when dragging */}
                    {isDragOver && (
                      <div className="absolute inset-0 rounded-xl pointer-events-none">
                        <div className="absolute inset-0 rounded-xl border-2 border-[#F53057] animate-pulse"></div>
                        <div className="absolute inset-2 rounded-lg border-2 border-[#F53057]/50 animate-ping"></div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Show Edit Image area instead of Upload when image is present */
                <div className={`space-y-6 ${demoImage ? 'lg:col-span-2' : ''}`}>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <span className="text-xl">✏️</span>
                      <h3 className="text-xl md:text-2xl font-bold text-[#A20222]">Edit Your Image</h3>
                    </div>
                    <p className={`text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                    }`}>
                      Describe how you want to change your image
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <textarea
                      value={demoEditPrompt}
                      onChange={(e) => setDemoEditPrompt(e.target.value)}
                      placeholder="Tell me what to change... (e.g., 'make the sky purple and add stars' or 'add sunglasses to the person')"
                      className={`w-full h-24 text-base md:text-lg rounded-xl px-4 py-3 outline-none border-2 focus:border-[#A20222] transition resize-none ${
                        isDarkMode 
                          ? 'bg-white/10 text-white border-[#A20222]/20 placeholder:text-white/50' 
                          : 'bg-white text-[#1E1E1E] border-[#A20222]/20 placeholder:text-black/50'
                      }`}
                      disabled={demoEditing}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        handleDemoEdit();
                      }}
                      disabled={demoEditing || !demoEditPrompt.trim() || (imageEditsUsed >= 7 && !isUnlimitedUser)}
                      className="w-full px-6 py-4 rounded-xl bg-[#A20222] text-white font-semibold hover:bg-[#F3752A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base md:text-lg shadow-lg hover:shadow-xl"
                    >
                      {demoEditing ? (
                        <>
                          <div className="animate-spin text-xl">🔄</div>
                          {editingProgress || "Editing..."}
                        </>
                      ) : imageEditsUsed >= 7 && !isUnlimitedUser ? (
                        <>
                          <span>💎</span>
                          Upgrade for More Edits
                        </>
                      ) : (
                        <>
                          <span className="text-lg">🪄</span>
                          {isUnlimitedUser ? "Edit Image (Unlimited)" : `Edit Image (${7 - imageEditsUsed} remaining)`}
                        </>
                      )}
                    </button>
                    
                    {imageEditsUsed >= 1 && imageEditsUsed < 7 && !demoEditing && (
                      <div className="mt-2 p-3 bg-[#F53057]/10 border border-[#F53057]/20 rounded-xl text-center">
                        <p className="text-sm text-[#F53057] font-semibold">
                          🎯 {7 - imageEditsUsed} free edit{7 - imageEditsUsed === 1 ? '' : 's'} remaining! Make it count ✨
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Edit Section - Only shown in wider screens on larger devices */}
            {demoImage && (
              <div className="lg:hidden mt-2 mb-8">
                {/* This is intentionally empty, since the edit functionality is now in the grid above for all screen sizes */}
                {/* We keep this to maintain the spacing and layout */}
              </div>
            )}

            {/* Status Messages */}
            {(demoError || demoSuccess) && (
              <div className="mt-6 space-y-3">
                {demoError && (
                  <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-center flex items-center gap-3 justify-center">
                    <span className="text-xl">⚠️</span>
                    <span className="flex-1">{demoError}</span>
                    <button 
                      onClick={() => setDemoError(null)}
                      className="text-red-500 hover:text-red-700 font-bold text-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
                {demoSuccess && (
                  <div className="p-4 bg-green-100 border border-green-300 rounded-xl text-green-700 text-center flex items-center gap-3 justify-center">
                    <span className="text-xl">✅</span>
                    <span className="flex-1">{demoSuccess}</span>
                    <button 
                      onClick={() => setDemoSuccess(null)}
                      className="text-green-500 hover:text-green-700 font-bold text-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sample Prompts for Inspiration */}
            {!demoImage && !demoGenerating && (
              <div className="mt-8 space-y-4">
                <h4 className={`text-lg md:text-xl font-semibold text-center transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                }`}>
                  Need inspiration? Try these prompts:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "a golden retriever wearing a chef's hat cooking in a modern kitchen",
                    "a cozy coffee shop in winter with snow falling outside",
                    "a futuristic city at sunset with flying cars and neon lights",
                    "a magical forest with glowing mushrooms and fairy lights"
                  ].map((samplePrompt, index) => (
                    <button
                      key={index}
                      onClick={() => setDemoPrompt(samplePrompt)}
                      className={`p-4 rounded-xl text-sm md:text-base border-2 transition-all hover:scale-105 text-left ${
                        isDarkMode 
                          ? 'bg-white/5 border-[#F3752A]/30 text-white hover:border-[#F3752A] hover:bg-[#F3752A]/20' 
                          : 'bg-white border-[#F3752A]/30 text-[#1E1E1E] hover:border-[#F3752A] hover:bg-[#F3752A]/10'
                      }`}
                    >
                      <span className="text-[#F3752A] font-semibold">💡 </span>
                      {samplePrompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className={`rounded-2xl p-8 border-2 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20' 
                : 'bg-gradient-to-br from-[#F3752A]/5 to-[#F53057]/5 border-[#F3752A]/20'
            }`}>
              <h3 className={`text-2xl md:text-3xl font-bold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                Love what you see?
              </h3>
              <p className={`text-lg mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
              }`}>
                Upgrade to unlimited edits, higher resolution, and advanced features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className={`px-8 py-3 rounded-xl font-semibold transition border-2 ${
                    isDarkMode 
                      ? 'border-white/20 text-white hover:bg-white/10' 
                      : 'border-black/20 text-black hover:bg-black/10'
                  }`}
                >
                  Back to Home
                </button>
                <button
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#F3752A] via-[#F53057] to-[#A20222] text-white font-semibold hover:shadow-lg hover:shadow-[#F3752A]/25 transition"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 bg-white">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-4 text-[#E72C19]">Credits Exhausted!</h3>
              <div className="mb-4">
                <div className="text-sm mb-2">Your current usage:</div>
                <div className="space-y-1 text-xs">
                  <div>Image Generations: {imageGenerationsUsed}/3 used</div>
                  <div>Image Edits: {imageEditsUsed}/7 used</div>
                </div>
              </div>
              <p className="mb-6 text-[#1E1E1E] opacity-80">
                You&apos;ve reached your free limit. Upgrade to get up to 1400 images per month with our premium plans!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gray-200 text-[#1E1E1E] hover:bg-gray-300"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPricingModal(false);
                    router.push("/pricing");
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#0171B9] text-white font-semibold hover:bg-[#004684]"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

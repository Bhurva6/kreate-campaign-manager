"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";

// Type for user images
interface UserImage {
  key: string;
  url: string;
  publicUrl?: string;
  metadata?: {
    prompt?: string;
    uploadedAt?: string;
    category?: string;
    type?: 'generated' | 'edited';
    [key: string]: any;
  };
}

export default function MyCreationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // State for user images
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<UserImage[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'generated' | 'edited'>('all');
  const [loadingUserImages, setLoadingUserImages] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  
  // Function to fetch user's images
  const fetchUserImages = async () => {
    if (!user) return;
    
    try {
      setLoadingUserImages(true);
      const res = await fetch(`/api/user-images?userId=${user.uid}`);
      const data = await res.json();
      
      if (res.ok && data.images) {
        // Check if we actually have new images compared to previous load
        const prevCount = userImages.length;
        setUserImages(data.images);
        
        // Show success message if this is a refresh (not initial load) and we have new images
        if (lastUpdate > 0 && prevCount > 0 && data.images.length > prevCount) {
          const newCount = data.images.length - prevCount;
          setDemoSuccess(`${newCount} new ${newCount === 1 ? 'image' : 'images'} added!`);
          setTimeout(() => setDemoSuccess(null), 3000);
        }
      } else {
        console.error("Failed to fetch user images:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user images:", error);
    } finally {
      setLoadingUserImages(false);
    }
  };
  
  // Track when to refresh images
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  // Check localStorage for new image notifications
  useEffect(() => {
    const checkForNewImages = () => {
      const newImageNotification = localStorage.getItem('newImageCreated');
      if (newImageNotification) {
        // Clear the notification
        localStorage.removeItem('newImageCreated');
        // Trigger a refresh
        setLastUpdate(Date.now());
      }
    };
    
    // Check when component mounts
    checkForNewImages();
    
    // Also set up an interval to check periodically
    const intervalId = setInterval(checkForNewImages, 2000);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, []);
  
    // Fetch images when component loads or after an update notification
  useEffect(() => {
    if (user) {
      fetchUserImages();
    }
  }, [user, lastUpdate]);
  
  // Filter images based on selected filter
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredImages(userImages);
    } else {
      setFilteredImages(userImages.filter(img => 
        img.metadata?.type === selectedFilter
      ));
    }
  }, [userImages, selectedFilter]);

  // Handle delete user image
  const handleImageDelete = async (key: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        const res = await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        const data = await res.json();
        if (res.ok) {
          setUserImages(userImages.filter(image => image.key !== key));
          setDemoSuccess("Image deleted successfully.");
          setTimeout(() => setDemoSuccess(null), 3000);
        } else {
          setDemoError(data.error || "Failed to delete image.");
          setTimeout(() => setDemoError(null), 3000);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        setDemoError("An error occurred while deleting the image.");
        setTimeout(() => setDemoError(null), 3000);
      }
    }
  };

  // Handle navigate to demo to edit an image
  const handleEditImage = (imageUrl: string) => {
    // Store the image URL in localStorage
    localStorage.setItem('editImageUrl', imageUrl);
    // Navigate to demo page
    router.push('/demo');
  };

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
            onClick={() => router.push('/demo')}
            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
            } backdrop-blur-sm`}
            title="Back to Demo"
          >
            <span className="text-lg">←</span>
          </button>
          <div className={`text-2xl md:text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
          }`}>
            My Creations
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setLastUpdate(Date.now())}
            className={`p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 ${
              isDarkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
            } backdrop-blur-sm`}
            title="Refresh Images"
          >
            <span className="text-lg">🔄</span>
          </button>
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

      {/* Main Content */}
      <div className="flex flex-col items-center px-4 pb-16">
        <div className="w-full max-w-5xl mx-auto">
          {/* Status Messages */}
          {(demoError || demoSuccess) && (
            <div className="mt-6 mb-6 space-y-3">
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
          
          {/* Filter Controls */}
          <div className={`mb-6 flex items-center justify-center gap-4 ${
            isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
          }`}>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                selectedFilter === 'all' 
                  ? isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
                  : isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              All Images
            </button>
            <button
              onClick={() => setSelectedFilter('generated')}
              className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                selectedFilter === 'generated' 
                  ? isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
                  : isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Generated
            </button>
            <button
              onClick={() => setSelectedFilter('edited')}
              className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                selectedFilter === 'edited' 
                  ? isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
                  : isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Edited
            </button>
          </div>
          
          {/* Images Grid */}
          <div>
            {loadingUserImages ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin text-4xl md:text-5xl mb-4">⚡</div>
                <span className={`ml-3 font-semibold ${
                  isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                }`}>Loading your creations...</span>
              </div>
            ) : filteredImages.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredImages.map((image) => (
                    <div 
                      key={image.key} 
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-white/10 hover:border-white/30' 
                          : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <img 
                        src={image.publicUrl || image.url} 
                        alt={image.metadata?.prompt || "AI generated image"}
                        className="w-full aspect-square object-cover" 
                      />
                      
                      {/* Image Actions Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        {/* Image Type Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`text-xs py-1 px-2 rounded-full ${
                          image.metadata?.type === 'generated' 
                            ? 'bg-purple-500/80 text-white' 
                            : 'bg-blue-500/80 text-white'
                        }`}>
                          {image.metadata?.type === 'generated' ? 'AI Generated' : 'Edited'}
                        </span>
                      </div>
                        
                      {/* Image Metadata */}
                      {image.metadata?.prompt && (
                        <div className="text-white text-xs truncate mb-2">
                          {image.metadata.prompt.substring(0, 50)}
                          {image.metadata.prompt.length > 50 ? '...' : ''}
                        </div>
                      )}
                        
                        {/* Action Buttons */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-white/70">
                            {image.metadata?.uploadedAt ? new Date(image.metadata.uploadedAt).toLocaleDateString() : ''}
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleEditImage(image.publicUrl || image.url)}
                              className="p-1 bg-white/20 rounded-full hover:bg-white/40 transition"
                              title="Edit This Image"
                            >
                              <span className="text-xs">✏️</span>
                            </button>
                            <button 
                              onClick={() => handleImageDelete(image.key)}
                              className="p-1 bg-white/20 rounded-full hover:bg-[#A20222] transition"
                              title="Delete Image"
                            >
                              <span className="text-xs">🗑️</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                <div className="text-6xl mb-4">
                  {selectedFilter === 'all' ? '🖼️' : 
                   selectedFilter === 'generated' ? '✨' : '🖌️'}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {selectedFilter === 'all' ? 'No images yet' : 
                   selectedFilter === 'generated' ? 'No generated images yet' : 'No edited images yet'}
                </h3>
                <p>
                  {selectedFilter === 'all' ? 'Generate or upload images to see them here' :
                   selectedFilter === 'generated' ? 'Generate AI images to see them here' : 'Upload and edit images to see them here'}
                </p>
                <button
                  onClick={() => router.push('/demo')}
                  className={`mt-6 px-6 py-3 rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-black/10 hover:bg-black/20 text-black'
                  }`}
                >
                  {selectedFilter === 'all' ? 'Create Your First Image' :
                   selectedFilter === 'generated' ? 'Generate an Image' : 'Upload an Image'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

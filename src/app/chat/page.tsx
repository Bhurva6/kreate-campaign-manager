"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaImage, FaUpload, FaPaperPlane, FaPlus, FaTrash, FaEllipsisV } from "react-icons/fa";
import Image from "next/image";
import { useAuth } from "../../lib/auth";
import { useCredits } from "../../lib/credits";
import useChatSessions, { ChatMessage, ChatSession } from "../../hooks/useChatSessions";
import ConfirmModal from "../../components/ConfirmModal";

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { canUseImageGeneration, canUseImageEdit, consumeImageGeneration, consumeImageEdit } = useCredits();
  
  // Theme state (synced with main app)
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Chat state
  const {
    chatSessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    addMessage,
    deleteSession
  } = useChatSessions();
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // currentSession is provided by useChatSessions hook
  
  // Create a new chat session if none exists
  useEffect(() => {
    if (chatSessions.length === 0) {
      createNewSession();
    }
  }, [chatSessions.length]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Handle new chat creation
  const handleNewChat = () => {
    createNewSession();
    setUploadedImage(null);
    setInputValue('');
  };
  
  // Open delete confirmation modal
  const handleOpenDeleteModal = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  };
  
  // Handle delete chat confirmation
  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete);
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };
  
  // Handle cancel delete
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Require at least text input or an uploaded image
    if (!inputValue.trim() && !uploadedImage) return;
    
    // Create a new session if none exists
    if (!currentSession) {
      createNewSession();
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Store the input value and uploaded image locally since they'll be cleared
    const currentInputValue = inputValue;
    const currentUploadedImage = uploadedImage;
    
    // Add user message to current chat
    addMessage({
      role: 'user',
      content: currentInputValue,
      timestamp: new Date(),
      imageUrl: currentUploadedImage || undefined
    });
    
    // Clear input and start processing state
    setInputValue('');
    setIsProcessing(true);
    
    try {
      let responseContent = '';
      let generatedImageUrl = '';
      
      // Determine which API to call based on whether an image was uploaded
      if (currentUploadedImage) {
        // IMAGE EDITING FLOW - User uploaded an image
        if (canUseImageEdit) {
          try {
            console.log("Calling image edit API...");
            // Call the API to edit the image
            const response = await fetch('/api/chat-edit-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                prompt: currentInputValue, 
                input_image: currentUploadedImage 
              })
            });
            
            if (!response.ok) throw new Error('Failed to edit image');
            
            const data = await response.json();
            responseContent = 'I\'ve edited your image based on your prompt.';
            generatedImageUrl = data.image || data.result?.sample || '/jaynitog.jpeg';
            consumeImageEdit();
          } catch (error) {
            console.error("Image edit error:", error);
            responseContent = 'Sorry, there was an error editing your image.';
          }
        } else {
          responseContent = 'You\'ve used up all your image edits. Please upgrade your plan to continue.';
        }
      } else {
        // IMAGE GENERATION FLOW - User only provided text
        if (canUseImageGeneration) {
          try {
            console.log("Calling image generation API...");
            // Call the API to generate the image
            const response = await fetch('/api/chat-generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: currentInputValue })
            });
            
            if (!response.ok) throw new Error('Failed to generate image');
            
            const data = await response.json();
            responseContent = 'Here\'s the image I generated based on your prompt.';
            generatedImageUrl = data.image || data.result?.sample || '/cherryblossoms.jpeg';
            consumeImageGeneration();
          } catch (error) {
            console.error("Image generation error:", error);
            responseContent = 'Sorry, there was an error generating your image.';
          }
        } else {
          responseContent = 'You\'ve used up all your image generations. Please upgrade your plan to continue.';
        }
      }
      
      // Add assistant response
      addMessage({
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        imageUrl: generatedImageUrl || undefined
      });
      
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Add error message
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      });
    } finally {
      setIsProcessing(false);
      setUploadedImage(null);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?redirect=/chat');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-black text-white' : 'bg-[#FDFBF7] text-[#1E1E1E]'}`}>
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This will permanently remove all messages and generated images in this conversation."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDarkMode={isDarkMode}
      />
      {/* Header */}
      <header className={`flex justify-between items-center p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
        <div className="text-2xl font-bold" onClick={() => router.push('/')}>GoLoco</div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
        >
          <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`w-64 border-r p-4 flex flex-col ${isDarkMode ? 'border-white/10 bg-[#111]' : 'border-black/10 bg-[#F7F5F0]'}`}>
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 p-3 rounded-lg font-medium mb-4 transition-colors duration-300 bg-[#0171B9] text-white hover:bg-[#004684]"
          >
            <FaPlus /> New Chat
          </button>
          
          {/* Chat History */}
          <div className="flex-1 overflow-auto">
            <h2 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Recent Chats</h2>
            <ul className="space-y-1">
              {chatSessions.map((session) => (
                <li key={session.id} className="relative group">
                  <div
                    className={`flex items-start p-3 rounded-lg transition-colors duration-200 ${
                      currentSessionId === session.id 
                        ? (isDarkMode ? 'bg-white/10' : 'bg-black/10') 
                        : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5')
                    }`}
                  >
                    <button
                      onClick={() => setCurrentSessionId(session.id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium truncate">{session.title}</div>
                      <div className={`text-xs truncate ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        {session.lastMessage || 'New conversation'}
                      </div>
                    </button>
                    
                    {/* Delete button - visible on hover or when active */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteModal(session.id);
                      }}
                      className={`p-1.5 rounded-full opacity-0 ${
                        currentSessionId === session.id ? 'opacity-70' : 'group-hover:opacity-70'
                      } transition-opacity ${
                        isDarkMode 
                          ? 'hover:bg-red-800/70 text-white/70 hover:text-white' 
                          : 'hover:bg-red-100/70 text-black/50 hover:text-red-600'
                      }`}
                      title="Delete chat"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* User Info */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
            <div className="font-medium">{user?.displayName || user?.email}</div>
            <div className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
              {canUseImageGeneration ? 'Images available' : 'No images left'}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className={`text-6xl mb-4 ${isDarkMode ? 'opacity-30' : 'opacity-50'}`}>💬</div>
                <h2 className="text-xl font-bold mb-2">Start a conversation with Loco</h2>
                <p className={`max-w-md ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                  Describe the image you want to create or upload an image to edit
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentSession.messages.map((message, index) => (
                  <div
                    key={`${message.id || index}-${message.role}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-[#0171B9] text-white'
                          : isDarkMode
                          ? 'bg-white/10 text-white'
                          : 'bg-black/10 text-black'
                      }`}
                    >
                      {message.imageUrl && (
                        <div className="mb-3">
                          <img
                            src={message.imageUrl}
                            alt="Image content"
                            className="rounded-lg max-h-80 object-contain"
                          />
                        </div>
                      )}
                      <div>{message.content}</div>
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            {uploadedImage && (
              <div className="mb-4 relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded image"
                  className="h-32 object-contain rounded-lg"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className={`p-3 rounded-full ${
                  isDarkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-black/10 text-black hover:bg-black/20'
                } transition-colors disabled:opacity-50`}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaUpload />
                )}
              </button>
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isProcessing}
                placeholder={uploadedImage 
                  ? "Enter prompt to edit this image..." 
                  : "Describe the image you want to generate..."
                }
                className={`flex-1 p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-white/10 text-white placeholder:text-white/50 border border-white/10' 
                    : 'bg-black/10 text-black placeholder:text-black/50 border border-black/10'
                } outline-none`}
              />
              
              <button
                type="submit"
                disabled={(!inputValue.trim() && !uploadedImage) || isProcessing}
                className={`p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-[#0171B9] text-white hover:bg-[#004684]' 
                    : 'bg-[#0171B9] text-white hover:bg-[#004684]'
                } transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2`}
                title={uploadedImage ? "Edit image with this prompt" : "Generate image from prompt"}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaPaperPlane />
                    <span className="text-xs hidden sm:inline">
                      {uploadedImage ? "Edit Image" : "Generate Image"}
                    </span>
                  </>
                )}
              </button>
            </form>
            
            <div className={`text-xs mt-2 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
              {uploadedImage 
                ? 'Image uploaded! Enter a prompt to edit this image, then click "Edit Image".' 
                : 'Enter a detailed description of the image you want to generate, or upload an image to edit.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

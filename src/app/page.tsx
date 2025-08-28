"use client";
import { useState, useRef, useEffect } from "react";
import { FaImage, FaUpload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useImageStore } from "../store/imageStore";
import Image from "next/image";
import React from "react";
import { useAuth } from "../lib/auth";
import AuthModal from "../components/AuthModal";
import UserDropdown from "../components/UserDropdown";

type GeneratedImage = { url: string; prompt?: string };

// Typewriter animation for live demo
function useTypewriter(text: string, start: boolean) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!start) return;
    setTyped("");
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setTyped(text.slice(0, i));
        i++;
        setTimeout(type, 35);
      }
    };
    type();
  }, [start, text]);
  return typed;
}

// Helper for API calls
async function callGenerateImage(prompt: string) {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, sampleCount: 1, aspectRatio: "1:1" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate image");
  
  // Return the public URL from R2 if available, otherwise use the original URL
  if (data.images && data.images.length > 0) {
    return data.images[0].r2?.publicUrl || data.images[0].url;
  }
  throw new Error("No image generated");
}

async function callEditImage(prompt: string, input_image: string) {
  const res = await fetch("/api/edit-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, input_image }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to edit image");
  
  // If we get a polling_url, we need to poll for results
  if (data.polling_url) {
    return await pollEditResult(data.polling_url, prompt);
  }
  
  // If we get a direct result
  return data.image || (data.result && data.result.sample);
}

async function pollEditResult(polling_url: string, prompt: string): Promise<string> {
  const maxAttempts = 30; // 30 seconds max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const res = await fetch("/api/poll-edit-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polling_url, prompt }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to poll edit result");
    
    if (data.status === "Ready" && data.result?.sample) {
      // Return R2 URL if available, otherwise the original URL
      return data.r2?.publicUrl || data.result.sample;
    }
    
    if (data.status === "Error") {
      throw new Error("Image editing failed");
    }
    
    // Wait 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error("Image editing timed out");
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Scroll animation state for unify section
  const [scrollProgress, setScrollProgress] = useState(0);
  const unifyRef = useRef<HTMLDivElement>(null);
  
  // Scroll animation state for broken creativity section
  const [brokenCreativityProgress, setBrokenCreativityProgress] = useState(0);
  const brokenCreativityRef = useRef<HTMLDivElement>(null);
  
  // Pricing popup state
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  
  // Typing animation logic
  const fullText1 =
    'a box of cereal called "super crunch" is placed on a table near a window';
  const fullText2 =
    "now make it look like its in night time with blue cereal and blue box";
  const [typedText1, setTypedText1] = useState("");
  const [showArrow1, setShowArrow1] = useState(false);
  const [showImage1, setShowImage1] = useState(false);
  const [typedText2, setTypedText2] = useState("");
  const [showArrow2, setShowArrow2] = useState(false);
  const [showImage2, setShowImage2] = useState(false);
  useEffect(() => {
    setTypedText1("");
    setShowArrow1(false);
    setShowImage1(false);
    setTypedText2("");
    setShowArrow2(false);
    setShowImage2(false);
    let i = 0;
    const type1 = () => {
      if (i <= fullText1.length) {
        setTypedText1(fullText1.slice(0, i));
        i++;
        setTimeout(type1, 35);
      } else {
        setShowArrow1(true);
        setTimeout(() => setShowImage1(true), 600);
      }
    };
    type1();
  }, []);
  useEffect(() => {
    if (showImage1) {
      let j = 0;
      const type2 = () => {
        if (j <= fullText2.length) {
          setTypedText2(fullText2.slice(0, j));
          j++;
          setTimeout(type2, 35);
        } else {
          setShowArrow2(true);
          setTimeout(() => setShowImage2(true), 600);
        }
      };
      setTimeout(type2, 800);
    }
  }, [showImage1]);

  // Scroll-triggered typing animation hook
  function useScrollTypingAnimation(
    text: string,
    startDelay = 0
  ): [string, React.RefObject<HTMLDivElement | null>, boolean] {
    const [typed, setTyped] = useState("");
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [started]);
    useEffect(() => {
      if (!started) return;
      setTyped("");
      let i = 0;
      const type = () => {
        if (i <= text.length) {
          setTyped(text.slice(0, i));
          i++;
          setTimeout(type, 35);
        }
      };
      setTimeout(type, startDelay);
    }, [started, text, startDelay]);
    return [typed, ref, started];
  }

  type HowItWorksStepProps = {
    text: string | string[];
    image: string | string[];
    inputDelay?: number;
  };
  function HowItWorksStep({
    text,
    image,
    inputDelay = 0,
  }: HowItWorksStepProps) {
    const texts = Array.isArray(text) ? text : [text];
    const [typedArr, setTypedArr] = useState<string[]>(
      Array(texts.length).fill("")
    );
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [started]);
    useEffect(() => {
      if (!started) return;
      texts.forEach((t, idx) => {
        let i = 0;
        const type = () => {
          setTypedArr((prev) => {
            const copy = [...prev];
            copy[idx] = t.slice(0, i);
            return copy;
          });
          if (i < t.length) {
            i++;
            setTimeout(type, 35);
          }
        };
        setTimeout(type, inputDelay + idx * 300); // stagger animations
      });
    }, [started, texts, inputDelay]);
    const [showImage, setShowImage] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!imgRef.current) return;
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setShowImage(true);
        },
        { threshold: 0.5 }
      );
      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }, []);
    const images = Array.isArray(image) ? image : [image];
    return (
      <div className="w-full flex flex-col items-center justify-center gap-8 mb-24">
        <div
          ref={imgRef}
          className="w-full flex flex-row items-center justify-center gap-8 min-h-[220px] mb-8 overflow-x-auto whitespace-nowrap"
        >
          {showImage &&
            images.map((img, i) => (
              <img
                key={img + i}
                src={img}
                alt={Array.isArray(text) ? text[i] : text}
                className="rounded-2xl shadow-lg w-full max-w-md object-contain inline-block align-middle"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  display: "inline-block",
                }}
              />
            ))}
        </div>
        <div
          ref={ref}
          className="w-full max-w-2xl mx-auto flex flex-row items-center justify-center gap-8"
        >
          {typedArr.map((typed, idx) => (
            <input
              key={idx}
              type="text"
              value={typed}
              readOnly
              className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 text-center animate-blink-input"
              style={{ fontFamily: "monospace", letterSpacing: 1 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // GIF overlay state
  const [activeGif, setActiveGif] = useState<number | null>(null);
  // Close GIF on outside click
  useEffect(() => {
    if (activeGif === null) return;
    const handle = (e: MouseEvent) => {
      // Only close if clicking the overlay, not the GIF itself
      if ((e.target as HTMLElement)?.id === "gif-overlay-bg") {
        setActiveGif(null);
      }
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [activeGif]);

  // Scroll effect for both Unify and Broken Creativity sections
  useEffect(() => {
    const handleScroll = () => {
      // Handle Unify section scroll
      if (unifyRef.current) {
        const rect = unifyRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementHeight = rect.height;
        
        // Calculate scroll progress when element is in viewport
        if (rect.top <= windowHeight && rect.bottom >= 0) {
          // Create a longer animation range for the stacking effect
          const startTrigger = windowHeight * 1.2; // Start when element is above viewport
          const endTrigger = -elementHeight * 0.5; // End when element is mostly out of top
          const totalRange = startTrigger - endTrigger;
          
          const progress = Math.max(0, Math.min(1, 
            (startTrigger - rect.top) / totalRange
          ));
          setScrollProgress(progress);
        } else if (rect.top > windowHeight) {
          // Element hasn't entered viewport yet
          setScrollProgress(0);
        } else if (rect.bottom < 0) {
          // Element has left viewport
          setScrollProgress(1);
        }
      }

      // Handle Broken Creativity section scroll
      if (brokenCreativityRef.current) {
        const rect = brokenCreativityRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementHeight = rect.height;
        
        // Calculate progress when section is in view
        if (rect.top <= windowHeight && rect.bottom >= 0) {
          // Start animation when section enters viewport (bottom of section hits bottom of viewport)
          // Complete animation when section is fully in view (top of section hits top of viewport)
          const startTrigger = windowHeight; // Start when section starts entering
          const endTrigger = 0; // Complete when section top reaches viewport top
          const totalRange = startTrigger - endTrigger;
          
          const progress = Math.max(0, Math.min(1, 
            (startTrigger - rect.top) / totalRange
          ));
          setBrokenCreativityProgress(progress);
        } else if (rect.top > windowHeight) {
          // Element hasn't entered viewport yet
          setBrokenCreativityProgress(0);
        } else if (rect.bottom < 0) {
          // Element has left viewport
          setBrokenCreativityProgress(1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-black font-sans">
      {/* First Viewport - Completely Black */}
      <div className="min-h-screen flex flex-col bg-black relative">
        {/* Logo Top Left and Auth Buttons Top Right */}
        <div className="flex flex-row justify-between items-center w-full p-4 md:p-6 bg-black z-10">
          <div className="text-2xl md:text-3xl font-bold text-white">Surreal</div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="text-xl md:text-2xl">
                {isDarkMode ? '☀️' : '🌙'}
              </span>
            </button>
            
            {/* Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : user ? (
              <UserDropdown />
            ) : (
              <>
                <button
                  className="px-3 py-1.5 md:px-6 md:py-2 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign In
                </button>
                <button
                  className="px-3 py-1.5 md:px-6 md:py-2 rounded-lg bg-gradient-to-r from-[#F3752A] via-[#F53057] to-[#A20222] text-white font-semibold hover:shadow-lg hover:shadow-[#F3752A]/25 transition-all duration-300 text-sm md:text-base"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero Content - Full Black Viewport */}
        <div className="flex-1 flex flex-col justify-end px-4 md:px-8 lg:px-12 pb-16 lg:pb-24 relative bg-black">
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-900/30"></div>
          
          {/* Content - Bottom left aligned */}
          <div className="relative z-10 text-left max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              One Image. <span 
                className="bg-gradient-to-r from-[#F3752A] via-[#F53057] to-[#A20222] bg-clip-text text-transparent"
                
              >
                Endless
              </span> Worlds.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mb-8 leading-relaxed">
              Remix reality at <em className="font-medium text-white">lightning speed</em> — your ideas, consistent and unstoppable.
            </p>
            
            {/* CTA Button */}
            <button
              className="inline-flex items-center gap-3 font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-lg sm:text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 bg-gradient-to-r from-[#F3752A] via-[#F53057] to-[#A20222] text-white hover:shadow-[#F3752A]/30"
              onClick={() => {
                if (user) {
                  router.push("/demo");
                } else {
                  setShowAuthModal(true);
                }
              }}
            >
              <span>✨</span>
              Get Started Free
              <span className="text-sm opacity-80">→</span>
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content sections with theme-aware background */}
      <div className={`transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#1E1E1E]' 
          : 'bg-[#FDFBF7]'
      }`}>
    

      {/* Unify Your Creations Section - Jeton Inspired */}
      <div 
        ref={unifyRef}
        className="w-full py-32 md:py-48 px-4 relative overflow-hidden"
      >
        {/* Overlapping Images Container with Centered Text - Deck of Cards Effect */}
        <div 
          className="relative max-w-4xl mx-auto h-[400px] md:h-[500px] transition-all duration-1000 ease-out"
        >
          {/* Centered Title - Behind Images */}
          <div 
            className="absolute inset-0 flex items-center justify-center text-center transition-all duration-1500 ease-out z-5 pointer-events-none"
            style={{
              transform: `scale(${Math.max(0.3, 2 - scrollProgress * 1.7)})`,
              opacity: 1
            }}
          >
            <h2 className={`text-6xl md:text-8xl lg:text-9xl font-bold leading-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
            }`}>
              Unify your
              <br />
              <span className="bg-gradient-to-r from-[#F3752A] via-[#F53057] to-[#A20222] bg-clip-text text-transparent">
                creations
              </span>
            </h2>
          </div>
          {/* Image 1 - First card (bottom of stack when stacked) */}
          <div 
            className="absolute transition-all duration-1500 ease-out"
            style={{
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%) 
                translateX(${scrollProgress < 0.6 ? -800 + scrollProgress * 1333 : scrollProgress > 0.9 ? 0 : (scrollProgress - 0.6) * -133}px)
                translateY(${scrollProgress < 0.6 ? -400 + scrollProgress * 667 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 600 : 0}px)
                rotate(${scrollProgress < 0.6 ? -45 + scrollProgress * 75 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * -200 : 0}deg)
                scale(${Math.max(0.6, 0.3 + scrollProgress * 0.7)})
              `,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.3) * 3.33)),
              zIndex: scrollProgress > 0.9 ? 1 : 5
            }}
          >
            <div className="w-48 h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
              <img
                src="/artistic.jpeg"
                alt="Creative process"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Image 2 - Second card */}
          <div 
            className="absolute transition-all duration-1500 ease-out"
            style={{
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%) 
                translateX(${scrollProgress < 0.65 ? 600 - scrollProgress * 923 : scrollProgress > 0.9 ? 10 : (scrollProgress - 0.65) * -40}px)
                translateY(${scrollProgress < 0.65 ? 300 - scrollProgress * 462 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 400 : 0}px)
                rotate(${scrollProgress < 0.65 ? 30 - scrollProgress * 46 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * -100 : 0}deg)
                scale(${Math.max(0.65, 0.4 + scrollProgress * 0.6)})
              `,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.4) * 4)),
              zIndex: scrollProgress > 0.9 ? 2 : 4
            }}
          >
            <div className="w-50 h-62 md:w-58 md:h-74 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
              <img
                src="/vibrant.jpeg"
                alt="AI editing"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Image 3 - Center card (top of stack when stacked) */}
          <div 
            className="absolute transition-all duration-1500 ease-out"
            style={{
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%) 
                translateX(${scrollProgress < 0.7 ? 0 : scrollProgress > 0.9 ? 0 : 0}px)
                translateY(${scrollProgress < 0.7 ? 200 - scrollProgress * 286 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 200 : 0}px)
                rotate(${scrollProgress > 0.9 ? 0 : 0}deg)
                scale(${Math.max(0.7, 0.5 + scrollProgress * 0.5)})
              `,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.5) * 5)),
              zIndex: scrollProgress > 0.9 ? 5 : 3
            }}
          >
            <div className="w-56 h-68 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 hover:scale-105 transition-transform duration-300">
              <img
                src="/minimalist.jpeg"
                alt="Perfect creation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Image 4 - Fourth card */}
          <div 
            className="absolute transition-all duration-1500 ease-out"
            style={{
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%) 
                translateX(${scrollProgress < 0.75 ? -600 + scrollProgress * 800 : scrollProgress > 0.9 ? -10 : (0.75 - scrollProgress) * -40}px)
                translateY(${scrollProgress < 0.75 ? -300 + scrollProgress * 400 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 400 : 0}px)
                rotate(${scrollProgress < 0.75 ? -30 + scrollProgress * 40 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 100 : 0}deg)
                scale(${Math.max(0.65, 0.4 + scrollProgress * 0.6)})
              `,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.6) * 6.67)),
              zIndex: scrollProgress > 0.9 ? 2 : 2
            }}
          >
            <div className="w-50 h-62 md:w-58 md:h-74 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
              <img
                src="/photorealistic.jpeg"
                alt="Share creation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Image 5 - Fifth card (bottom when stacked) */}
          <div 
            className="absolute transition-all duration-1500 ease-out"
            style={{
              left: '50%',
              top: '50%',
              transform: `
                translate(-50%, -50%) 
                translateX(${scrollProgress < 0.8 ? 800 - scrollProgress * 1000 : scrollProgress > 0.9 ? -20 : (0.8 - scrollProgress) * -200}px)
                translateY(${scrollProgress < 0.8 ? -400 + scrollProgress * 500 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 600 : 0}px)
                rotate(${scrollProgress < 0.8 ? 45 - scrollProgress * 56.25 : scrollProgress > 0.9 ? (scrollProgress - 0.9) * 200 : 0}deg)
                scale(${Math.max(0.6, 0.3 + scrollProgress * 0.7)})
              `,
              opacity: Math.min(1, Math.max(0, (scrollProgress - 0.7) * 10)),
              zIndex: scrollProgress > 0.9 ? 1 : 1
            }}
          >
            <div className="w-46 h-58 md:w-54 md:h-70 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
              <img
                src="/illustration.jpeg"
                alt="Endless possibilities"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Floating particles that appear during stacking */}
          <div 
            className="absolute w-3 h-3 bg-[#F3752A] rounded-full animate-pulse"
            style={{
              left: `${50 + Math.sin(scrollProgress * 10) * 20}%`,
              top: `${30 + Math.cos(scrollProgress * 8) * 15}%`,
              opacity: scrollProgress > 0.85 ? (scrollProgress - 0.85) * 6.67 : 0,
              transform: `scale(${0.5 + scrollProgress * 0.5})`
            }}
          ></div>
          <div 
            className="absolute w-2 h-2 bg-[#F53057] rounded-full animate-pulse"
            style={{
              right: `${40 + Math.sin(scrollProgress * 12) * 25}%`,
              bottom: `${25 + Math.cos(scrollProgress * 9) * 20}%`,
              opacity: scrollProgress > 0.9 ? (scrollProgress - 0.9) * 10 : 0,
              animationDelay: '0.5s',
              transform: `scale(${0.3 + scrollProgress * 0.7})`
            }}
          ></div>
          <div 
            className="absolute w-1.5 h-1.5 bg-[#A20222] rounded-full animate-pulse"
            style={{
              left: `${70 + Math.sin(scrollProgress * 15) * 15}%`,
              top: `${60 + Math.cos(scrollProgress * 11) * 10}%`,
              opacity: scrollProgress > 0.95 ? (scrollProgress - 0.95) * 20 : 0,
              animationDelay: '1s',
              transform: `scale(${0.2 + scrollProgress * 0.8})`
            }}
          ></div>
        </div>
      </div>

      {/* Three Words Reveal Section - Simple Fade In */}
      <div 
        className="w-full h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 30%, #0F0F0F 60%, #151515 100%)' 
            : 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 30%, #F5F5F5 60%, #F8F8F8 100%)'
        }}
      >
        {/* Subtle background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px), 
                             radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px',
            color: isDarkMode ? '#FFF' : '#000'
          }}
        ></div>

        {/* Main Content Container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 space-y-8">
          
          {/* Word 1 - Consistency */}
          <div 
            data-word="1"
            className="text-center opacity-0 translate-y-8 animate-[fadeIn_1s_ease-out_0.5s_forwards]"
            style={{
              animation: 'fadeIn 1s ease-out 0.5s forwards'
            }}
          >
            <div className="relative">
              <h2 
                className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none transition-colors duration-500 ${
                  isDarkMode ? 'text-white' : 'text-[#0A0A0A]'
                }`}
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segmental UI", Roboto, Arial, sans-serif',
                  letterSpacing: '-0.05em'
                }}
              >
                Consistency
              </h2>
              
              
            </div>
          </div>

          {/* Word 2 - Control */}
          <div 
            data-word="2"
            className="text-center opacity-0 translate-y-8"
            style={{
              animation: 'fadeIn 1s ease-out 1s forwards'
            }}
          >
            <div className="relative">
              <h2 
                className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none bg-gradient-to-r from-[#F3752A] via-[#F53057] to-[#A20222] bg-clip-text text-transparent"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segmental UI", Roboto, Arial, sans-serif',
                  letterSpacing: '-0.05em'
                }}
              >
                Control
              </h2>
              
             
            </div>
          </div>

          {/* Word 3 - Share */}
          <div 
            data-word="3"
            className="text-center opacity-0 translate-y-8"
            style={{
              animation: 'fadeIn 1s ease-out 1.5s forwards'
            }}
          >
            <div className="relative">
              <h2 
                className={`text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none transition-colors duration-500 ${
                  isDarkMode ? 'text-white' : 'text-[#0A0A0A]'
                }`}
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segmental UI", Roboto, Arial, sans-serif',
                  letterSpacing: '-0.05em'
                }}
              >
                Share
              </h2>
              
             
            </div>
          </div>

        </div>

        {/* Ambient light effects */}
        <div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-[0.05] transition-all duration-3000"
          style={{
            background: 'radial-gradient(circle, #F3752A 0%, transparent 70%)',
            transform: `scale(calc(0.5 + var(--scroll-progress, 0) * 1.5)) rotate(calc(var(--scroll-progress, 0) * 90deg))`,
            filter: 'blur(40px)'
          }}
        ></div>
        
        <div 
          className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-[0.05] transition-all duration-3000"
          style={{
            background: 'radial-gradient(circle, #F53057 0%, transparent 70%)',
            transform: `scale(calc(0.3 + var(--scroll-progress, 0) * 1.2)) rotate(calc(var(--scroll-progress, 0) * -120deg))`,
            filter: 'blur(40px)'
          }}
        ></div>

        <div 
          className="absolute top-1/2 right-1/6 w-32 h-32 rounded-full opacity-[0.05] transition-all duration-3000"
          style={{
            background: 'radial-gradient(circle, #A20222 0%, transparent 70%)',
            transform: `scale(calc(0.2 + var(--scroll-progress, 0) * 0.8)) rotate(calc(var(--scroll-progress, 0) * 60deg))`,
            filter: 'blur(30px)'
          }}
        ></div>
      </div>

     

      {/* Features Section */}
      <div className="w-full flex flex-col items-center mt-16 md:mt-32 mb-16 md:mb-32 px-4">
        <h2 className={`text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          Features 
        </h2>
        
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Feature 1 - Precise Editing */}
          <div className="flex flex-col items-center text-center group">
            <div 
              className="relative mb-6 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105 w-full max-w-lg select-none"
              onMouseDown={(e) => {
                const slider = e.currentTarget;
                const rect = slider.getBoundingClientRect();
                const startX = e.clientX - rect.left;
                let isDragging = false;
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  isDragging = true;
                  const currentX = moveEvent.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
                  
                  const afterImage = slider.querySelector('.after-image') as HTMLElement;
                  const sliderHandle = slider.querySelector('.slider-handle') as HTMLElement;
                  const sliderLine = slider.querySelector('.slider-line') as HTMLElement;
                  
                  if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                  if (sliderHandle) sliderHandle.style.left = `${percentage}%`;
                  if (sliderLine) sliderLine.style.left = `${percentage}%`;
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  if (!isDragging) {
                    // Handle click to move slider
                    const percentage = Math.max(0, Math.min(100, (startX / rect.width) * 100));
                    const afterImage = slider.querySelector('.after-image') as HTMLElement;
                    const sliderHandle = slider.querySelector('.slider-handle') as HTMLElement;
                    const sliderLine = slider.querySelector('.slider-line') as HTMLElement;
                    
                    if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                    if (sliderHandle) sliderHandle.style.left = `${percentage}%`;
                    if (sliderLine) sliderLine.style.left = `${percentage}%`;
                  }
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              style={{ cursor: 'ew-resize' }}
            >
              {/* Before Image (Background) */}
              <img
                src="/jaynitedit.jpeg"
                alt="Before editing"
                className="w-full h-80 md:h-96 object-contain bg-gray-100"
                draggable={false}
              />
              
              {/* After Image (Overlay with clip-path) */}
              <img
                src="/jaynitog.jpeg"
                alt="After editing"
                className="after-image absolute inset-0 w-full h-80 md:h-96 object-contain bg-gray-100"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
                draggable={false}
              />
              
              {/* Slider Line */}
              <div 
                className="slider-line absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              ></div>
              
              {/* Slider Handle */}
              <div 
                className="slider-handle absolute top-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-[#F3752A] pointer-events-none flex items-center justify-center z-20"
                style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-1 h-4 bg-[#F3752A] rounded-full"></div>
                <div className="w-1 h-4 bg-[#F3752A] rounded-full ml-1"></div>
              </div>
              
              {/* Labels */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                Before
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                After
              </div>
              
              {/* Instruction Text */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse z-10">
                Drag to compare
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#F3752A] mb-4">
              Edit Like It’s Magic

            </h3>
            <p className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
              Change exactly what you want — no distortions, no chaos.
            </p>
          </div>

          {/* Feature 2 - Non-Destructive Workflow */}
          <div className="flex flex-col items-center text-center group">
            <div 
              className="relative mb-6 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105 w-full max-w-lg select-none"
              onMouseDown={(e) => {
                const slider = e.currentTarget;
                const rect = slider.getBoundingClientRect();
                const startX = e.clientX - rect.left;
                let isDragging = false;
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  isDragging = true;
                  const currentX = moveEvent.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
                  
                  const afterImage = slider.querySelector('.after-image-2') as HTMLElement;
                  const sliderHandle = slider.querySelector('.slider-handle-2') as HTMLElement;
                  const sliderLine = slider.querySelector('.slider-line-2') as HTMLElement;
                  
                  if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                  if (sliderHandle) sliderHandle.style.left = `${percentage}%`;
                  if (sliderLine) sliderLine.style.left = `${percentage}%`;
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                  if (!isDragging) {
                    // Handle click to move slider
                    const percentage = Math.max(0, Math.min(100, (startX / rect.width) * 100));
                    const afterImage = slider.querySelector('.after-image-2') as HTMLElement;
                    const sliderHandle = slider.querySelector('.slider-handle-2') as HTMLElement;
                    const sliderLine = slider.querySelector('.slider-line-2') as HTMLElement;
                    
                    if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
                    if (sliderHandle) sliderHandle.style.left = `${percentage}%`;
                    if (sliderLine) sliderLine.style.left = `${percentage}%`;
                  }
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              style={{ cursor: 'ew-resize' }}
            >
              {/* Before Image (Background) */}
              <img
                src="/finalclear.png"
                alt="Before enhancement"
                className="w-full h-80 md:h-96 object-contain bg-gray-100"
                draggable={false}
              />
              
              {/* After Image (Overlay with clip-path) */}
              <img
                src="/blurry.jpg"
                alt="After enhancement"
                className="after-image-2 absolute inset-0 w-full h-80 md:h-96 object-contain bg-gray-100"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
                draggable={false}
              />
              
              {/* Slider Line */}
              <div 
                className="slider-line-2 absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              ></div>
              
              {/* Slider Handle */}
              <div 
                className="slider-handle-2 absolute top-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-[#F53057] pointer-events-none flex items-center justify-center z-20"
                style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-1 h-4 bg-[#F53057] rounded-full"></div>
                <div className="w-1 h-4 bg-[#F53057] rounded-full ml-1"></div>
              </div>
              
              {/* Labels */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                Before
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                After
              </div>
              
              {/* Instruction Text */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse z-10">
                Drag to compare
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#F53057] mb-4">
              Enhance Instantly

            </h3>
            <p className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
              Upscale, restore, colorize — your images, sharper and stronger in seconds.
            </p>
          </div>

          {/* Feature 3 - AI-Powered Intelligence */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative mb-6 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src="/variations.jpeg"
                alt="AI-powered intelligent editing"
                className="w-full h-64 md:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#A20222] mb-4">
              Always On-Brand
            </h3>
            <p className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
             Your fonts. Your colors. Your logos. Locked in by default.
            </p>
          </div>

          {/* Feature 4 - One-Click Magic */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative mb-6 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src="/posts.jpeg"
                alt="One-click editing magic"
                className="w-full h-64 md:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#F3752A] mb-4">
               Automate the Boring Stuff

            </h3>
            <p className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
              Generate. Schedule. Publish. Your campaigns, on autopilot.
            </p>
          </div>

          {/* Feature 5 - Style Preservation */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative mb-6 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src="/cherryblossoms.jpeg"
                alt="Style preservation technology"
                className="w-full h-64 md:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#F53057] mb-4">
              Find Inspiration Backwards

            </h3>
            <p className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
              Upload one image → get infinite reimaginings. Inspiration in reverse.
            </p>
          </div>

          {/* Feature 6 - Lightning Fast */}
          <div className="flex flex-col items-center text-center group">
            <div className="relative mb-6 overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src="/collab.jpeg"
                alt="Lightning fast processing"
                className="w-full h-64 md:h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#A20222] mb-4">
              Create Together

            </h3>
            <p className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
            }`}>
              Moodboards, shared galleries, teamwork — creativity works better when it’s social.
            </p>
          </div>
        </div>
      </div>

      {/* Fun Testimonials Section */}
      <div className="w-full flex flex-col items-center mt-16 md:mt-32 mb-16 md:mb-32 px-4">
        <h2 className={`text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          Fun Testimonials
        </h2>
        
        <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Testimonial 1 */}
          <div className="flex items-start gap-3 md:gap-4 animate-slide-in-left">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#F3752A] to-[#F53057] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                😊
              </div>
            </div>
            <div className={`rounded-3xl rounded-tl-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#333] border-[#F3752A]/20' 
                : 'bg-white border-[#F3752A]/20'
            }`}>
              <div className={`absolute -left-2 top-4 w-4 h-4 border-l-2 border-b-2 border-[#F3752A]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#333]' : 'bg-white'
              }`}></div>
              <p className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                &quot;I changed my background 5 times — my face never changed once. Love it!&quot;
              </p>
              <div className="text-[#F3752A] font-semibold mt-3 text-xs md:text-sm">- Ananya K.</div>
            </div>
          </div>

          {/* Testimonial 2 - Right aligned */}
          <div className="flex items-start gap-3 md:gap-4 justify-end animate-slide-in-right">
            <div className={`rounded-3xl rounded-tr-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20 border-[#F53057]/20' 
                : 'bg-gradient-to-br from-[#F53057]/10 to-[#A20222]/10 border-[#F53057]/20'
            }`}>
              <div className={`absolute -right-2 top-4 w-4 h-4 border-r-2 border-b-2 border-[#F53057]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20' 
                  : 'bg-gradient-to-br from-[#F53057]/10 to-[#A20222]/10'
              }`}></div>
              <p className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                &quot;Finally an editor that listens to me!&quot;
              </p>
              <div className="text-[#F53057] font-semibold mt-3 text-xs md:text-sm">- Mahesh R.</div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#F53057] to-[#A20222] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                🤩
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="flex items-start gap-3 md:gap-4 animate-slide-in-left">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#A20222] to-[#F3752A] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                🎨
              </div>
            </div>
            <div className={`rounded-3xl rounded-tl-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#333] border-[#A20222]/20' 
                : 'bg-white border-[#A20222]/20'
            }`}>
              <div className={`absolute -left-2 top-4 w-4 h-4 border-l-2 border-b-2 border-[#A20222]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#333]' : 'bg-white'
              }`}></div>
              <p className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                &quot;Magic! Only the sky changed, my perfect selfie stayed untouched ✨&quot;
              </p>
              <div className="text-[#A20222] font-semibold mt-3 text-xs md:text-sm">- Arya T.</div>
            </div>
          </div>

          {/* Testimonial 4 - Right aligned */}
          <div className="flex items-start gap-3 md:gap-4 justify-end animate-slide-in-right">
            <div className={`rounded-3xl rounded-tr-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
                : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
            }`}>
              <div className={`absolute -right-2 top-4 w-4 h-4 border-r-2 border-b-2 border-[#F3752A]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20' 
                  : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10'
              }`}></div>
              <p className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                &quot;No more &apos;oops I ruined my photo&apos; moments. Surreal gets it right!&quot;
              </p>
              <div className="text-[#F3752A] font-semibold mt-3 text-xs md:text-sm">- Eshaan L.</div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#F3752A] to-[#F53057] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                💯
              </div>
            </div>
          </div>
        </div>
      </div>

     

      {/* Pricing Section */}
      <div className="w-full flex flex-col items-center mt-16 md:mt-32 mb-16 md:mb-32 px-4">
        <h2 className={`text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          Pricing
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8 justify-center items-stretch w-full max-w-6xl mx-auto">
          {/* Free Surreal */}
          <div className={`flex-1 rounded-3xl p-4 md:p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#F53057]/40 hover:shadow-xl hover:shadow-[#F3752A]/20 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
              : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-[#F3752A] mb-2">Free Surreal</h3>
              <p className="text-[#F53057] font-semibold text-lg mb-6">&quot;Play with it&quot;</p>
              
              <div className={`text-4xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>$0</div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-[#F3752A] text-xl">✨</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>2 free edits per session</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#F3752A] text-xl">🖼️</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Basic image generation</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#F3752A] text-xl">📱</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Standard resolution</span>
                </div>
              </div>
              
              <button 
                className="w-full mt-8 px-6 py-3 rounded-xl bg-[#F3752A] text-white font-semibold hover:bg-[#F53057] transition"
                onClick={() => {
                  if (user) {
                    router.push("/demo");
                  } else {
                    setShowAuthModal(true);
                  }
                }}
              >
                Get Started Free
              </button>
            </div>
          </div>

          {/* Surreal Plus */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#A20222]/40 hover:shadow-xl hover:shadow-[#F53057]/20 relative ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20 border-[#F53057]/20' 
              : 'bg-gradient-to-br from-[#F53057]/10 to-[#A20222]/10 border-[#F53057]/20'
          }`}>
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#F53057] text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-[#F53057] mb-2">Surreal Plus</h3>
              <p className="text-[#A20222] font-semibold text-lg mb-6">&quot;Unlimited vibes&quot;</p>
              
              <div className={`text-4xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>$9.99</div>
              <div className={`text-sm mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-60' : 'text-[#1E1E1E] opacity-60'
              }`}>per month</div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-[#F53057] text-xl">🔥</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Unlimited edits</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#F53057] text-xl">⚡</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Priority processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#F53057] text-xl">🎨</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Advanced editing tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#F53057] text-xl">📸</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>HD image generation</span>
                </div>
              </div>
              
              <button className="w-full mt-8 px-6 py-3 rounded-xl bg-[#F53057] text-white font-semibold hover:bg-[#A20222] transition">
                Upgrade to Plus
              </button>
            </div>
          </div>

          {/* Surreal Pro */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#F3752A]/40 hover:shadow-xl hover:shadow-[#A20222]/20 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#A20222]/20 to-[#F3752A]/20 border-[#A20222]/20' 
              : 'bg-gradient-to-br from-[#A20222]/10 to-[#F3752A]/10 border-[#A20222]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-4">👑</div>
              <h3 className="text-2xl font-bold text-[#A20222] mb-2">Surreal Pro</h3>
              <p className="text-[#F3752A] font-semibold text-lg mb-6">&quot;For the edit-obsessed&quot;</p>
              
              <div className={`text-4xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>$19.99</div>
              <div className={`text-sm mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-60' : 'text-[#1E1E1E] opacity-60'
              }`}>per month</div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-[#A20222] text-xl">💎</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Everything in Plus</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#A20222] text-xl">🎭</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>AI style transfer</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#A20222] text-xl">📊</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Batch processing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#A20222] text-xl">🔗</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>API access</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#A20222] text-xl">🎯</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
                  }`}>Custom brand kit</span>
                </div>
              </div>
              
              <button className="w-full mt-8 px-6 py-3 rounded-xl bg-[#A20222] text-white font-semibold hover:bg-[#F3752A] transition">
                Go Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Popup */}
      {showPricingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-[#333] border-[#F3752A]/20' 
              : 'bg-white border-[#F3752A]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                Unlock Unlimited Edits!
              </h3>
              <p className={`mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
              }`}>
                You&apos;ve used your 2 free edits. Upgrade to continue the magic with unlimited edits, advanced features, and more!
              </p>
              
              <div className="space-y-4 mb-6">
                <div className={`rounded-2xl p-4 border-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
                    : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
                }`}>
                  <div className="text-lg font-bold text-[#F3752A]">Pro Plan</div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                  }`}>$9.99/month</div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                  }`}>Unlimited edits & premium features</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPricingPopup(false)}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                    isDarkMode 
                      ? 'bg-[#555] text-white hover:bg-[#666]' 
                      : 'bg-[#F2F2F2] text-[#1E1E1E] hover:bg-[#E5E5E5]'
                  }`}
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPricingPopup(false);
                    router.push("/signup");
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#F3752A] text-white font-semibold hover:bg-[#F53057] transition"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      
     
     
      {/* Footer */}
      <footer className={`w-full border-t px-8 py-12 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20' 
          : 'bg-gradient-to-br from-[#F3752A]/5 to-[#F53057]/5 border-[#F3752A]/20'
      }`}>
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Logo Section */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">🎨</div>
                <div className="text-3xl font-bold text-[#F3752A]">Surreal</div>
              </div>
              <p className={`text-sm max-w-sm transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
              }`}>
                Edit fearlessly, create endlessly. Where your images stay true while magic happens ✨
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Product Links */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-[#F53057] mb-3">Product</h4>
                <div className="space-y-2">
                  <a href="/about" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    About Surreal
                  </a>
                  <a href="/features" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    Feature
                  </a>
                  <a href="/pricing" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    Pricing
                  </a>
                </div>
              </div>

              {/* Support Links */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-[#A20222] mb-3">Support</h4>
                <div className="space-y-2">
                  <a href="/faq" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    FAQ
                  </a>
                  <a href="/contact" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    Contact Us
                  </a>
                  <a href="/help" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    Help Center
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-[#F3752A] mb-3">Connect</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-2xl hover:scale-110 transition-transform" title="Twitter">
                    🐦
                  </a>
                  <a href="#" className="text-2xl hover:scale-110 transition-transform" title="Instagram">
                    📸
                  </a>
                  <a href="#" className="text-2xl hover:scale-110 transition-transform" title="Discord">
                    💬
                  </a>
                  <a href="#" className="text-2xl hover:scale-110 transition-transform" title="YouTube">
                    📺
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-[#F3752A]/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className={`flex items-center gap-6 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
            }`}>
              <span>© {new Date().getFullYear()} Surreal. All rights reserved.</span>
              <span className="flex items-center gap-2">
                Made with ❤️ in India
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <a href="/privacy" className={`transition ${
                isDarkMode 
                  ? 'text-white opacity-70 hover:opacity-100 hover:text-[#F3752A]' 
                  : 'text-[#1E1E1E] opacity-70 hover:opacity-100 hover:text-[#F3752A]'
              }`}>
                Privacy Policy
              </a>
              <span className={`transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-40' : 'text-[#1E1E1E] opacity-40'
              }`}>•</span>
              <a href="/terms" className={`transition ${
                isDarkMode 
                  ? 'text-white opacity-70 hover:opacity-100 hover:text-[#F3752A]' 
                  : 'text-[#1E1E1E] opacity-70 hover:opacity-100 hover:text-[#F3752A]'
              }`}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      </div>
    </div>
  );
}


// LiveDemoWithApi component
function LiveDemoWithApi() {
  const [prompt, setPrompt] = useState("");
  const [genImage, setGenImage] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Generate image
  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError(null);
    setGenImage(null);
    setEditImage(null);
    try {
      const url = await callGenerateImage(prompt);
      setGenImage(url);
    } catch (err: any) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Edit image
  const handleEdit = async () => {
    if (!genImage || !editPrompt) return;
    setEditLoading(true);
    setEditError(null);
    setEditImage(null);
    try {
      const url = await callEditImage(editPrompt, genImage);
      setEditImage(url);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Show generated image above input */}
      {genImage && (
        <img
          src={genImage}
          alt="Generated"
          className="rounded-2xl shadow-lg w-full max-w-md object-contain mb-8"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      )}
      <div className="w-full max-w-xl mx-auto mb-8 flex items-center justify-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="generate any image"
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 text-center"
          style={{ fontFamily: "monospace", letterSpacing: 1 }}
          disabled={genLoading}
        />
        <button
          className="ml-4 bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-2 rounded-xl shadow transition"
          onClick={handleGenerate}
          disabled={genLoading || !prompt}
        >
          {genLoading ? "Generating..." : "Create"}
        </button>
      </div>
      {genError && <div className="text-red-400 mb-4">{genError}</div>}

      {/* Show edited image above edit input */}
      {editImage && (
        <img
          src={editImage}
          alt="Edited"
          className="rounded-2xl shadow-lg w-full max-w-md object-contain mb-8"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      )}
      <div className="w-full max-w-xl mx-auto flex items-center justify-center mb-4">
        <input
          type="text"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="want to edit it? just type your change"
          className="w-full bg-[#222] text-white text-lg rounded-xl px-5 py-4 outline-none border-none placeholder:text-gray-400 text-center"
          style={{ fontFamily: "monospace", letterSpacing: 1 }}
          disabled={editLoading || !genImage}
        />
        <button
          className="ml-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-2 rounded-xl shadow transition"
          onClick={handleEdit}
          disabled={editLoading || !editPrompt || !genImage}
        >
          {editLoading ? "Editing..." : "Edit"}
        </button>
      </div>
      <div className="flex gap-4 mb-8">
        <button
          className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-2 rounded-xl shadow transition"
          disabled={!genImage && !editImage}
        >
          Download
        </button>
        <button
          className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-2 rounded-xl shadow transition"
          disabled={!genImage && !editImage}
        >
          Share
        </button>
      </div>
      {editError && <div className="text-red-400 mb-4">{editError}</div>}
    </div>
  );
}
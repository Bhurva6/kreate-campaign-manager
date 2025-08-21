"use client";
import { useState, useRef, useEffect } from "react";
import { FaImage, FaUpload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useImageStore } from "../store/imageStore";
import Image from "next/image";
import React from "react";

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
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate image");
  return data.images && data.images[0]?.url;
}

async function callEditImage(prompt: string, input_image: string) {
  const res = await fetch("/api/edit-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, input_image }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to edit image");
  return data.image || (data.result && data.result.sample);
}

export default function LandingPage() {
  const router = useRouter();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Fun Zone state
  const [funZoneImage, setFunZoneImage] = useState<string | null>(null);
  const [funZonePrompt, setFunZonePrompt] = useState("");
  const [funZoneEditPrompt, setFunZoneEditPrompt] = useState("");
  const [funZoneGenerating, setFunZoneGenerating] = useState(false);
  const [funZoneEditing, setFunZoneEditing] = useState(false);
  const [funZoneError, setFunZoneError] = useState<string | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Fun Zone functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFunZoneImage(e.target?.result as string);
        setEditCount(0);
        setFunZoneError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFunZoneGenerate = async () => {
    if (!funZonePrompt.trim()) return;
    
    setFunZoneGenerating(true);
    setFunZoneError(null);
    try {
      const url = await callGenerateImage(funZonePrompt);
      setFunZoneImage(url);
      setEditCount(0);
    } catch (err: any) {
      setFunZoneError(err.message);
    } finally {
      setFunZoneGenerating(false);
    }
  };

  const handleFunZoneEdit = async () => {
    if (!funZoneImage || !funZoneEditPrompt.trim()) return;
    
    if (editCount >= 2) {
      setShowPricingPopup(true);
      return;
    }
    
    setFunZoneEditing(true);
    setFunZoneError(null);
    try {
      const url = await callEditImage(funZoneEditPrompt, funZoneImage);
      setFunZoneImage(url);
      setEditCount(prev => prev + 1);
      setFunZoneEditPrompt("");
    } catch (err: any) {
      setFunZoneError(err.message);
    } finally {
      setFunZoneEditing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#1E1E1E]' 
        : 'bg-[#FDFBF7]'
    }`}>
      {/* Logo Top Left and Auth Buttons Top Right */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <div className={`text-3xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-[#F3752A]' : 'text-[#F3752A]'
        }`}>Jamble</div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
              isDarkMode 
                ? 'bg-[#F3752A]/20 text-[#F3752A] hover:bg-[#F3752A]/30' 
                : 'bg-[#F3752A]/10 text-[#F3752A] hover:bg-[#F3752A]/20'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="text-2xl">
              {isDarkMode ? '☀️' : '🌙'}
            </span>
          </button>
          
          <button
            className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#333] text-white hover:bg-[#F3752A] hover:text-white' 
                : 'bg-[#F2F2F2] text-[#1E1E1E] hover:bg-[#F3752A] hover:text-white'
            }`}
            onClick={() => window.location.href = "/signin"}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-[#F53057] text-white font-semibold hover:bg-[#A20222] transition"
            onClick={() => window.location.href = "/signup"}
          >
            Sign Up
          </button>
        </div>
      </div>
      {/* Centered Content */}
      <div className="flex-1 flex flex-row items-end justify-between px-12 pb-16">
        {/* Left side - Main content */}
        <div className="flex flex-col items-start justify-end w-1/2 pr-12">
          <h1 className={`text-4xl md:text-5xl font-bold text-left mb-6 max-w-2xl transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
          }`}>
           Edit Fearlessly. Jamble Keeps Your Image True.
          </h1>
          <p className={`text-lg md:text-xl text-left mb-10 max-w-xl transition-colors duration-300 ${
            isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
          }`}>
            No more losing the original vibe. Jamble only changes what you want — nothing else
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <button
                className="font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg relative overflow-hidden group"
                style={{
                  background: "linear-gradient(45deg, #F3752A 0%, #F53057 50%, #A20222 100%)",
                  backgroundSize: "300% 300%",
                  animation: "gradient-shift 3s ease infinite",
                  color: "white",
                }}
                onClick={() => router.push("/home")}
              >
               Try It Now
              </button>
              <button
                className="font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg bg-[#F2F2F2] text-[#1E1E1E] border border-[#F3752A] hover:bg-[#F3752A] hover:text-white"
                onClick={() => router.push("/demo")}
              >
                See Jamble in Action
              </button>
            </div>
            
          </div>
          
         
        </div>

        {/* Right side - Comparison boxes side by side */}
        <div className="flex flex-row gap-6 w-1/2 justify-end">
          {/* Others box */}
          <div className={`rounded-2xl p-6 border-2 w-full max-w-xs transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-[#333] border-[#F3752A]/30' 
              : 'bg-[#F2F2F2] border-[#F3752A]/30'
          }`}>
            <h3 className={`text-lg font-bold mb-3 text-center transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
            }`}>Others</h3>
            <div className="flex justify-center">
              <video
                src="/others-comparison.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="rounded-xl w-full h-auto object-contain bg-[#1E1E1E]/5"
                style={{ maxHeight: '180px' }}
              />
            </div>
          </div>
          
          {/* Us box */}
          <div className={`rounded-2xl p-6 border-2 w-full max-w-xs transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F3752A]/30 to-[#F53057]/30 border-[#F53057]/50' 
              : 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F53057]/50'
          }`}>
            <h3 className={`text-lg font-bold mb-3 text-center transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
            }`}>Jamble</h3>
            <div className="flex justify-center">
              <video
                src="/jamble-comparison.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="rounded-xl w-full h-auto object-contain bg-[#1E1E1E]/5"
                style={{ maxHeight: '180px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          How It Works
        </h2>
        
        <div className="flex flex-row items-center justify-center gap-16 max-w-6xl mx-auto">
          {/* Step 1 - Left side */}
          <div className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105">
            <div className={`rounded-2xl p-8 border-2 mb-4 group-hover:border-[#F53057]/50 transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F3752A]/30 to-[#F53057]/30 border-[#F3752A]/30' 
                : 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/30'
            }`}>
              <div className="text-6xl mb-4">📷</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>Step 1</div>
              <div className="text-[#F3752A] font-semibold">Upload Your Image</div>
              <div className={`text-sm mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
              }`}>cute doodle of camera / photo frame</div>
            </div>
          </div>

          {/* Central Image */}
          <div className="flex-1 flex justify-center items-center">
            <div className={`rounded-3xl p-8 border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
                : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
            }`}>
              <img
                src="/bright-cereal.png"
                alt="Demo image showing the editing process"
                className="rounded-2xl shadow-lg w-full max-w-md object-contain"
                style={{ background: "rgba(243,117,42,0.05)" }}
              />
            </div>
          </div>

          {/* Steps 2 and 3 - Right side, stacked vertically */}
          <div className="flex flex-col gap-8 items-center">
            {/* Step 2 */}
            <div className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105">
              <div className={`rounded-2xl p-8 border-2 mb-4 group-hover:border-[#F53057]/50 transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#F3752A]/30 to-[#F53057]/30 border-[#F3752A]/30' 
                  : 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/30'
              }`}>
                <div className="text-6xl mb-4">🎯</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                }`}>Step 2</div>
                <div className="text-[#F3752A] font-semibold">Pick What to Change</div>
                <div className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                }`}>fun highlighting animation</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105">
              <div className={`rounded-2xl p-8 border-2 mb-4 group-hover:border-[#F53057]/50 transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#F3752A]/30 to-[#F53057]/30 border-[#F3752A]/30' 
                  : 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/30'
              }`}>
                <div className="text-6xl mb-4">✨</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
                }`}>Step 3</div>
                <div className="text-[#F3752A] font-semibold">Jamble Magic</div>
                <div className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                }`}>poof effect, only that part changes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Jamble Section */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          Why Jamble?
        </h2>
        
        <div className="flex flex-row gap-8 justify-center items-stretch w-full max-w-6xl mx-auto">
          {/* Card 1 - Precise Edits Only */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#F53057]/40 hover:shadow-xl hover:shadow-[#F3752A]/20 group cursor-pointer ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
              : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-6 group-hover:animate-bounce">🎨</div>
              <h3 className="text-xl font-bold text-[#F3752A] mb-4 group-hover:text-[#F53057] transition-colors">
                Precise Edits Only
              </h3>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
              }`}>
                "Change what you want, leave the rest untouched."
              </p>
            </div>
          </div>

          {/* Card 2 - Infinite Edits */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#A20222]/40 hover:shadow-xl hover:shadow-[#F53057]/20 group cursor-pointer ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20 border-[#F53057]/20' 
              : 'bg-gradient-to-br from-[#F53057]/10 to-[#A20222]/10 border-[#F53057]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-6 group-hover:animate-spin">🔁</div>
              <h3 className="text-xl font-bold text-[#F53057] mb-4 group-hover:text-[#A20222] transition-colors">
                Infinite Edits
              </h3>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
              }`}>
                "Play all you like — Jamble never ruins your base image."
              </p>
            </div>
          </div>

          {/* Card 3 - Quick & Easy */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#F3752A]/40 hover:shadow-xl hover:shadow-[#A20222]/20 group cursor-pointer ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#A20222]/20 to-[#F3752A]/20 border-[#A20222]/20' 
              : 'bg-gradient-to-br from-[#A20222]/10 to-[#F3752A]/10 border-[#A20222]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-6 group-hover:animate-pulse">⚡</div>
              <h3 className="text-xl font-bold text-[#A20222] mb-4 group-hover:text-[#F3752A] transition-colors">
                Quick & Easy
              </h3>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
              }`}>
                "One click and done, no pro skills needed."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fun Testimonials Section */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          Fun Testimonials
        </h2>
        
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Testimonial 1 */}
          <div className="flex items-start gap-4 animate-slide-in-left">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F3752A] to-[#F53057] flex items-center justify-center text-white text-xl font-bold">
                😊
              </div>
            </div>
            <div className={`rounded-3xl rounded-tl-sm p-6 shadow-lg border-2 max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#333] border-[#F3752A]/20' 
                : 'bg-white border-[#F3752A]/20'
            }`}>
              <div className={`absolute -left-2 top-4 w-4 h-4 border-l-2 border-b-2 border-[#F3752A]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#333]' : 'bg-white'
              }`}></div>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                "I changed my background 5 times — my face never changed once. Love it!"
              </p>
              <div className="text-[#F3752A] font-semibold mt-3 text-sm">- Sarah K.</div>
            </div>
          </div>

          {/* Testimonial 2 - Right aligned */}
          <div className="flex items-start gap-4 justify-end animate-slide-in-right">
            <div className={`rounded-3xl rounded-tr-sm p-6 shadow-lg border-2 max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20 border-[#F53057]/20' 
                : 'bg-gradient-to-br from-[#F53057]/10 to-[#A20222]/10 border-[#F53057]/20'
            }`}>
              <div className={`absolute -right-2 top-4 w-4 h-4 border-r-2 border-b-2 border-[#F53057]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#F53057]/20 to-[#A20222]/20' 
                  : 'bg-gradient-to-br from-[#F53057]/10 to-[#A20222]/10'
              }`}></div>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                "Finally an editor that listens to me!"
              </p>
              <div className="text-[#F53057] font-semibold mt-3 text-sm">- Mike R.</div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F53057] to-[#A20222] flex items-center justify-center text-white text-xl font-bold">
                🤩
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="flex items-start gap-4 animate-slide-in-left">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A20222] to-[#F3752A] flex items-center justify-center text-white text-xl font-bold">
                🎨
              </div>
            </div>
            <div className={`rounded-3xl rounded-tl-sm p-6 shadow-lg border-2 max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#333] border-[#A20222]/20' 
                : 'bg-white border-[#A20222]/20'
            }`}>
              <div className={`absolute -left-2 top-4 w-4 h-4 border-l-2 border-b-2 border-[#A20222]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode ? 'bg-[#333]' : 'bg-white'
              }`}></div>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                "Magic! Only the sky changed, my perfect selfie stayed untouched ✨"
              </p>
              <div className="text-[#A20222] font-semibold mt-3 text-sm">- Alex T.</div>
            </div>
          </div>

          {/* Testimonial 4 - Right aligned */}
          <div className="flex items-start gap-4 justify-end animate-slide-in-right">
            <div className={`rounded-3xl rounded-tr-sm p-6 shadow-lg border-2 max-w-md relative transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
                : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
            }`}>
              <div className={`absolute -right-2 top-4 w-4 h-4 border-r-2 border-b-2 border-[#F3752A]/20 transform rotate-45 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20' 
                  : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10'
              }`}></div>
              <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
              }`}>
                "No more 'oops I ruined my photo' moments. Jamble gets it right!"
              </p>
              <div className="text-[#F3752A] font-semibold mt-3 text-sm">- Emma L.</div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F3752A] to-[#F53057] flex items-center justify-center text-white text-xl font-bold">
                💯
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Jamble Fun Zone */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className={`text-4xl font-bold text-center mb-8 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          The Jamble Fun Zone
        </h2>
        <p className={`text-lg text-center mb-16 max-w-2xl transition-colors duration-300 ${
          isDarkMode ? 'text-white opacity-80' : 'text-[#1E1E1E] opacity-80'
        }`}>
          Try Jamble right here! Generate or upload an image, then edit it with simple text prompts. 
          Get 2 free edits to experience the magic ✨
        </p>
        
        <div className={`w-full max-w-4xl mx-auto rounded-3xl p-8 border-2 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20' 
            : 'bg-gradient-to-br from-[#F3752A]/5 to-[#F53057]/5 border-[#F3752A]/20'
        }`}>
          {/* Image Display Area */}
          {funZoneImage ? (
            <div className="flex justify-center mb-8">
              <img
                src={funZoneImage}
                alt="Fun Zone Image"
                className="rounded-2xl shadow-lg max-w-md w-full object-contain"
                style={{ maxHeight: '400px' }}
              />
            </div>
          ) : (
            <div className="flex justify-center mb-8">
              <div className={`w-full max-w-md h-64 rounded-2xl border-2 border-dashed border-[#F3752A]/40 flex flex-col items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-[#333]' : 'bg-[#F2F2F2]'
              }`}>
                <div className="text-6xl mb-4">🖼️</div>
                <p className={`text-center transition-colors duration-300 ${
                  isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                }`}>
                  Upload an image or generate one below
                </p>
              </div>
            </div>
          )}

          {/* Generation and Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Generate Image */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#F3752A] text-center">Generate Image</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={funZonePrompt}
                  onChange={(e) => setFunZonePrompt(e.target.value)}
                  placeholder="Describe your image..."
                  className={`flex-1 text-lg rounded-xl px-4 py-3 outline-none border-2 focus:border-[#F3752A] transition ${
                    isDarkMode 
                      ? 'bg-[#333] text-white border-[#F3752A]/20' 
                      : 'bg-white text-[#1E1E1E] border-[#F3752A]/20'
                  }`}
                  disabled={funZoneGenerating}
                />
                <button
                  onClick={handleFunZoneGenerate}
                  disabled={funZoneGenerating || !funZonePrompt.trim()}
                  className="px-6 py-3 rounded-xl bg-[#F3752A] text-white font-semibold hover:bg-[#F53057] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {funZoneGenerating ? "Creating..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Upload Image */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#F53057] text-center">Upload Image</h3>
              <div className="flex justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 rounded-xl bg-[#F53057] text-white font-semibold hover:bg-[#A20222] transition flex items-center gap-2"
                >
                  <span>📁</span>
                  Upload Image
                </button>
              </div>
            </div>
          </div>

          {/* Edit Section */}
          {funZoneImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#A20222]">Edit Your Image</h3>
                <div className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-white opacity-70' : 'text-[#1E1E1E] opacity-70'
                }`}>
                  {editCount}/2 free edits used
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={funZoneEditPrompt}
                  onChange={(e) => setFunZoneEditPrompt(e.target.value)}
                  placeholder="Tell me what to change..."
                  className={`flex-1 text-lg rounded-xl px-4 py-3 outline-none border-2 focus:border-[#A20222] transition ${
                    isDarkMode 
                      ? 'bg-[#333] text-white border-[#A20222]/20' 
                      : 'bg-white text-[#1E1E1E] border-[#A20222]/20'
                  }`}
                  disabled={funZoneEditing}
                />
                <button
                  onClick={handleFunZoneEdit}
                  disabled={funZoneEditing || !funZoneEditPrompt.trim()}
                  className="px-6 py-3 rounded-xl bg-[#A20222] text-white font-semibold hover:bg-[#F3752A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {funZoneEditing ? "Editing..." : editCount >= 2 ? "Upgrade" : "Edit"}
                </button>
              </div>
              {editCount >= 1 && editCount < 2 && (
                <p className="text-sm text-[#F53057] text-center">
                  {2 - editCount} free edit remaining!
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {funZoneError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 text-center">
              {funZoneError}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-[#1E1E1E]'
        }`}>
          Pricing
        </h2>
        
        <div className="flex flex-row gap-8 justify-center items-stretch w-full max-w-6xl mx-auto">
          {/* Free Jamble */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#F53057]/40 hover:shadow-xl hover:shadow-[#F3752A]/20 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#F3752A]/20 to-[#F53057]/20 border-[#F3752A]/20' 
              : 'bg-gradient-to-br from-[#F3752A]/10 to-[#F53057]/10 border-[#F3752A]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-[#F3752A] mb-2">Free Jamble</h3>
              <p className="text-[#F53057] font-semibold text-lg mb-6">"Play with it"</p>
              
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
              
              <button className="w-full mt-8 px-6 py-3 rounded-xl bg-[#F3752A] text-white font-semibold hover:bg-[#F53057] transition">
                Get Started Free
              </button>
            </div>
          </div>

          {/* Jamble Plus */}
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
              <h3 className="text-2xl font-bold text-[#F53057] mb-2">Jamble Plus</h3>
              <p className="text-[#A20222] font-semibold text-lg mb-6">"Unlimited vibes"</p>
              
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

          {/* Jamble Pro */}
          <div className={`flex-1 rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:border-[#F3752A]/40 hover:shadow-xl hover:shadow-[#A20222]/20 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#A20222]/20 to-[#F3752A]/20 border-[#A20222]/20' 
              : 'bg-gradient-to-br from-[#A20222]/10 to-[#F3752A]/10 border-[#A20222]/20'
          }`}>
            <div className="text-center">
              <div className="text-6xl mb-4">👑</div>
              <h3 className="text-2xl font-bold text-[#A20222] mb-2">Jamble Pro</h3>
              <p className="text-[#F3752A] font-semibold text-lg mb-6">"For the edit-obsessed"</p>
              
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
                You've used your 2 free edits. Upgrade to continue the magic with unlimited edits, advanced features, and more!
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
                <div className="text-3xl font-bold text-[#F3752A]">Jamble</div>
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
                    About Jamble
                  </a>
                  <a href="/features" className={`block text-sm transition ${
                    isDarkMode 
                      ? 'text-white opacity-80 hover:opacity-100 hover:text-[#F3752A]' 
                      : 'text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#F3752A]'
                  }`}>
                    Features
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
              <span>© {new Date().getFullYear()} Jamble. All rights reserved.</span>
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
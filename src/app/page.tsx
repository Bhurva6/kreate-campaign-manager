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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a] flex flex-col relative overflow-x-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-lime-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-radial from-lime-400/3 via-transparent to-transparent rounded-full"></div>
      </div>

      {/* Logo Top Left and Auth Buttons Top Right */}
      <div className="flex flex-row justify-between items-center w-full p-6 relative z-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} className="drop-shadow-lg" />
          <span className="text-white font-bold text-xl">Juicebox</span>
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            onClick={() => router.push("/signin")}
          >
            Sign In
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 text-black font-semibold hover:from-lime-300 hover:to-lime-400 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-lime-400/25"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
      {/* Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        {/* Hero Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-lime-400/10 border border-lime-400/20 rounded-full text-lime-300 text-sm font-medium backdrop-blur-sm animate-pulse">
            <span className="w-2 h-2 bg-lime-400 rounded-full animate-ping"></span>
            AI-Powered Creative Studio
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white text-center mb-8 max-w-5xl leading-[1.1]">
          Turn Your Words Into{' '}
          <span className="bg-gradient-to-r from-lime-400 via-lime-300 to-lime-500 bg-clip-text text-transparent animate-gradient-x bg-300% drop-shadow-glow">
            Works of Art
          </span>
          —And Edit Them Instantly.
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 text-center mb-12 max-w-3xl leading-relaxed opacity-90">
          Juicebox lets you generate stunning images and edit them with just a
          sentence. No skills needed—just your imagination
        </p>
        <div className="flex flex-col sm:flex-row gap-6 items-center mb-8">
          <button
            className="group relative font-semibold px-12 py-5 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #C6FF00 0%, #76FF03 50%, #B2FF59 100%)",
              color: "#111",
              boxShadow: "0 0 30px 5px rgba(178, 255, 89, 0.3), 0 5px 20px 0 rgba(118, 255, 3, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 50px 10px rgba(178, 255, 89, 0.5), 0 10px 30px 0 rgba(118, 255, 3, 0.3)";
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 30px 5px rgba(178, 255, 89, 0.3), 0 5px 20px 0 rgba(118, 255, 3, 0.2)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => router.push("/home")}
          >
            <span className="relative z-10 flex items-center gap-2">
              Try it instantly
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          <button
            className="font-semibold px-12 py-5 rounded-2xl text-xl transition-all duration-300 bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105"
            onClick={() => router.push("/demo")}
          >
            Live Demo
          </button>
        </div>
        <div className="mb-12 text-base text-gray-400 text-center">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></span>
            Trusted by creators worldwide
          </span>
        </div>
        {/* Enhanced Floating Pulsating Circles */}
        <div
          className="w-full flex justify-center items-end relative z-20"
          style={{ minHeight: 120, marginBottom: 40 }}
        >
          <div className="flex flex-row gap-[-20px] md:gap-[-40px] justify-center items-end">
            {["/girl1.jpeg", "/girl2.jpeg", "/girl3.jpeg", "/girl4.jpeg"].map(
              (src, i) => (
                <div
                  key={src}
                  className={`relative rounded-full bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl mx-[-16px] animate-float${
                    i % 3
                  } animate-pulse${i % 2} border-2 border-white/20 backdrop-blur-sm`}
                  style={{
                    width: 64,
                    height: 64,
                    zIndex: 10 + i,
                    opacity: 0.8,
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 20px rgba(178, 255, 89, 0.2), 0 5px 15px rgba(0,0,0,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(178, 255, 89, 0.4), 0 10px 25px rgba(0,0,0,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(178, 255, 89, 0.2), 0 5px 15px rgba(0,0,0,0.3)";
                  }}
                >
                  <img
                    src={src}
                    alt="Creator avatar"
                    className="rounded-full w-full h-full object-cover"
                    draggable={false}
                    style={{ pointerEvents: "none" }}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-lime-400/10 via-transparent to-lime-600/10"></div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Glassmorphism Tile at Bottom */}
      <div className="w-full flex justify-center mt-48 mb-20 px-4">
        <div className="backdrop-blur-2xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/20 rounded-3xl shadow-2xl w-full max-w-7xl mx-auto px-8 py-12 sm:px-16 sm:py-16 flex flex-row items-center gap-8 overflow-x-auto pointer-events-auto transition-all justify-center relative">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-transparent to-lime-600/5 rounded-3xl pointer-events-none"></div>
          
          {/* First Text */}
          <div className="flex flex-col items-center min-w-[240px] max-w-sm justify-center pl-8 sm:pl-16 relative z-10">
            <div className="text-white text-lg font-mono opacity-90 min-h-[3em] w-full break-words text-center leading-relaxed bg-[#1a1a1a]/50 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
              {typedText1}
              <span className="animate-blink text-lime-400">
                {typedText1.length < fullText1.length ? "|" : ""}
              </span>
            </div>
          </div>
          {/* Enhanced Arrow 1 */}
          {showArrow1 && (
            <div className="animate-bounce text-4xl text-lime-400 drop-shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
          {/* Enhanced Image 1 */}
          {showImage1 && (
            <div className="flex flex-col items-center min-w-[320px] max-w-lg justify-center px-4 sm:px-6 relative z-10">
              <div className="relative group">
                <img
                  src="/bright-cereal.png"
                  alt="Super Crunch Cereal"
                  className="rounded-3xl shadow-2xl w-full max-w-[320px] object-contain border-2 border-white/20 group-hover:scale-105 transition-transform duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))" }}
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-lime-400/10 via-transparent to-lime-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          )}
          {/* Enhanced Arrow 2 */}
          {showImage1 && showArrow2 && (
            <div className="animate-bounce text-4xl text-lime-400 drop-shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
          {/* Enhanced Second Text */}
          {showImage1 && (
            <div className="flex flex-col items-center min-w-[240px] max-w-sm justify-center relative z-10">
              <div className="text-white text-lg font-mono opacity-90 min-h-[3em] w-full break-words text-center leading-relaxed bg-[#1a1a1a]/50 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                {typedText2}
                <span className="animate-blink text-lime-400">
                  {typedText2.length < fullText2.length ? "|" : ""}
                </span>
              </div>
            </div>
          )}
          {/* Enhanced Arrow 3 */}
          {showImage2 && (
            <div className="animate-bounce text-4xl text-lime-400 drop-shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
          {/* Enhanced Image 2 */}
          {showImage2 && (
            <div className="flex flex-col items-center min-w-[320px] max-w-lg justify-center px-4 sm:px-6 pr-8 sm:pr-16 relative z-10">
              <div className="relative group">
                <img
                  src="/blue-cereal.png"
                  alt="Super Crunch Cereal Night"
                  className="rounded-3xl shadow-2xl w-full max-w-[320px] object-contain border-2 border-white/20 group-hover:scale-105 transition-transform duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))" }}
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-lime-400/10 via-transparent to-lime-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Feature Cards Section */}
      <div className="w-full flex flex-col items-center gap-12 pb-24 mt-56">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to create, edit, and perfect your visual content
          </p>
        </div>
        {/* GIF Overlay */}
        {activeGif !== null && (
          <div
            id="gif-overlay-bg"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-300 animate-fade-in"
            style={{ backdropFilter: "blur(2px)" }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                animation: "gif-pop-in 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <img
                src={`/gifs/feature-${activeGif + 1}.gif`}
                alt="Feature demo GIF"
                className="rounded-2xl shadow-2xl max-w-[480px] w-full h-auto object-contain border-4 border-white/20 bg-black/40"
                style={{ pointerEvents: "auto" }}
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl px-4 mx-auto">
          {[
            {
              title: "Text-to-Image",
              tagline: "Pour Your Thoughts, Watch Them Bloom",
              copy:
                "Type a few words, and Juicebox whirls them into dazzling visuals. From wild unicorns to sleek product shots, your ideas become art—no paintbrush required.",
              gif: "/feature1.gif",
            },
            {
              title: "Text-to-Edit",
              tagline: "Remix Reality, One Sentence at a Time",
              copy:
                "Don't just make images—reshape them! Want a blue sky or a bigger smile? Just say it. Juicebox listens, edits, and delivers. No pixels harmed in the process.",
              gif: "/feature2.mp4",
            },
            {
              title: "Background Remover",
              tagline: "Bye-Bye, Boring Backdrops!",
              copy:
                "One click, and your subject pops. Swap the mundane for the magical—whether it's a tropical beach or a cosmic nebula, the world is your new background.",
              gif: "/feature3.mp4",
            },
            {
              title: "Generative Fill & Image Extender",
              tagline: "Stretch the Canvas, Stretch the Imagination",
              copy:
                "Out of frame? Out of ideas? Not here. Juicebox fills, extends, and completes your images with a creative twist—no cropping, just more wow.",
              gif: "/feature4.mp4",
            },
            {
              title: "AI Object & Shadow Remover",
              tagline: "Erase the Unwanted, Keep the Wow",
              copy:
                "Unwanted photobombers? Shadows that steal the show? Zap them away and let your vision shine—clean, crisp, and totally you.",
              gif: "/feature5.mp4",
            },
            {
              title: "AI Image Vectorizer",
              tagline: "From Pixels to Pop Art",
              copy:
                "Watch your images transform into bold, scalable vectors—perfect for logos, merch, or wherever your brand wants to stand tall.",
              gif: "/feature6.mp4",
            },
            {
              title: "Text Effects & AI Tattoo Generator",
              tagline: "Words That Pop, Ink That Inspires",
              copy:
                "Make your text shimmer, swirl, or roar. Dreaming of tattoo art? Describe it, and Juicebox sketches your next masterpiece.",
              gif: "/feature7.mp4",
            },
            {
              title: "AI Stock Images & Reverse Prompts",
              tagline: "Never Settle for Stock Again",
              copy:
                "Need the perfect image? Describe it, and Juicebox invents it. Or, upload a photo and get instant inspiration with AI-powered prompt suggestions.",
              gif: "/feature8.mp4",
            },
            {
              title: "Photo Enhancer & Upscaler",
              tagline: "Old Photos, New Vibes",
              copy:
                "Bring faded memories back to life, sharpen the details, and upscale images for crystal-clear impact—nostalgia never looked so fresh.",
              gif: "/feature10.mp4",
            },
            {
              title: "Brand Kit Integration",
              tagline: "Your Brand, Bottled and Poured",
              copy:
                "Every image, every edit—always on-brand. Juicebox remembers your colors, fonts, and style, so your story stays consistent, campaign after campaign.",
              gif: "/feature9.mp4",
            },
            {
              title: "Gallery & Collaboration",
              tagline: "Showcase, Share, and Shine",
              copy:
                "Curate your creations, collaborate with your crew, and build a gallery that's as vibrant as your imagination.",
              gif: "/feature11.mp4",
            },
            {
              title: "Campaign Automation & Scheduling",
              tagline: "Set It, Forget It, Celebrate It",
              copy:
                "Plan, generate, and launch brand campaigns across socials—automatically. Juicebox handles the heavy lifting, you take the spotlight.",
              gif: "/feature12.mp4",
            },
          ].map((card, i) => (
            <div
              key={card.title}
              className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/20 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white/20 hover:via-white/15 hover:to-white/10 hover:border-white/30 cursor-pointer"
              style={{
                boxShadow: "0 8px 32px 0 rgba(178, 255, 89, 0.1), 0 2px 16px 0 rgba(118, 255, 3, 0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 16px 48px 0 rgba(178, 255, 89, 0.2), 0 4px 24px 0 rgba(118, 255, 3, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(178, 255, 89, 0.1), 0 2px 16px 0 rgba(118, 255, 3, 0.05)";
              }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-transparent to-lime-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              
              {/* Feature number badge */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-lime-400/20 backdrop-blur-sm border border-lime-400/30 rounded-full flex items-center justify-center text-lime-300 text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                {(i + 1).toString().padStart(2, '0')}
              </div>

              <div className="relative z-10 flex flex-col h-full">
                {/* Media section */}
                <div className="flex items-center justify-center mb-6 relative overflow-hidden rounded-2xl bg-black/20 border border-white/10 group-hover:border-lime-400/30 transition-colors duration-300">
                  {card.gif.match(/\.(mp4|webm)$/i) ? (
                    <video
                      src={card.gif}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={card.gif}
                      alt="Feature demo GIF"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  {/* Play overlay for videos */}
                  {card.gif.match(/\.(mp4|webm)$/i) && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content section */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-lime-100 transition-colors duration-300">
                    {card.title}
                  </h3>
                  <div className="text-lime-300 font-semibold mb-4 text-base group-hover:text-lime-200 transition-colors duration-300">
                    {card.tagline}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed opacity-90 group-hover:opacity-100 group-hover:text-gray-200 transition-all duration-300 flex-1">
                    {card.copy}
                  </p>
                  
                  {/* Action indicator */}
                  <div className="flex items-center mt-4 text-lime-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span>Explore feature</span>
                    <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Call to Action below feature cards */}
        <div className="w-full flex flex-col items-center mt-16">
          <div className="text-2xl md:text-3xl font-bold text-white text-center mb-6 max-w-2xl">
            Ready to squeeze more out of your creativity? Dive into Juicebox and let your ideas flow!
          </div>
          <button
            className="font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg bg-gradient-to-r from-lime-400 to-lime-500 text-black hover:from-lime-300 hover:to-lime-400"
            onClick={() => router.push("/home")}
          >
            Get started
          </button>
        </div>
      </div>
      
      {/* Try Juicebox Live Section */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Try juicebox live!
        </h2>
        {/* Live Demo with API integration */}
        <LiveDemoWithApi />
      </div>
      {/* Ready for more CTA */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className="text-4xl font-bold text-white text-center mb-8">
          Ready for more
        </h2>
        <button className="font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg bg-gradient-to-r from-lime-400 to-lime-500 text-black hover:from-lime-300 hover:to-lime-400">
          Get started free
        </button>
      </div>
      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <span>Built in India</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

/* Add this to your global CSS or in a <style jsx global> block if not present: */
/* Add this to your global CSS or in a <style jsx global> block if not present:

.animate-blink { animation: blink 1s steps(2, start) infinite; }
@keyframes blink { to { visibility: hidden; } }

.animate-gradient-x { animation: gradient-x 3s ease infinite; }
@keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.bg-300% { background-size: 300% 300%; }

.drop-shadow-glow { filter: drop-shadow(0 0 20px rgba(178, 255, 89, 0.5)); }

@keyframes float0 { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-15px) rotate(2deg);} }
@keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-25px) rotate(-2deg);} }
@keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-10px) rotate(1deg);} }
.animate-float0 { animation: float0 4s ease-in-out infinite; }
.animate-float1 { animation: float1 5s ease-in-out infinite; }
.animate-float2 { animation: float2 3.5s ease-in-out infinite; }
.animate-pulse0 { animation: pulse 2.5s infinite alternate; }
.animate-pulse1 { animation: pulse 3s infinite alternate; }
@keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(178, 255, 89, 0.4);} 100%{box-shadow:0 0 25px 10px rgba(178, 255, 89, 0.1);} }

.bg-gradient-radial { background: radial-gradient(ellipse at center, var(--tw-gradient-stops)); }

.animate-blink-input::placeholder { animation: blink 1s steps(2, start) infinite; }

@keyframes gif-pop-in { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.animate-fade-in { animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
*/

/* Add to your global CSS:
.animate-blink-input::placeholder { animation: blink 1s steps(2, start) infinite; }
*/

/* Add to your global CSS:
@keyframes gif-pop-in { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.animate-fade-in { animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
*/

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

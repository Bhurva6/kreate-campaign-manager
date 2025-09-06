"use client";
import { useState, useRef, useEffect } from "react";
import { FaImage, FaUpload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useImageStore } from "../store/imageStore";
import Image from "next/image";
import React from "react";
import { useAuth } from "../lib/auth";
import { useCredits, Plan, PLANS } from "../lib/credits";
import AuthModal from "../components/AuthModal";
import UserDropdown from "../components/UserDropdown";
import RazorpayHandler from "../components/RazorpayHandler";
import { useTheme, ThemeProvider } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";

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

async function pollEditResult(
  polling_url: string,
  prompt: string
): Promise<string> {
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error("Image editing timed out");
}

// Define the pricing plans for the home page
const homePlans: Plan[] = [
  {
    id: "mini",
    name: "Mini",
    price: 299,
    imageGenerations: 50,
    imageEdits: 50,
    description: "Try it out",
    features: [
      "50 images per month",
      "Basic editing tools",
      "HD quality",
      "Download & share",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 700,
    imageGenerations: 150,
    imageEdits: 150,
    description: "Get started",
    features: [
      "150 images per month",
      "Standard editing tools",
      "HD quality",
      "Download & share",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 2200,
    imageGenerations: 525,
    imageEdits: 525,
    description: "For creators",
    features: [
      "525 images per month",
      "Priority processing",
      "Advanced editing tools",
      "4K quality",
      "AI style transfer",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 6000,
    imageGenerations: 1400,
    imageEdits: 1400,
    description: "Power user",
    features: [
      "1400 images per month",
      "Fastest processing",
      "All editing tools",
      "8K quality",
      "Batch processing",
      "API access",
    ],
  },
];

function LandingPageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    imageGenerationsUsed,
    imageEditsUsed,
    canUseImageGeneration,
    canUseImageEdit,
    isUnlimitedUser,
    consumeImageGeneration,
    consumeImageEdit,
    showPricingModal,
    setShowPricingModal,
  } = useCredits();

  // Theme state
  const { isDarkMode, toggleTheme } = useTheme();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Payment state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activePoint, setActivePoint] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto rotate points every 3 seconds
  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;
    
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setActivePoint(prev => (prev + 1) % 5); // Cycle through 0-4
      }, 3000);
    }
    
    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate]);

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    // Show success message for 3 seconds
    setTimeout(() => setPaymentSuccess(false), 3000);
  };

  // Handle payment failure
  const handlePaymentFailure = () => {
    // Could show a toast or error message here
    console.log("Payment failed");
  };

  // Scroll animation state for unify section
  const [scrollProgress, setScrollProgress] = useState(0);
  const unifyRef = useRef<HTMLDivElement>(null);

  // Scroll animation state for broken creativity section
  const [brokenCreativityProgress, setBrokenCreativityProgress] = useState(0);
  const brokenCreativityRef = useRef<HTMLDivElement>(null);

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

          const progress = Math.max(
            0,
            Math.min(1, (startTrigger - rect.top) / totalRange)
          );
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

          const progress = Math.max(
            0,
            Math.min(1, (startTrigger - rect.top) / totalRange)
          );
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

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[var(--background)] font-sans">
      {/* First Viewport - Completely Black */}
      <div className="min-h-screen flex flex-col bg-black relative">
        {/* Logo Top Left and Auth Buttons Top Right */}
        <div className="flex flex-row justify-between items-center w-full p-4 md:p-6 bg-black z-10">
          <div className="text-2xl md:text-3xl font-bold text-white">
            GoLoco
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Authentication Section */}
            {loading ? (
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                <UserDropdown />
              </div>
            ) : (
              <>
                <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                <button
                  className="px-3 py-1.5 md:px-6 md:py-2 rounded-lg bg-gradient-to-r from-[#0171B9] via-[#004684] to-[#E72C19] text-white font-semibold hover:shadow-lg hover:shadow-[#0171B9]/25 transition-all duration-300 text-sm md:text-base"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign Up
                </button>
                <button
                  className="px-3 py-1.5 md:px-6 md:py-2 rounded-lg bg-[#004684] text-white font-semibold hover:bg-[#0171B9] transition-all duration-300 text-sm md:text-base"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero Content - Full Black Viewport */}
        <div className="flex-1 flex flex-col justify-center items-center pt-0 md:pt-0 lg:pt-0 pb-16 lg:pb-24 px-4 md:px-8 lg:px-12 relative bg-black">
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-900/30"></div>

          {/* Content - Centered */}
          <div className="relative z-10 text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              <span className="text-[#FF5E32]">
                Consistent
               </span>{" "}
               creativity with every image, every time.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
             GoLoco changes exactly what you want{" "}
              <em className="font-medium text-white">no distortions, no chaos.</em> 
         
            </p>

            {/* CTA Button */}
            <button
              className="mx-auto inline-flex items-center gap-3 font-semibold px-8 sm:px-10 py-2.5 sm:py-3 rounded-full text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 bg-[#B6CF4F] text-white hover:shadow-[#1A018D]/30"
              onClick={() => {
                if (user) {
                  router.push("/demo");
                } else {
                  setShowAuthModal(true);
                }
              }}
            >
              <span>✨</span>
              Start Editing
              <span className="text-sm opacity-80">→</span>
            </button>
            
            {/* Spacer div to ensure proper spacing */}
            <div className="h-12 md:h-22 lg:h-10"></div>
            
            {/* Custom Animation for Progress Bar */}
            <style jsx global>{`
              @keyframes progress-bar {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
            
            {/* Interactive Feature Section */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 my-10">
              {/* Left Side - Numerical Bullet Points */}
              <div className="w-full md:w-1/3">
                <ul className="space-y-5">
                  {[1, 2, 3, 4, 5].map((num, index) => (
                    <li 
                      key={num} 
                      className="flex items-center cursor-pointer transition-all duration-300 group hover:translate-x-1" 
                      onClick={() => {
                        setActivePoint(index);
                        setAutoRotate(false); // Pause auto-rotation when user manually clicks
                        // Resume auto-rotation after 5 seconds of inactivity
                        setTimeout(() => setAutoRotate(true), 5000);
                      }}
                    >
                      <div 
                        className={`w-1 h-full rounded-full transition-all duration-300 mr-3 ${
                          activePoint === index 
                            ? 'bg-[#0171B9]' 
                            : 'bg-white/30'
                        } ${activePoint === index && autoRotate ? 'animate-pulse' : ''}`}
                      ></div>
                      <div className={`transition-all duration-300 text-left flex-grow ${activePoint === index ? 'opacity-100' : 'opacity-60'}`}>
                        <h3 className="text-xl font-semibold text-white flex items-center">
                          <span className="flex-shrink-0 border-2 border-[#0171B9] rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm px-4 py-1.5">
                            Step {index + 1}
                          </span>
                          <span>
                            {index === 0 && "Upload the Einstein"}
                            {index === 1 && "Drop the bombshell: \"Shit Happens.\""}
                            {index === 2 && "Flip the script—now it's \"Edit Happens.\""}
                            {index === 3 && "Light up the genius—full color mode on."}
                            {index === 4 && "Cartoon chaos: let creativity rip through his eyes"}
                          </span>
                        </h3>
                       
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Right Side - Images */}
              <div className="w-full md:w-2/3 h-80 md:h-96 relative rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-800">
                {/* Progress Indicator Bar */}
                {autoRotate && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0171B9] via-[#004684] to-[#E72C19] transition-all duration-100 ease-linear"
                      style={{ 
                        width: '100%', 
                        animation: 'progress-bar 3s linear infinite',
                      }}
                    ></div>
                  </div>
                )}
                
                {/* Auto-rotation Indicator */}
                <div 
                  className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-2 py-1 rounded bg-black/50 text-white text-xs ${autoRotate ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                >
                  <span className="w-2 h-2 bg-[#0171B9] rounded-full animate-ping"></span>
                  <span>Auto</span>
                </div>
                
                {/* Images */}
                {[
                  "/einstein1.jpeg", 
                  "/einstein2.jpeg", 
                  "/einstein3.jpeg", 
                  "/einstein4.jpeg",
                    "/einstein5.jpeg"
                ].map((src, index) => (
                  <div 
                    key={index}
                    className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-500 ${activePoint === index ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <img 
                      src={src} 
                      alt={`Feature ${index + 1}`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
            
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
      <div
        className="transition-colors duration-300 bg-[var(--background)]"
      >
        {/* Unify Your Creations Section - Jeton Inspired */}
        <div
          ref={unifyRef}
          className="w-full py-32 md:py-48 px-4 relative overflow-hidden"
        >
          {/* Overlapping Images Container with Centered Text - Deck of Cards Effect */}
          <div className="relative max-w-4xl mx-auto h-[400px] md:h-[500px] transition-all duration-1000 ease-out">
            {/* Centered Title - Behind Images */}
            <div
              className="absolute inset-0 flex items-center justify-center text-center transition-all duration-1500 ease-out z-5 pointer-events-none"
              style={{
                transform: `scale(${Math.max(0.3, 2 - scrollProgress * 1.7)})`,
                opacity: 1,
              }}
            >
              <h2
                className="text-6xl md:text-8xl lg:text-9xl font-bold leading-tight transition-colors duration-300 text-[var(--foreground)]"
              >
                Unify your
                <br />
                <span className="bg-gradient-to-r from-[#1A018D] via-[#B6CF4F] to-[#FF5E32] bg-clip-text text-transparent">
                  creations
                </span>
              </h2>
            </div>
            {/* Image 1 - First card (bottom of stack when stacked) */}
            <div
              className="absolute transition-all duration-1500 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `
                translate(-50%, -50%) 
                translateX(${
                  scrollProgress < 0.6
                    ? -800 + scrollProgress * 1333
                    : scrollProgress > 0.9
                    ? 0
                    : (scrollProgress - 0.6) * -133
                }px)
                translateY(${
                  scrollProgress < 0.6
                    ? -400 + scrollProgress * 667
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 600
                    : 0
                }px)
                rotate(${
                  scrollProgress < 0.6
                    ? -45 + scrollProgress * 75
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * -200
                    : 0
                }deg)
                scale(${Math.max(0.6, 0.3 + scrollProgress * 0.7)})
              `,
                opacity: Math.min(
                  1,
                  Math.max(0, (scrollProgress - 0.3) * 3.33)
                ),
                zIndex: scrollProgress > 0.9 ? 1 : 5,
              }}
            >
              <div className="w-48 h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
                <img
                  src="/stone.jpg"
                  alt="Creative process"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Image 2 - Second card */}
            <div
              className="absolute transition-all duration-1500 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `
                translate(-50%, -50%) 
                translateX(${
                  scrollProgress < 0.65
                    ? 600 - scrollProgress * 923
                    : scrollProgress > 0.9
                    ? 10
                    : (scrollProgress - 0.65) * -40
                }px)
                translateY(${
                  scrollProgress < 0.65
                    ? 300 - scrollProgress * 462
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 400
                    : 0
                }px)
                rotate(${
                  scrollProgress < 0.65
                    ? 30 - scrollProgress * 46
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * -100
                    : 0
                }deg)
                scale(${Math.max(0.65, 0.4 + scrollProgress * 0.6)})
              `,
                opacity: Math.min(1, Math.max(0, (scrollProgress - 0.4) * 4)),
                zIndex: scrollProgress > 0.9 ? 2 : 4,
              }}
            >
              <div className="w-50 h-62 md:w-58 md:h-74 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
                <img
                  src="/stair.jpg"
                  alt="AI editing"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Image 3 - Center card (top of stack when stacked) */}
            <div
              className="absolute transition-all duration-1500 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `
                translate(-50%, -50%) 
                translateX(${
                  scrollProgress < 0.7 ? 0 : scrollProgress > 0.9 ? 0 : 0
                }px)
                translateY(${
                  scrollProgress < 0.7
                    ? 200 - scrollProgress * 286
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 200
                    : 0
                }px)
                rotate(${scrollProgress > 0.9 ? 0 : 0}deg)
                scale(${Math.max(0.7, 0.5 + scrollProgress * 0.5)})
              `,
                opacity: Math.min(1, Math.max(0, (scrollProgress - 0.5) * 5)),
                zIndex: scrollProgress > 0.9 ? 5 : 3,
              }}
            >
              <div className="w-56 h-68 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 hover:scale-105 transition-transform duration-300">
                <img
                  src="/room.jpg"
                  alt="Perfect creation"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Image 4 - Fourth card */}
            <div
              className="absolute transition-all duration-1500 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `
                translate(-50%, -50%) 
                translateX(${
                  scrollProgress < 0.75
                    ? -600 + scrollProgress * 800
                    : scrollProgress > 0.9
                    ? -10
                    : (0.75 - scrollProgress) * -40
                }px)
                translateY(${
                  scrollProgress < 0.75
                    ? -300 + scrollProgress * 400
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 400
                    : 0
                }px)
                rotate(${
                  scrollProgress < 0.75
                    ? -30 + scrollProgress * 40
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 100
                    : 0
                }deg)
                scale(${Math.max(0.65, 0.4 + scrollProgress * 0.6)})
              `,
                opacity: Math.min(
                  1,
                  Math.max(0, (scrollProgress - 0.6) * 6.67)
                ),
                zIndex: scrollProgress > 0.9 ? 2 : 2,
              }}
            >
              <div className="w-50 h-62 md:w-58 md:h-74 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
                <img
                  src="/purple.jpg"
                  alt="Share creation"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Image 5 - Fifth card (bottom when stacked) */}
            <div
              className="absolute transition-all duration-1500 ease-out"
              style={{
                left: "50%",
                top: "50%",
                transform: `
                translate(-50%, -50%) 
                translateX(${
                  scrollProgress < 0.8
                    ? 800 - scrollProgress * 1000
                    : scrollProgress > 0.9
                    ? -20
                    : (0.8 - scrollProgress) * -200
                }px)
                translateY(${
                  scrollProgress < 0.8
                    ? -400 + scrollProgress * 500
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 600
                    : 0
                }px)
                rotate(${
                  scrollProgress < 0.8
                    ? 45 - scrollProgress * 56.25
                    : scrollProgress > 0.9
                    ? (scrollProgress - 0.9) * 200
                    : 0
                }deg)
                scale(${Math.max(0.6, 0.3 + scrollProgress * 0.7)})
              `,
                opacity: Math.min(1, Math.max(0, (scrollProgress - 0.7) * 10)),
                zIndex: scrollProgress > 0.9 ? 1 : 1,
              }}
            >
              <div className="w-46 h-58 md:w-54 md:h-70 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-300">
                <img
                  src="/person.jpg"
                  alt="Endless possibilities"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Floating particles that appear during stacking */}
            <div
              className="absolute w-3 h-3 bg-[#1A018D] rounded-full animate-pulse"
              style={{
                left: `${50 + Math.sin(scrollProgress * 10) * 20}%`,
                top: `${30 + Math.cos(scrollProgress * 8) * 15}%`,
                opacity:
                  scrollProgress > 0.85 ? (scrollProgress - 0.85) * 6.67 : 0,
                transform: `scale(${0.5 + scrollProgress * 0.5})`,
              }}
            ></div>
            <div
              className="absolute w-2 h-2 bg-[#B6CF4F] rounded-full animate-pulse"
              style={{
                right: `${40 + Math.sin(scrollProgress * 12) * 25}%`,
                bottom: `${25 + Math.cos(scrollProgress * 9) * 20}%`,
                opacity: scrollProgress > 0.9 ? (scrollProgress - 0.9) * 10 : 0,
                animationDelay: "0.5s",
                transform: `scale(${0.3 + scrollProgress * 0.7})`,
              }}
            ></div>
            <div
              className="absolute w-1.5 h-1.5 bg-[#FF5E32] rounded-full animate-pulse"
              style={{
                left: `${70 + Math.sin(scrollProgress * 15) * 15}%`,
                top: `${60 + Math.cos(scrollProgress * 11) * 10}%`,
                opacity:
                  scrollProgress > 0.95 ? (scrollProgress - 0.95) * 20 : 0,
                animationDelay: "1s",
                transform: `scale(${0.2 + scrollProgress * 0.8})`,
              }}
            ></div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full flex flex-col items-center mt-16 md:mt-32 mb-16 md:mb-32 px-4">
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 transition-colors duration-300 text-[var(--foreground)]"
          >
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
                    const percentage = Math.max(
                      0,
                      Math.min(100, (currentX / rect.width) * 100)
                    );

                    const afterImage = slider.querySelector(
                      ".after-image"
                    ) as HTMLElement;
                    const sliderHandle = slider.querySelector(
                      ".slider-handle"
                    ) as HTMLElement;
                    const sliderLine = slider.querySelector(
                      ".slider-line"
                    ) as HTMLElement;

                    if (afterImage)
                      afterImage.style.clipPath = `inset(0 ${
                        100 - percentage
                      }% 0 0)`;
                    if (sliderHandle)
                      sliderHandle.style.left = `${percentage}%`;
                    if (sliderLine) sliderLine.style.left = `${percentage}%`;
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                    if (!isDragging) {
                      // Handle click to move slider
                      const percentage = Math.max(
                        0,
                        Math.min(100, (startX / rect.width) * 100)
                      );
                      const afterImage = slider.querySelector(
                        ".after-image"
                      ) as HTMLElement;
                      const sliderHandle = slider.querySelector(
                        ".slider-handle"
                      ) as HTMLElement;
                      const sliderLine = slider.querySelector(
                        ".slider-line"
                      ) as HTMLElement;

                      if (afterImage)
                        afterImage.style.clipPath = `inset(0 ${
                          100 - percentage
                        }% 0 0)`;
                      if (sliderHandle)
                        sliderHandle.style.left = `${percentage}%`;
                      if (sliderLine) sliderLine.style.left = `${percentage}%`;
                    }
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
                style={{ cursor: "ew-resize" }}
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
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                  draggable={false}
                />

                {/* Slider Line */}
                <div
                  className="slider-line absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                ></div>

                {/* Slider Handle */}
                <div
                  className="slider-handle absolute top-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-[#1A018D] pointer-events-none flex items-center justify-center z-20"
                  style={{ left: "50%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-1 h-4 bg-[#1A018D] rounded-full"></div>
                  <div className="w-1 h-4 bg-[#1A018D] rounded-full ml-1"></div>
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
              <h3 className="text-xl md:text-2xl font-bold text-[#0171B9] mb-4">
                Edit Like It’s Magic
              </h3>
              <p
                className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-80"
                    : "text-[#1E1E1E] opacity-80"
                }`}
              >
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
                    const percentage = Math.max(
                      0,
                      Math.min(100, (currentX / rect.width) * 100)
                    );

                    const afterImage = slider.querySelector(
                      ".after-image-2"
                    ) as HTMLElement;
                    const sliderHandle = slider.querySelector(
                      ".slider-handle-2"
                    ) as HTMLElement;
                    const sliderLine = slider.querySelector(
                      ".slider-line-2"
                    ) as HTMLElement;

                    if (afterImage)
                      afterImage.style.clipPath = `inset(0 ${
                        100 - percentage
                      }% 0 0)`;
                    if (sliderHandle)
                      sliderHandle.style.left = `${percentage}%`;
                    if (sliderLine) sliderLine.style.left = `${percentage}%`;
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                    if (!isDragging) {
                      // Handle click to move slider
                      const percentage = Math.max(
                        0,
                        Math.min(100, (startX / rect.width) * 100)
                      );
                      const afterImage = slider.querySelector(
                        ".after-image-2"
                      ) as HTMLElement;
                      const sliderHandle = slider.querySelector(
                        ".slider-handle-2"
                      ) as HTMLElement;
                      const sliderLine = slider.querySelector(
                        ".slider-line-2"
                      ) as HTMLElement;

                      if (afterImage)
                        afterImage.style.clipPath = `inset(0 ${
                          100 - percentage
                        }% 0 0)`;
                      if (sliderHandle)
                        sliderHandle.style.left = `${percentage}%`;
                      if (sliderLine) sliderLine.style.left = `${percentage}%`;
                    }
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
                style={{ cursor: "ew-resize" }}
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
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                  draggable={false}
                />

                {/* Slider Line */}
                <div
                  className="slider-line-2 absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                ></div>

                {/* Slider Handle */}
                <div
                  className="slider-handle-2 absolute top-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-[#B6CF4F] pointer-events-none flex items-center justify-center z-20"
                  style={{ left: "50%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-1 h-4 bg-[#B6CF4F] rounded-full"></div>
                  <div className="w-1 h-4 bg-[#B6CF4F] rounded-full ml-1"></div>
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
              <h3 className="text-xl md:text-2xl font-bold text-[#B6CF4F] mb-4">
                Enhance Instantly
              </h3>
              <p
                className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-80"
                    : "text-[#1E1E1E] opacity-80"
                }`}
              >
                Upscale, restore, colorize — your images, sharper and stronger
                in seconds.
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
              <h3 className="text-xl md:text-2xl font-bold text-[#FF5E32] mb-4">
                Always On-Brand
              </h3>
              <p
                className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-80"
                    : "text-[#1E1E1E] opacity-80"
                }`}
              >
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
              <h3 className="text-xl md:text-2xl font-bold text-[#0171B9] mb-4">
                Automate the Boring Stuff
              </h3>
              <p
                className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-80"
                    : "text-[#1E1E1E] opacity-80"
                }`}
              >
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
              <h3 className="text-xl md:text-2xl font-bold text-[#B6CF4F] mb-4">
                Find Inspiration Backwards
              </h3>
              <p
                className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-80"
                    : "text-[#1E1E1E] opacity-80"
                }`}
              >
                Upload one image → get infinite reimaginings. Inspiration in
                reverse.
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
              <h3 className="text-xl md:text-2xl font-bold text-[#FF5E32] mb-4">
                Create Together
              </h3>
              <p
                className={`text-base md:text-lg leading-relaxed max-w-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-80"
                    : "text-[#1E1E1E] opacity-80"
                }`}
              >
                Moodboards, shared galleries, teamwork — creativity works better
                when it’s social.
              </p>
            </div>
          </div>
        </div>

        {/* Fun Testimonials Section */}
        <div className="w-full flex flex-col items-center mt-16 md:mt-32 mb-16 md:mb-32 px-4">
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-[#1E1E1E]"
            }`}
          >
            Fun Testimonials
          </h2>

          <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8">
            {/* Testimonial 1 */}
            <div className="flex items-start gap-3 md:gap-4 animate-slide-in-left">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#0171B9] to-[#004684] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                  😊
                </div>
              </div>
              <div
                className={`rounded-3xl rounded-tl-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-[#333] border-[#0171B9]/20"
                    : "bg-white border-[#0171B9]/20"
                }`}
              >
                <div
                  className={`absolute -left-2 top-4 w-4 h-4 border-l-2 border-b-2 border-[#0171B9]/20 transform rotate-45 transition-colors duration-300 ${
                    isDarkMode ? "bg-[#333]" : "bg-white"
                  }`}
                ></div>
                <p
                  className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  &quot;I changed my background 5 times — my face never changed
                  once. Love it!&quot;
                </p>
                <div className="text-[#0171B9] font-semibold mt-3 text-xs md:text-sm">
                  - Ananya K.
                </div>
              </div>
            </div>

            {/* Testimonial 2 - Right aligned */}
            <div className="flex items-start gap-3 md:gap-4 justify-end animate-slide-in-right">
              <div
                className={`rounded-3xl rounded-tr-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-[#004684]/20 to-[#E72C19]/20 border-[#004684]/20"
                    : "bg-gradient-to-br from-[#004684]/10 to-[#E72C19]/10 border-[#004684]/20"
                }`}
              >
                <div
                  className={`absolute -right-2 top-4 w-4 h-4 border-r-2 border-b-2 border-[#004684]/20 transform rotate-45 transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gradient-to-br from-[#004684]/20 to-[#E72C19]/20"
                      : "bg-gradient-to-br from-[#004684]/10 to-[#E72C19]/10"
                  }`}
                ></div>
                <p
                  className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  &quot;Finally an editor that listens to me!&quot;
                </p>
                <div className="text-[#004684] font-semibold mt-3 text-xs md:text-sm">
                  - Mahesh R.
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#004684] to-[#E72C19] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                  🤩
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="flex items-start gap-3 md:gap-4 animate-slide-in-left">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#E72C19] to-[#0171B9] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                  🎨
                </div>
              </div>
              <div
                className={`rounded-3xl rounded-tl-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-[#333] border-[#E72C19]/20"
                    : "bg-white border-[#E72C19]/20"
                }`}
              >
                <div
                  className={`absolute -left-2 top-4 w-4 h-4 border-l-2 border-b-2 border-[#E72C19]/20 transform rotate-45 transition-colors duration-300 ${
                    isDarkMode ? "bg-[#333]" : "bg-white"
                  }`}
                ></div>
                <p
                  className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  &quot;Magic! Only the sky changed, my perfect selfie stayed
                  untouched ✨&quot;
                </p>
                <div className="text-[#E72C19] font-semibold mt-3 text-xs md:text-sm">
                  - Arya T.
                </div>
              </div>
            </div>

            {/* Testimonial 4 - Right aligned */}
            <div className="flex items-start gap-3 md:gap-4 justify-end animate-slide-in-right">
              <div
                className={`rounded-3xl rounded-tr-sm p-4 md:p-6 shadow-lg border-2 max-w-full md:max-w-md relative transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-[#0171B9]/20 to-[#004684]/20 border-[#0171B9]/20"
                    : "bg-gradient-to-br from-[#0171B9]/10 to-[#004684]/10 border-[#0171B9]/20"
                }`}
              >
                <div
                  className={`absolute -right-2 top-4 w-4 h-4 border-r-2 border-b-2 border-[#0171B9]/20 transform rotate-45 transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gradient-to-br from-[#0171B9]/20 to-[#004684]/20"
                      : "bg-gradient-to-br from-[#0171B9]/10 to-[#004684]/10"
                  }`}
                ></div>
                <p
                  className={`text-base md:text-lg leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  &quot;No more &apos;oops I ruined my photo&apos; moments.
                  GoLoco gets it right!&quot;
                </p>
                <div className="text-[#0171B9] font-semibold mt-3 text-xs md:text-sm">
                  - Eshaan L.
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#0171B9] to-[#004684] flex items-center justify-center text-white text-lg md:text-xl font-bold">
                  💯
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message for Payment */}
        {paymentSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg">
            Payment successful! Your plan has been activated.
          </div>
        )}

        {/* Pricing Section */}
        <div
          id="pricing-section"
          className="w-full flex flex-col items-center mt-16 md:mt-32 mb-16 md:mb-32 px-4"
        >
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-[#1E1E1E]"
            }`}
          >
            Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 justify-center items-stretch w-full max-w-7xl mx-auto">
            {/* Free Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#004684]/40 hover:shadow-xl hover:shadow-[#0171B9]/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#0171B9]/20 to-[#004684]/20 border-[#0171B9]/20"
                  : "bg-gradient-to-br from-[#0171B9]/10 to-[#004684]/10 border-[#0171B9]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-bold text-[#0171B9] mb-2">Free</h3>
                <p className="text-[#004684] font-semibold text-sm mb-4">
                  &quot;Try it out&quot;
                </p>

                <div
                  className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹0
                </div>

                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">✨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      3 free image generations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">🖼️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      7 free image edits
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">📱</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Standard resolution
                    </span>
                  </div>
                </div>

                <button
                  className="w-full px-4 py-2 rounded-lg bg-[#0171B9] text-white font-semibold hover:bg-[#004684] transition text-sm"
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

            {/* Mini Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#004684]/40 hover:shadow-xl hover:shadow-[#004684]/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#004684]/20 to-[#E72C19]/20 border-[#004684]/20"
                  : "bg-gradient-to-br from-[#004684]/10 to-[#E72C19]/10 border-[#004684]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🧃</div>
                <h3 className="text-xl font-bold text-[#B6CF4F] mb-2">Mini</h3>
                <p className="text-[#FF5E32] font-semibold text-sm mb-4">
                  &quot;Try it out&quot;
                </p>

                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹299
                </div>
                <div
                  className={`text-xs mb-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-60"
                      : "text-[#1E1E1E] opacity-60"
                  }`}
                >
                  50 images per month
                </div>

                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#004684] text-sm">⚡</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      50 images per month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#004684] text-sm">🎨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Basic editing tools
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#004684] text-sm">📸</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      HD quality
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#004684] text-sm">💾</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Download & share
                    </span>
                  </div>
                </div>

                {user ? (
                  <RazorpayHandler
                    plan={homePlans[0]}
                    buttonText="Choose Mini"
                    customClassName="w-full px-4 py-2 rounded-lg bg-[#B6CF4F] text-white font-semibold hover:bg-[#FF5E32] transition text-sm"
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                ) : (
                  <button
                    className="w-full px-4 py-2 rounded-lg bg-[#B6CF4F] text-white font-semibold hover:bg-[#FF5E32] transition text-sm"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Choose Mini
                  </button>
                )}
              </div>
            </div>

            {/* Pro Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#E72C19]/40 hover:shadow-xl hover:shadow-[#E72C19]/20 relative ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#E72C19]/20 to-[#0171B9]/20 border-[#E72C19]/20"
                  : "bg-gradient-to-br from-[#E72C19]/10 to-[#0171B9]/10 border-[#E72C19]/20"
              }`}
            >
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FF5E32] text-white px-3 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>

              <div className="text-center">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-xl font-bold text-[#FF5E32] mb-2">Pro</h3>
                <p className="text-[#1A018D] font-semibold text-sm mb-4">
                  &quot;For creators&quot;
                </p>

                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹2,200
                </div>
                <div
                  className={`text-xs mb-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-60"
                      : "text-[#1E1E1E] opacity-60"
                  }`}
                >
                  525 images per month
                </div>

                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E72C19] text-sm">🔥</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      525 images per month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E72C19] text-sm">⚡</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Priority processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E72C19] text-sm">🎨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Advanced editing tools
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E72C19] text-sm">📸</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      4K quality
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E72C19] text-sm">🎭</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      AI style transfer
                    </span>
                  </div>
                </div>

                {user ? (
                  <RazorpayHandler
                    plan={homePlans[1]}
                    buttonText="Choose Pro"
                    customClassName="w-full px-4 py-2 rounded-lg bg-[#FF5E32] text-white font-semibold hover:bg-[#1A018D] transition text-sm"
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                ) : (
                  <button
                    className="w-full px-4 py-2 rounded-lg bg-[#FF5E32] text-white font-semibold hover:bg-[#1A018D] transition text-sm"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Choose Pro
                  </button>
                )}
              </div>
            </div>

            {/* Basic Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#0171B9]/40 hover:shadow-xl hover:shadow-[#0171B9]/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#0171B9]/20 to-[#004684]/20 border-[#0171B9]/20"
                  : "bg-gradient-to-br from-[#0171B9]/10 to-[#004684]/10 border-[#0171B9]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="text-xl font-bold text-[#0171B9] mb-2">Basic</h3>
                <p className="text-[#004684] font-semibold text-sm mb-4">
                  &quot;Get started&quot;
                </p>

                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹700
                </div>
                <div
                  className={`text-xs mb-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-60"
                      : "text-[#1E1E1E] opacity-60"
                  }`}
                >
                  150 images per month
                </div>

                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">🖼️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      150 images per month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">⚡</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Fastest processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#1A018D] text-sm">🎨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      All editing tools
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">📸</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      8K quality
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">📊</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Batch processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#0171B9] text-sm">🔗</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      API access
                    </span>
                  </div>
                </div>

                {user ? (
                  <RazorpayHandler
                    plan={homePlans[2]}
                    buttonText="Choose Basic"
                    customClassName="w-full px-4 py-2 rounded-lg bg-[#1A018D] text-white font-semibold hover:bg-[#B6CF4F] transition text-sm"
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                ) : (
                  <button
                    className="w-full px-4 py-2 rounded-lg bg-[#1A018D] text-white font-semibold hover:bg-[#B6CF4F] transition text-sm"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Choose Basic
                  </button>
                )}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-gray-400/40 hover:shadow-xl hover:shadow-gray-400/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-700/20 to-gray-600/20 border-gray-600/20"
                  : "bg-gradient-to-br from-gray-100/50 to-gray-200/50 border-gray-300/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">
                  Enterprise
                </h3>
                <p className="text-gray-500 font-semibold text-sm mb-4">
                  &quot;Custom solution&quot;
                </p>

                <div
                  className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹6,000
                </div>
                <div
                  className={`text-xs mb-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-60"
                      : "text-[#1E1E1E] opacity-60"
                  }`}
                >
                  1400 images per month
                </div>

                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">🖼️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      1400 images per month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">🎯</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Custom branding
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">🔧</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Custom integrations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">👥</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Team management
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">📞</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      24/7 support
                    </span>
                  </div>
                </div>

                <button
                  className="w-full px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition text-sm"
                  onClick={() => {
                    const subject = encodeURIComponent(
                      "Enterprise Plan Inquiry - GoLoco"
                    );
                    const body = encodeURIComponent(`Hello GoLoco Team,

I am interested in learning more about your Enterprise plan and would like to discuss custom pricing and features for my organization.

Please contact me to schedule a call or provide more information.

Best regards`);
                    const mailtoLink = `mailto:golocostudios@gmail.com?subject=${subject}&body=${body}`;
                    window.open(mailtoLink, "_self");
                  }}
                >
                  Talk to Us
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Popup */}
        {showPricingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
              className={`rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#333] border-[#0171B9]/20"
                  : "bg-white border-[#0171B9]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3
                  className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  Credits Exhausted!
                </h3>
                <div
                  className={`mb-4 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-90"
                      : "text-[#1E1E1E] opacity-90"
                  }`}
                >
                  <div className="text-sm mb-2">Your current usage:</div>
                  <div className="space-y-1 text-xs">
                    <div>Image Generations: {imageGenerationsUsed}/3 used</div>
                    <div>Image Edits: {imageEditsUsed}/7 used</div>
                  </div>
                </div>
                <p
                  className={`mb-6 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-80"
                      : "text-[#1E1E1E] opacity-80"
                  }`}
                >
                  You&apos;ve reached your free limit. Upgrade to continue
                  creating with unlimited generations, edits, and premium
                  features!
                </p>

                <div className="space-y-4 mb-6">
                  <div
                    className={`rounded-2xl p-4 border-2 transition-colors duration-300 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-[#0171B9]/20 to-[#004684]/20 border-[#0171B9]/20"
                        : "bg-gradient-to-br from-[#0171B9]/10 to-[#004684]/10 border-[#0171B9]/20"
                    }`}
                  >
                    <div className="text-lg font-bold text-[#0171B9]">
                      Pro Plan
                    </div>
                    <div
                      className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-white" : "text-[#1E1E1E]"
                      }`}
                    >
                      ₹2,200
                    </div>
                    <div
                      className={`text-sm transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-70"
                          : "text-[#1E1E1E] opacity-70"
                      }`}
                    >
                      600 credits • Unlimited generations & edits
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                      isDarkMode
                        ? "bg-[#555] text-white hover:bg-[#666]"
                        : "bg-[#F2F2F2] text-[#1E1E1E] hover:bg-[#E5E5E5]"
                    }`}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setShowPricingModal(false);
                      // Scroll to pricing section instead of going to signup
                      const pricingSection =
                        document.querySelector("#pricing-section");
                      if (pricingSection) {
                        pricingSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-[#0171B9] text-white font-semibold hover:bg-[#004684] transition"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer
          className={`w-full border-t px-8 py-12 transition-colors duration-300 ${
            isDarkMode
              ? "bg-gradient-to-br from-[#0171B9]/10 to-[#004684]/10 border-[#0171B9]/20"
              : "bg-gradient-to-br from-[#0171B9]/5 to-[#004684]/5 border-[#0171B9]/20"
          }`}
        >
          <div className="max-w-6xl mx-auto">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
              {/* Logo Section */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🎨</div>
                  <div className="text-3xl font-bold text-[#0171B9]">
                    GoLoco
                  </div>
                </div>
                <p
                  className={`text-sm max-w-sm transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-70"
                      : "text-[#1E1E1E] opacity-70"
                  }`}
                >
                  Edit fearlessly, create endlessly. Where your images stay true
                  while magic happens ✨
                </p>
              </div>

              {/* Quick Links */}
              <div className="flex flex-col md:flex-row gap-8">
                {/* Product Links */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-[#004684] mb-3">
                    Product
                  </h4>
                  <div className="space-y-2">
                    <a
                      href="/about"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                      }`}
                    >
                      About GoLoco
                    </a>
                    <a
                      href="/features"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                      }`}
                    >
                      Feature
                    </a>
                    <a
                      href="/pricing"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                      }`}
                    >
                      Pricing
                    </a>
                  </div>
                </div>

                {/* Support Links */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-[#E72C19] mb-3">
                    Support
                  </h4>
                  <div className="space-y-2">
                    <a
                      href="/faq"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                      }`}
                    >
                      FAQ
                    </a>
                    <a
                      href="/contact"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                      }`}
                    >
                      Contact Us
                    </a>
                    <a
                      href="/help"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#0171B9]"
                      }`}
                    >
                      Help Center
                    </a>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-[#0171B9] mb-3">
                    Connect
                  </h4>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="text-2xl hover:scale-110 transition-transform"
                      title="Twitter"
                    >
                      🐦
                    </a>
                    <a
                      href="#"
                      className="text-2xl hover:scale-110 transition-transform"
                      title="Instagram"
                    >
                      📸
                    </a>
                    <a
                      href="#"
                      className="text-2xl hover:scale-110 transition-transform"
                      title="Discord"
                    >
                      💬
                    </a>
                    <a
                      href="#"
                      className="text-2xl hover:scale-110 transition-transform"
                      title="YouTube"
                    >
                      📺
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-[#0171B9]/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div
                className={`flex items-center gap-6 text-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "text-white opacity-70"
                    : "text-[#1E1E1E] opacity-70"
                }`}
              >
                <span>
                  © {new Date().getFullYear()} GoLoco. All rights reserved.
                </span>
                <span className="flex items-center gap-2">
                  Made with ❤️ in India
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <a
                  href="/privacy"
                  className={`transition ${
                    isDarkMode
                      ? "text-white opacity-70 hover:opacity-100 hover:text-[#0171B9]"
                      : "text-[#1E1E1E] opacity-70 hover:opacity-100 hover:text-[#0171B9]"
                  }`}
                >
                  Privacy Policy
                </a>
                <span
                  className={`transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-40"
                      : "text-[#1E1E1E] opacity-40"
                  }`}
                >
                  •
                </span>
                <a
                  href="/terms"
                  className={`transition ${
                    isDarkMode
                      ? "text-white opacity-70 hover:opacity-100 hover:text-[#0171B9]"
                      : "text-[#1E1E1E] opacity-70 hover:opacity-100 hover:text-[#0171B9]"
                  }`}
                >
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

// Even though ThemeProvider is in ClientWrapper, we need it here as well 
// to ensure components can access the theme context immediately
export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingPageContent />
    </ThemeProvider>
  );
}

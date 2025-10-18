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
import Link from "next/link";

type GeneratedImage = { url: string; prompt?: string };

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
    id: "starter",
    name: "Starter",
    price: 49,
    imageGenerations: 10,
    imageEdits: 10,
    description: "Quick start",
    features: ["10 images per month", "Basic tools", "Download & share"],
  },
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
  const { isDarkMode } = useTheme();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Payment state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activePoint, setActivePoint] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  // Track window width for responsiveness
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop value
  const [isMounted, setIsMounted] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    setIsMounted(true);
  }, []);

  // Auto rotate points every 3 seconds
  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setActivePoint((prev) => (prev + 1) % 5); // Cycle through 0-4
      }, 3000);
    }

    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate]);

  // Handle window resize for responsive content
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card) => observer.observe(card));

    return () => {
      featureCards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[var(--background)] font-sans">
      {/* First Viewport - Completely Black */}
      <div className="min-h-screen flex flex-col bg-black relative">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/download.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 flex justify-center items-center z-10">
          <div className="text-center">
            <h1
              className="text-white font-bold drop-shadow-lg"
              style={{ fontFamily: "Helvetica", fontSize: "116px" }}
            >
              GOLOCO
            </h1>
            <h2
              className="text-white text-lg md:text-xl mt-1 drop-shadow-lg"
              style={{ fontFamily: "Helvetica" }}
            >
              Brand storytelling, made simple.
            </h2>
            <button
              className="mt-6 px-8 py-3 bg-white/20 backdrop-blur-md rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300 shadow-lg shadow-inner"
              onClick={() => {
                if (user) {
                  router.push("/demo");
                } else {
                  setShowAuthModal(true);
                }
              }}
            >
              Try Now
            </button>
          </div>
        </div>

        {/* Logo Top Left and Auth Buttons Top Right */}
        <div className="flex justify-between items-center w-full p-3 sm:p-4 md:p-6 bg-black z-[999999] relative">
          <Link href="/">
            <img
              src="/logo.png"
              alt="GoLoco Logo"
              className="h-8 sm:h-10 md:h-12 w-auto cursor-pointer"
            />
          </Link>
          <div className="flex justify-center items-center absolute left-1/2 transform -translate-x-1/2 gap-30">
            <Link
              href="/"
              className="text-white hover:text-[#3C38A4] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/campaign"
              className="text-white hover:text-[#3C38A4] transition-colors"
            >
              Campaigner
            </Link>
            <Link
              href="/festive"
              className="text-white hover:text-[#3C38A4] transition-colors"
            >
              Festive
            </Link>
             <Link
              href="/gif"
              className="text-white hover:text-[#3C38A4] transition-colors"
            >
              Animator
            </Link>

            <Link
              href="/pricing"
              className="text-white hover:text-[#3C38A4] transition-colors"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            {/* Authentication Section */}
            {loading ? (
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 relative z-[999999]">
                <UserDropdown />
              </div>
            ) : (
              <>
                <button
                  className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-lg bg-[#FF5E32] text-white font-semibold hover:shadow-lg hover:shadow-[#1A018D]/25 transition-all duration-300 text-xs sm:text-sm md:text-base whitespace-nowrap"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign Up
                </button>
                <button
                  className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-lg bg-[#B6CF4F] text-white font-semibold hover:bg-[#FF5E32] transition-all duration-300 text-xs sm:text-sm md:text-base whitespace-nowrap"
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/30 z-5"></div>
          <video autoPlay muted loop>
            <source src="/download.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Content sections with theme-aware background */}
      <div className="transition-colors duration-300 bg-[var(--background)]">
        {/* Features Section */}
        <div className="w-full flex flex-col items-center mt-12 sm:mt-16 md:mt-24 lg:mt-32 mb-12 sm:mb-16 md:mb-24 lg:mb-32 px-4 sm:px-6">
          <style jsx>{`
            @keyframes fadeInScale {
              0% { 
                opacity: 0;
                transform: scale(0.8);
              }
              100% { 
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes float {
              0% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-10px) rotate(1deg); }
              75% { transform: translateY(10px) rotate(-1deg); }
              100% { transform: translateY(0) rotate(0deg); }
            }

            .feature-card {
              opacity: 0;
              transform: scale(0.8);
            }

            .feature-card.visible {
              animation: fadeInScale 0.8s ease-out forwards;
            }

            .feature-card:hover {
              animation: float 3s ease-in-out infinite;
              box-shadow: 0 0 30px rgba(255,255,255,0.3);
            }
            
            @keyframes flow {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -30; }
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.1); }
            }
            
            .animate-flow {
              animation: flow 4s linear infinite;
            }
            
            .animate-pulse {
              animation: pulse 3s ease-in-out infinite;
            }
          `}</style>

          

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1200 600">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.1)" />
                <stop offset="50%" stop-color="rgba(255,255,255,0.5)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            <g stroke="url(#flowGradient)" stroke-width="2" fill="none" stroke-dasharray="15 15">
              <path d="M 184 96 L 600 96" className="animate-flow" style={{animationDelay: '0s'}} />
              <path d="M 600 96 L 1016 96" className="animate-flow" style={{animationDelay: '0.5s'}} />
              <path d="M 1016 96 L 1016 312" className="animate-flow" style={{animationDelay: '1s'}} />
              <path d="M 1016 312 L 600 312" className="animate-flow" style={{animationDelay: '1.5s'}} />
              <path d="M 600 312 L 184 312" className="animate-flow" style={{animationDelay: '2s'}} />
              <path d="M 184 312 L 184 528" className="animate-flow" style={{animationDelay: '2.5s'}} />
              <path d="M 184 528 L 600 528" className="animate-flow" style={{animationDelay: '3s'}} />
              <path d="M 600 528 L 1016 528" className="animate-flow" style={{animationDelay: '3.5s'}} />
            </g>
            <g fill="rgba(255,255,255,0.6)">
              <circle cx="184" cy="96" r="4" className="animate-pulse" />
              <circle cx="600" cy="96" r="4" className="animate-pulse" style={{animationDelay: '0.5s'}} />
              <circle cx="1016" cy="96" r="4" className="animate-pulse" style={{animationDelay: '1s'}} />
              <circle cx="1016" cy="312" r="4" className="animate-pulse" style={{animationDelay: '1.5s'}} />
              <circle cx="600" cy="312" r="4" className="animate-pulse" style={{animationDelay: '2s'}} />
              <circle cx="184" cy="312" r="4" className="animate-pulse" style={{animationDelay: '2.5s'}} />
              <circle cx="184" cy="528" r="4" className="animate-pulse" style={{animationDelay: '3s'}} />
              <circle cx="600" cy="528" r="4" className="animate-pulse" style={{animationDelay: '3.5s'}} />
              <circle cx="1016" cy="528" r="4" className="animate-pulse" style={{animationDelay: '4s'}} />
            </g>
          </svg>
        </div>
       

        {/* Success Message for Payment */}
        {paymentSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[998] bg-green-500 text-white px-6 py-3 rounded-md shadow-lg">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-center items-stretch w-full max-w-7xl mx-auto">
            {/* Free Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#6C2F83]/40 hover:shadow-xl hover:shadow-[#6C2F83]/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#6C2F83]/20 to-[#6C2F83]/20 border-[#6C2F83]/20"
                  : "bg-gradient-to-br from-[#6C2F83]/10 to-[#6C2F83]/10 border-[#6C2F83]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-bold text-[#6C2F83] mb-2">Free</h3>
                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹0
                </div>
                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6C2F83] text-sm">✨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      7 credits free
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6C2F83] text-sm">💳</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      No credit card required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6C2F83] text-sm">🔌</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Access to plugins and APIs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6C2F83] text-sm">🖼️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Process up to 7 hifi assets
                    </span>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-[#6C2F83] text-white font-semibold hover:bg-[#502D81] transition text-sm"
                  onClick={() => {
                    if (user) {
                      router.push("/demo");
                    } else {
                      setShowAuthModal(true);
                    }
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Pay-As-You-Go Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#181E53]/40 hover:shadow-xl hover:shadow-[#181E53]/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#181E53]/20 to-[#181E53]/20 border-[#181E53]/20"
                  : "bg-gradient-to-br from-[#181E53]/10 to-[#181E53]/10 border-[#181E53]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-xl font-bold text-[#181E53] mb-2">
                  Pay-As-You-Go
                </h3>
                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹0*
                </div>
                <div
                  className={`text-xs mb-2 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-60"
                      : "text-[#1E1E1E] opacity-60"
                  }`}
                >
                  /month
                </div>
                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#181E53] text-sm">💳</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      No monthly charges
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#181E53] text-sm">🔋</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Top-up credits as you go
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#181E53] text-sm">🔌</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Access to plugins, APIs, and Dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#181E53] text-sm">🛠️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Build Your Own (Localization) Model
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#181E53] text-sm">👥</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Great for teams with variable localization needs
                    </span>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-[#181E53] text-white font-semibold hover:bg-[#3C38A4] transition text-sm"
                  onClick={() => {
                    if (user) {
                      router.push("/demo");
                    } else {
                      setShowAuthModal(true);
                    }
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Plus Plan - Most Popular */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#502D81]/40 hover:shadow-xl hover:shadow-[#502D81]/20 relative ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#502D81]/20 to-[#502D81]/20 border-[#502D81]/20"
                  : "bg-gradient-to-br from-[#502D81]/10 to-[#502D81]/10 border-[#502D81]/20"
              }`}
            >
              {/* Most Popular Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#502D81] text-white px-3 py-1 rounded-full text-xs font-semibold">
                MOST POPULAR
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-bold text-[#502D81] mb-2">Plus</h3>
                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  ₹6,700
                </div>
                <div
                  className={`text-xs mb-2 transition-colors duration-300 ${
                    isDarkMode
                      ? "text-white opacity-60"
                      : "text-[#1E1E1E] opacity-60"
                  }`}
                >
                  /month
                </div>
                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">✨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      100,000 credits / month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">🔌</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Access to plugins, APIs, and Dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">🖼️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Process up to 125 hifi or 500 lofi assets
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">🛠️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Build Your Own (Localization) Model
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">🧑‍💻</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Dedicated technical support
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">🔋</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Top-up credits as you go
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#502D81] text-sm">💡</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Ideal for mid-tier marketing, creative, and localization
                      teams. Best value
                    </span>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-[#502D81] text-white font-semibold hover:bg-[#6C2F83] transition text-sm"
                  onClick={() => {
                    if (user) {
                      router.push("/demo");
                    } else {
                      setShowAuthModal(true);
                    }
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:border-[#3C38A4]/40 hover:shadow-xl hover:shadow-[#3C38A4]/20 ${
                isDarkMode
                  ? "bg-gradient-to-br from-[#3C38A4]/20 to-[#3C38A4]/20 border-[#3C38A4]/20"
                  : "bg-gradient-to-br from-[#3C38A4]/10 to-[#3C38A4]/10 border-[#3C38A4]/20"
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-[#3C38A4] mb-2">
                  Enterprise
                </h3>
                <div
                  className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-[#1E1E1E]"
                  }`}
                >
                  Talk to us
                </div>
                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">✨</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Unlimited credits per month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🔌</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Access to plugins, APIs, and Dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🖼️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Process unlimited hifi or lofi assets
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🛠️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Build Your Own (Localization) Model
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🎯</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Dedicated priority onboarding
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🧑‍💻</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Dedicated 24x7 technical support
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🔗</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      Support for TMS integrations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🗂️</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      DAM integrations & custom workflows
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#3C38A4] text-sm">🌍</span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-80"
                          : "text-[#1E1E1E] opacity-80"
                      }`}
                    >
                      For global teams localizing at scale
                    </span>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-[#3C38A4] text-white font-semibold hover:bg-[#181E53] transition text-sm"
                  onClick={() => {
                    const subject = encodeURIComponent(
                      "Enterprise Plan Inquiry - GoLoco"
                    );
                    const body = encodeURIComponent(
                      `Hello GoLoco Team,\n\nI am interested in learning more about your Enterprise plan and would like to discuss custom pricing and features for my organization.\n\nPlease contact me to schedule a call or provide more information.\n\nBest regards`
                    );
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
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
                      Plus Plan
                    </div>
                    <div
                      className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-white" : "text-[#1E1E1E]"
                      }`}
                    >
                      ₹6,700
                    </div>
                    <div
                    >
                      ₹6,700
                    </div>
                    <div
                      className={`text-sm transition-colors duration-300 ${
                        isDarkMode
                          ? "text-white opacity-70"
                          : "text-[#1E1E1E] opacity-70"
                      }`}
                    >
                      100,000 credits • Unlimited generations & edits
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
              ? "bg-gradient-to-br from-[#3C38A4]/10 to-[#181E53]/10 border-[#3C38A4]/20"
              : "bg-gradient-to-br from-[#3C38A4]/5 to-[#181E53]/5 border-[#3C38A4]/20"
          }`}
        >
          <div className="max-w-6xl mx-auto">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
              {/* Logo Section */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🎨</div>
                  <div className="text-3xl font-bold text-[#3C38A4]">
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
                  <h4 className="text-lg font-bold text-[#181E53] mb-3">
                    Product
                  </h4>
                  <div className="space-y-2">
                    <a
                      href="/about"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                      }`}
                    >
                      About GoLoco
                    </a>
                    <a
                      href="/features"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                      }`}
                    >
                      Feature
                    </a>
                    <a
                      href="/pricing"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                      }`}
                    >
                      Pricing
                    </a>
                  </div>
                </div>

                {/* Support Links */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-[#502D81] mb-3">
                    Support
                  </h4>
                  <div className="space-y-2">
                    <a
                      href="/faq"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                      }`}
                    >
                      FAQ
                    </a>
                    <a
                      href="/contact"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                      }`}
                    >
                      Contact Us
                    </a>
                    <a
                      href="/help"
                      className={`block text-sm transition ${
                        isDarkMode
                          ? "text-white opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                          : "text-[#1E1E1E] opacity-80 hover:opacity-100 hover:text-[#3C38A4]"
                      }`}
                    >
                      Help Center
                    </a>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-[#6C2F83] mb-3">
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
            <div className="border-t border-[#3C38A4]/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
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
                      ? "text-white opacity-70 hover:opacity-100 hover:text-[#3C38A4]"
                      : "text-[#1E1E1E] opacity-70 hover:opacity-100 hover:text-[#3C38A4]"
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
                      ? "text-white opacity-70 hover:opacity-100 hover:text-[#3C38A4]"
                      : "text-[#1E1E1E] opacity-70 hover:opacity-100 hover:text-[#3C38A4]"
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

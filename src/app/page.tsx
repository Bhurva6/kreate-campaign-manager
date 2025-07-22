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
    <div className="min-h-screen bg-[#111] flex flex-col relative overflow-x-hidden">
      {/* Logo Top Left and Auth Buttons Top Right */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} />
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition"
            onClick={() => window.location.href = "/signin"}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 transition"
            onClick={() => window.location.href = "/signup"}
          >
            Sign Up
          </button>
        </div>
      </div>
      {/* Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6 max-w-2xl">
          Turn Your Words Into Works of Art—And Edit Them Instantly.
        </h1>
        <p className="text-lg md:text-xl text-gray-300 text-center mb-10 max-w-xl">
          Juicebox lets you generate stunning images and edit them with just a
          sentence. No skills needed—just your imagination
        </p>
        <div className="flex gap-4 items-center">
          <button
            className="font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg"
            style={{
              background: "linear-gradient(90deg, #C6FF00 0%, #76FF03 100%)",
              color: "#111",
              boxShadow: "0 0 16px 2px #B2FF59, 0 2px 8px 0 #76FF03",
              textShadow: "0 0 8px #B2FF59",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 32px 8px #B2FF59, 0 4px 16px 0 #76FF03";
              e.currentTarget.style.textShadow = "0 0 16px #B2FF59";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 16px 2px #B2FF59, 0 2px 8px 0 #76FF03";
              e.currentTarget.style.textShadow = "0 0 8px #B2FF59";
            }}
            onClick={() => router.push("/home")}
          >
            Try it instantly
          </button>
          <button
            className="font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg bg-white/20 text-white border border-white/30 hover:bg-white/30 hover:border-white/50"
            onClick={() => router.push("/demo")}
          >
            Live Demo
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-400 text-center">
          Trusted by creators worldwide
        </div>
        {/* Floating Pulsating Circles */}
        <div
          className="w-full flex justify-center items-end relative z-20"
          style={{ minHeight: 100, marginBottom: 32 }}
        >
          <div className="flex flex-row gap-[-16px] md:gap-[-32px] justify-center items-end">
            {["/girl1.jpeg", "/girl2.jpeg", "/girl3.jpeg", "/girl4.jpeg"].map(
              (src, i) => (
                <div
                  key={src}
                  className={`relative rounded-full bg-white/10 shadow-lg mx-[-12px] animate-float${
                    i % 3
                  } animate-pulse${i % 2}`}
                  style={{
                    width: 56,
                    height: 56,
                    zIndex: 10 + i,
                    opacity: 0.7,
                    transition: "opacity 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  <img
                    src={src}
                    alt="Creator avatar"
                    className="rounded-full w-full h-full object-cover border-2 border-white/30"
                    draggable={false}
                    style={{ pointerEvents: "none" }}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Glassmorphism Tile at Bottom */}
      <div className="w-full flex justify-center mt-48 mb-20 px-0">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-lg w-full max-w-7xl mx-auto px-8 py-8 sm:px-16 sm:py-12 flex flex-row items-center gap-8 overflow-x-auto pointer-events-auto transition-all justify-center">
          {/* First Text */}
          <div className="flex flex-col items-center min-w-[220px] max-w-xs justify-center pl-8 sm:pl-16">
            <div className="text-white text-lg font-mono opacity-90 min-h-[2.5em] w-full break-words text-center">
              {typedText1}
              <span className="animate-blink">
                {typedText1.length < fullText1.length ? "|" : ""}
              </span>
            </div>
          </div>
          {/* Arrow 1 */}
          {showArrow1 && (
            <div className="animate-bounce text-3xl text-white">→</div>
          )}
          {/* Image 1 */}
          {showImage1 && (
            <div className="flex flex-col items-center min-w-[320px] max-w-lg justify-center px-4 sm:px-6">
              <img
                src="/bright-cereal.png"
                alt="Super Crunch Cereal"
                className="rounded-2xl shadow-lg w-full max-w-[320px] object-contain"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          )}
          {/* Arrow 2 */}
          {showImage1 && showArrow2 && (
            <div className="animate-bounce text-3xl text-white">→</div>
          )}
          {/* Second Text */}
          {showImage1 && (
            <div className="flex flex-col items-center min-w-[220px] max-w-xs justify-center">
              <div className="text-white text-lg font-mono opacity-90 min-h-[2.5em] w-full break-words text-center">
                {typedText2}
                <span className="animate-blink">
                  {typedText2.length < fullText2.length ? "|" : ""}
                </span>
              </div>
            </div>
          )}
          {/* Arrow 3 */}
          {showImage2 && (
            <div className="animate-bounce text-3xl text-white">→</div>
          )}
          {/* Image 2 */}
          {showImage2 && (
            <div className="flex flex-col items-center min-w-[320px] max-w-lg justify-center px-4 sm:px-6 pr-8 sm:pr-16">
              <img
                src="/blue-cereal.png"
                alt="Super Crunch Cereal Night"
                className="rounded-2xl shadow-lg w-full max-w-[320px] object-contain"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          )}
        </div>
      </div>
      {/* Feature Cards Section */}
      <div className="w-full flex flex-col items-center gap-12 pb-24 mt-56">
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
        <div className="flex flex-wrap gap-10 justify-center items-stretch w-full max-w-7xl px-4 mx-auto">
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
              className="flex flex-col md:flex-row items-stretch bg-white/10 rounded-3xl p-10 w-full max-w-3xl mx-auto shadow-lg transition-all duration-300 min-h-[320px] mb-12"
              style={{
                boxShadow: "0 0 32px 0 #B2FF59, 0 2px 12px 0 #76FF03",
              }}
            >
              {/* Text content */}
              <div className="flex-1 flex flex-col justify-center md:pr-8 mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {card.title}
                </h3>
                <div className="text-lime-300 font-semibold mb-4 text-lg">
                  {card.tagline}
                </div>
                <p className="text-gray-200 text-lg opacity-90">
                  {card.copy}
                </p>
              </div>
              {/* GIF/Video on the right, larger */}
              <div className="flex items-center justify-center w-full md:w-56 min-w-[12rem]">
                {card.gif.match(/\.(mp4|webm)$/i) ? (
                  <video
                    src={card.gif}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="rounded-xl shadow-md w-full h-auto object-contain bg-black/20 border border-white/10"
                    style={{ maxHeight: '220px' }}
                  />
                ) : (
                  <img
                    src={card.gif}
                    alt="Feature demo GIF"
                    className="rounded-xl shadow-md w-full h-auto object-contain bg-black/20 border border-white/10"
                    style={{ maxHeight: '220px' }}
                  />
                )}
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
            onClick={() => window.location.href = "/home"}
          >
            Get started
          </button>
        </div>
      </div>
      {/* How it works section */}
      <div className="w-full flex flex-col items-center mt-32 mb-32 px-4">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          How it works
        </h2>
        <div className="w-full flex flex-row items-center justify-center gap-8 min-h-[220px] mb-8 overflow-x-auto whitespace-nowrap">
          <div className="flex flex-col items-center w-full max-w-md">
            <img
              src="/labubuastro.jpeg"
              alt="Astronaut Labubu on Mars"
              className="rounded-2xl shadow-lg w-full max-w-md object-contain"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div className="text-white text-lg font-mono opacity-90 text-center mt-4">
              create an image of an astronaut labubu on mars
            </div>
          </div>
          <div className="flex flex-col items-center w-full max-w-md">
            <img
              src="/baker.jpeg"
              alt="Labubu is a baker"
              className="rounded-2xl shadow-lg w-full max-w-md object-contain"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div className="text-white text-lg font-mono opacity-90 text-center mt-4">
              now the labubu is a baker
            </div>
          </div>
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
/* .animate-blink { animation: blink 1s steps(2, start) infinite; }
@keyframes blink { to { visibility: hidden; } } */

/* Add to your global CSS:
@keyframes float0 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
@keyframes float1 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-20px);} }
@keyframes float2 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
.animate-float0 { animation: float0 3s ease-in-out infinite; }
.animate-float1 { animation: float1 4s ease-in-out infinite; }
.animate-float2 { animation: float2 2.5s ease-in-out infinite; }
.animate-pulse0 { animation: pulse 2.2s infinite alternate; }
.animate-pulse1 { animation: pulse 2.7s infinite alternate; }
@keyframes pulse { 0%{box-shadow:0 0 0 0 #B2FF59;} 100%{box-shadow:0 0 16px 8px #B2FF59;} }
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

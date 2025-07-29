"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Home() {
  const router = useRouter();

  const categories = [
    { 
      name: "Brand kit", 
      link: "/brand-kit",
      image: "/branding.png",
    },
    { 
      name: "Graphics", 
      link: "/graphics",
      image: "/graphics.png",
    },
    { 
      name: "Interior designing", 
      link: "/interior-designing",
      image: "/interior.png",
    },
    { 
      name: "Architecture", 
      link: "/architecture",
      image: "/architecture.png",
    },
    { 
      name: "Copy the ad", 
      link: "/copy-the-ad",
      image: "/advert.png",
    },
    { 
      name: "Make it better", 
      link: "/make-it-better",
      image: "/enhance.png",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#111] via-[#0f0f0f] to-[#1a1a1a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-lime-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-lime-400/5 via-transparent to-transparent rounded-full"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col items-center relative z-10 px-4">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-16 mt-8">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white hover:bg-white/20 hover:border-lime-400/30 transition-all duration-300 hover:scale-105"
          >
            <svg 
              className="w-5 h-5 text-lime-400 group-hover:text-lime-300 transition-colors duration-300 group-hover:-translate-x-1 transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium group-hover:text-lime-100 transition-colors duration-300">
              Back to Home
            </span>
          </button>
        </div>

        {/* Enhanced Title Section */}
        <div className="flex flex-col items-center mb-16 text-center">    
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-lime-400/10 border border-lime-400/20 rounded-full text-lime-300 text-sm font-medium backdrop-blur-sm">
              ✨ Creative Studio
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            What do you want to{' '}
            <span className="bg-gradient-to-r from-lime-400 to-lime-300 bg-clip-text text-transparent">
              create
            </span>{' '}
            today?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Choose from our powerful creative tools to bring your vision to life
          </p>
        </div>

        {/* Enhanced Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {categories.map((cat, index) => {
            const isBrandKit = cat.name === "Brand kit";
            return (
              <div
                key={cat.link}
                className="group relative backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/2 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center hover:border-lime-400/30 transition-all duration-500 cursor-pointer min-h-[200px] hover:scale-[1.02] hover:shadow-2xl hover:shadow-lime-400/10"
                onClick={() => router.push(cat.link)}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-transparent to-lime-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                
                {/* Beta badge */}
                {isBrandKit && (
                  <div className="absolute -top-3 -right-3 z-20">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      BETA
                    </span>
                  </div>
                )}
                
                {/* Enhanced Image Container */}
                <div className="relative w-32 h-32 mb-6 rounded-2xl overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover brightness-110 group-hover:brightness-125 transition-all duration-300"
                    sizes="128px"
                  />
                  {/* Enhanced Icon Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/40 flex items-center justify-center group-hover:bg-black/10 transition-colors duration-300">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">
                    </span>
                  </div>
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Enhanced Text */}
                <h3 className="text-white text-xl font-semibold text-center group-hover:text-lime-100 transition-colors duration-300 mb-2">
                  {cat.name}
                </h3>
                
                {/* Subtitle based on category */}
                <p className="text-gray-400 text-sm text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {cat.name === "Brand kit" && "Create consistent branding"}
                  {cat.name === "Graphics" && "Design stunning visuals"}
                  {cat.name === "Interior designing" && "Design beautiful spaces"}
                  {cat.name === "Architecture" && "Create architectural plans"}
                  {cat.name === "Copy the ad" && "Replicate advertisements"}
                  {cat.name === "Make it better" && "Enhance your content"}
                </p>

                {/* Arrow indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <svg className="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Relative positioning for z-index */}
                <div className="absolute inset-0 pointer-events-none z-10"></div>
              </div>
            );
          })}
        </div>

        {/* Additional CTA section */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Need help getting started? Check out our{' '}
            <span className="text-lime-400 hover:text-lime-300 cursor-pointer transition-colors">
              tutorials
            </span>{' '}
            or{' '}
            <span className="text-lime-400 hover:text-lime-300 cursor-pointer transition-colors">
              contact support
            </span>
          </p>
        </div>
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
        }
      `}</style>
      </div>
    </ProtectedRoute>
  );
}
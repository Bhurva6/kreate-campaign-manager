"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  const categories = [
    { 
      name: "Brand kit", 
      link: "/brand-kit",
      image: "/panache_green_logo.jpeg",
      icon: "🎨"
    },
    { 
      name: "Graphics", 
      link: "/graphics",
      image: "/ChatGpt-art-styleITG-1743494812804.avif",
      icon: "🖼️"
    },
    { 
      name: "Interior designing", 
      link: "/interior-designing",
      image: "/girl1.jpeg",
      icon: "🏠"
    },
    { 
      name: "Architecture", 
      link: "/architecture",
      image: "/image.png",
      icon: "🏗️"
    },
    { 
      name: "Copy the ad", 
      link: "/copy-the-ad",
      image: "/images.jpeg",
      icon: "📋"
    },
    { 
      name: "Make it better", 
      link: "/make-it-better",
      image: "/girl2.jpeg",
      icon: "⚡"
    },
  ];

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Title */}
        <div className="flex flex-col items-center mb-12">    
          <h1 className="text-4xl font-bold text-white mb-2 text-center">What do you want to create today?</h1>
        </div>

        {/* Category Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full justify-center lg:flex lg:flex-row lg:gap-12 lg:space-x-12 lg:space-y-0">
          {categories.map(cat => {
            const isBrandKit = cat.name === "Brand kit";
            return (
              <div
                key={cat.link}
                className="relative bg-[#181818] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border border-[#222] hover:bg-[#222] transition cursor-pointer min-w-[120px] group"
                onClick={() => router.push(cat.link)}
              >
                {isBrandKit && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10 select-none">BETA</span>
                )}
                
                {/* Image Container */}
                <div className="relative w-16 h-16 mb-4 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {/* Icon Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <span className="text-2xl">{cat.icon}</span>
                  </div>
                </div>
                
                <span className="text-white text-lg font-medium text-center">{cat.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
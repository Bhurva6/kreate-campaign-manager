"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PanacheGreensPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/demo")}
            className="text-white hover:text-lime-400 transition"
          >
            ← Back to Demo
          </button>
          <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} />
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition"
            onClick={() => router.push("/signin")}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 transition"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-8">
            Panache Greens Campaign Manager
          </h1>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="mb-8">
              <div className="inline-block bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
                Sustainable Building Materials
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Building a Greener Future
              </h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                Panache Greens is revolutionizing the construction industry with eco-friendly, 
                sustainable building materials that don&apos;t compromise on quality or aesthetics. 
                Our AI-powered visual campaigns showcase the beauty and sustainability of green construction.
              </p>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-lime-400 mb-2">150+</div>
                <div className="text-white font-semibold mb-1">Visual Assets Created</div>
                <div className="text-sm text-gray-400">Product showcases & campaigns</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-lime-400 mb-2">45%</div>
                <div className="text-white font-semibold mb-1">Engagement Increase</div>
                <div className="text-sm text-gray-400">Across social platforms</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-lime-400 mb-2">30%</div>
                <div className="text-white font-semibold mb-1">Lead Generation</div>
                <div className="text-sm text-gray-400">Qualified prospects boost</div>
              </div>
            </div>

            {/* Sample Campaign Images */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Sample Campaign Visuals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <img 
                    src="/panache-white-text-5/post_3+local+1753258357+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg" 
                    alt="Sustainable Building Materials Showcase"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-white font-semibold mb-2">Eco-Friendly Material Showcase</h4>
                  <p className="text-gray-400 text-sm">AI-generated visuals highlighting sustainable building materials in modern architectural settings.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <img 
                    src="/panache-white-text-5/post_3+local+1753258341+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg
                    " 
                    alt="Green Construction Process"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-white font-semibold mb-2">Green Construction Process</h4>
                  <p className="text-gray-400 text-sm">Visual storytelling of sustainable construction methods and environmental impact reduction.</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Campaign Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  <span>Sustainable material visualization</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  <span>Environmental impact showcases</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  <span>Product catalog generation</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  <span>Social media content automation</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  <span>Brand consistency across channels</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  <span>Real-time campaign optimization</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-300 hover:to-green-400 text-black font-semibold px-8 py-4 rounded-xl shadow-lg transition mr-4"
                onClick={() => router.push("/create-campaign")}
              >
               Create new campaign
              </button>
              <button
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition border border-white/20 hover:border-white/40"
                onClick={() => router.push("/demo")}
              >
                View posting schedule 
              </button>
            </div>
          </div>
        </div>
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

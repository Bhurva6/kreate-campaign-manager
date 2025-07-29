"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function EvolvPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
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
            Evolv Campaign Manager
          </h1>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="mb-8">
              <div className="inline-block bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
                Mobility & Logistics
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Electrifying the Future of Mobility
              </h2>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                Evolv is transforming the transportation industry with cutting-edge electric vehicle 
                fleet solutions and smart logistics technology. Our AI-powered visual campaigns 
                showcase the innovation and sustainability of electric mobility solutions.
              </p>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">200+</div>
                <div className="text-white font-semibold mb-1">Visual Assets Created</div>
                <div className="text-sm text-gray-400">Fleet showcases & campaigns</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">60%</div>
                <div className="text-white font-semibold mb-1">Engagement Increase</div>
                <div className="text-sm text-gray-400">Across digital platforms</div>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">40%</div>
                <div className="text-white font-semibold mb-1">Lead Generation</div>
                <div className="text-sm text-gray-400">Fleet inquiry boost</div>
              </div>
            </div>

            {/* Sample Campaign Images */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Sample Campaign Visuals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <img 
                    src="/evolv-black-text-1/evolv_1+local+1753433659+57feb920-d45a-466c-9006-a7eef2b2a107.jpg" 
                    alt="Electric Fleet Showcase"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-white font-semibold mb-2">Electric Fleet Solutions</h4>
                  <p className="text-gray-400 text-sm">AI-generated visuals showcasing modern electric vehicle fleets in urban and industrial settings.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <img 
                    src="/evolv-white-text-1/evolv_1+local+1753433925+dad57e39-1f6b-4f08-8308-251cf17def3d.jpg" 
                    alt="Smart Logistics Technology"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-white font-semibold mb-2">Smart Logistics Technology</h4>
                  <p className="text-gray-400 text-sm">Visual representation of intelligent fleet management and sustainable transportation solutions.</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">Campaign Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Electric vehicle visualization</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Fleet management showcases</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Sustainability impact visuals</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Smart technology demonstrations</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Brand consistency across channels</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Real-time campaign optimization</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg transition mr-4"
                onClick={() => router.push("/create-campaign?brand=evolv")}
              >
               Create new campaign
              </button>
              <button
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition border border-white/20 hover:border-white/40"
                onClick={() => router.push("/campaign-calendar?brand=evolv")}
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
    </ProtectedRoute>
  );
}

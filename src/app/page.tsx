import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <nav className="w-full flex items-center h-16 px-6 border-b border-white/10">
        <div className="flex items-center">
          {/* Replace '/next.svg' with your logo if needed */}
          <Image src="/next.svg" alt="Logo" width={40} height={40} className="dark:invert" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6 text-center">text to image</h1>
          <div className="relative w-full">
            <input
              type="text"
              placeholder="what banner do you want to create....."
              className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-5 pr-16 text-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-base font-semibold shadow transition"
              aria-label="Send"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

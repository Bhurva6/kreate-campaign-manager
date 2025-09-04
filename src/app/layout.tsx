import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GoLoco",
  description: "One Image. Endless Worlds. Remix reality at lightning speed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${ibmPlexMono.variable} antialiased font-mono`}
        suppressHydrationWarning={true}
      >
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}

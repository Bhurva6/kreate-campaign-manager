import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";

export const metadata: Metadata = {
  title: "GoLoco",
  description: "One Image. Endless Worlds. Remix reality at lightning speed.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GoLoco",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GoLoco" />
        <link rel="apple-touch-icon" href="/golocologo.png" />
        <link rel="icon" href="/goloco.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/goloco.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/goloco.png" />
      </head>
      <body
        className="antialiased font-mono"
        suppressHydrationWarning={true}
      >
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}

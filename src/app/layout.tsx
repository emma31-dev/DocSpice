import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocSpice - Transform Text into Beautiful Visual Stories",
  description: "Turn your plain text into stunning illustrated articles with AI-powered image matching. DocSpice analyzes your content and adds beautiful, relevant images from Unsplash.",
  keywords: ["text enhancement", "visual storytelling", "content creation", "AI", "images", "articles"],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  openGraph: {
    title: "DocSpice - Transform Text into Beautiful Visual Stories",
    description: "Turn your plain text into stunning illustrated articles with AI-powered image matching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

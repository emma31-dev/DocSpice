import type { Metadata, Viewport } from "next";
import { PT_Serif } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/components/JotaiProvider";
import Navigation from "@/components/Navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  themeColor: '#3B82F6',
};

export const metadata: Metadata = {
  title: "DocSpice - Transform Text into Beautiful Visual Stories",
  description: "Turn your plain text into stunning illustrated articles with AI-powered image matching. DocSpice analyzes your content and adds beautiful, relevant images from Unsplash.",
  keywords: ["text enhancement", "visual storytelling", "content creation", "AI", "images", "articles"],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',

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
        className={`${ptSerif.variable} antialiased`}
      >
        <ErrorBoundary>
          <JotaiProvider>
            <ToastProvider>
              <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50">
                <Navigation />
                <main>
                  {children}
                </main>
              </div>
            </ToastProvider>
          </JotaiProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
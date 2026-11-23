import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://motoplexbd.vercel.app"),
  title: "MOTOPLEX BD",
  description: "",
  openGraph: {
    title: "MOTOPLEX BD",
    description: "",
    url: "https://motoplexbd.vercel.app",
    siteName: "MOTOPLEX BD",
    images: [
      {
        url: "https://motoplexbd.vercel.app/og-image.jpg",
        width: 800,
        height: 600,
        alt: "MOTOPLEX BD Performance Division",
      },
    ],
    locale: "en_BD",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MOTOPLEX BD",
    description: "",
    images: ["https://motoplexbd.vercel.app/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "any" },
      { url: "/icon.jpg", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpg",
    apple: "/apple-icon.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-red-600 selection:text-white">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

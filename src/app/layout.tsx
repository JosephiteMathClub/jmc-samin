import { Caveat, Inter, JetBrains_Mono, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import { ToastProvider } from "@/context/ToastContext";
import ClientLayout from "@/components/ClientLayout";
import React from "react";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Josephite Math Club",
  description: "The official website of the Josephite Math Club",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${caveat.variable} ${cormorant.variable} antialiased bg-[#050505] text-zinc-100`}
      >
        <AuthProvider>
          <ToastProvider>
            <ContentProvider>
              <ClientLayout>{children}</ClientLayout>
            </ContentProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

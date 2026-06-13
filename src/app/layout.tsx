import { Caveat, Inter, JetBrains_Mono, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import { ToastProvider } from "@/context/ToastContext";
import { TechSupportProvider } from "@/context/TechSupportContext";
import ClientLayout from "@/components/ClientLayout";
import { SmoothScroll } from "@/components/SmoothScroll";
import React from "react";
import Script from "next/script";

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "Josephite Math Club | JMC Official",
  description: "The official website of the Josephite Math Club. Promoting excellence in mathematics through events, competitions, and research.",
  keywords: ["Math Club", "Josephite", "JMC", "Mathematics", "Competition", "Research"],
  authors: [{ name: "Josephite Math Club" }],
  openGraph: {
    title: "Josephite Math Club",
    description: "Promoting excellence in mathematics.",
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
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${caveat.variable} ${cormorant.variable} antialiased bg-[#050505] text-zinc-100`}
      >
        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                loader: {
                  load: ['[tex]/physics', '[tex]/mhchem']
                },
                tex: {
                  packages: {'[+]': ['physics', 'mhchem', 'ams', 'newcommand']},
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)'], ['\\(', '\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]'], ['\\[', '\\]']],
                  processEscapes: true,
                  macros: {
                    dd: '{\\\\mathrm{d}}',
                    dv: ['\\\\frac{\\\\mathrm{d}#1}{\\\\mathrm{d}#2}', 2],
                    diff: ['\\\\frac{\\\\mathrm{d}#1}{\\\\mathrm{d}#2}', 2],
                    pd: ['\\\\frac{\\\\partial #1}{\\\\partial #2}', 2],
                    pdv: ['\\\\frac{\\\\partial #1}{\\\\partial #2}', 2],
                    grad: '\\\\mathbf{\\\\nabla}',
                    div: '\\\\mathbf{\\\\nabla}\\\\cdot',
                    curl: '\\\\mathbf{\\\\nabla}\\\\times'
                  }
                },
                options: {
                  enableMenu: false
                }
              };
            `
          }}
        />
        <Script
          id="mathjax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <ToastProvider>
            <TechSupportProvider>
              <ContentProvider>
                <SmoothScroll>
                  <ClientLayout>{children}</ClientLayout>
                </SmoothScroll>
              </ContentProvider>
            </TechSupportProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

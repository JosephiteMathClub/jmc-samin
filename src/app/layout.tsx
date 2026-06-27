import { Caveat, Inter, JetBrains_Mono, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import { ToastProvider } from "@/context/ToastContext";
import { TechSupportProvider } from "@/context/TechSupportContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ClientLayout from "@/components/ClientLayout";
import { SmoothScroll } from "@/components/SmoothScroll";
import React from "react";
import Script from "next/script";
import type { Metadata } from "next";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://jmc-sjs.org"),
  title: {
    default: "Josephite Math Club | JMC Official",
    template: "%s | Josephite Math Club",
  },
  description: "The official platform of Josephite Math Club. Promoting analytical excellence, critical thinking, research, workshops, and mathematical olympiad spirit.",
  keywords: [
    "Josephite Math Club",
    "JMC Official",
    "St. Joseph School Dhaka Math Club",
    "Math Club Bangladesh",
    "Mathematics Olympiad",
    "Math Research St. Joseph",
    "Academic Club Dhaka",
    "Math Competitions Dhaka",
    "SJS Math",
    "Excellence in Mathematics",
  ],
  authors: [{ name: "Josephite Math Club", url: "https://jmc-sjs.org" }],
  creator: "Josephite Math Club Panel",
  publisher: "Josephite Math Club",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Josephite Math Club | JMC Official",
    description: "Discover the world where logic meets creativity. Official news, notices, challenge problems, and events of the Josephite Math Club, active since 2015.",
    url: "https://jmc-sjs.org",
    siteName: "Josephite Math Club",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Josephite Math Club Header Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Josephite Math Club | JMC Official",
    description: "Explore mathematics beyond textbook formulas. Challenge problems, workshops, events, and a vibrant community.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "9u84fdaJFeBCtbIt5KN2R8jLvL3oXe7O5stb5sWQMiE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://jmc-sjs.org/#website",
        "url": "https://jmc-sjs.org",
        "name": "Josephite Math Club",
        "alternateName": ["JMC", "SJS Math Club", "Josephite Mathematics Club", "Josephite Math Club Official"],
        "description": "The official digital platform of Josephite Math Club (JMC). Access challenge problems, news and notices, workshops, mathematics olympiad registration, and research articles.",
        "publisher": {
          "@id": "https://jmc-sjs.org/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://jmc-sjs.org/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "EducationalOrganization",
        "@id": "https://jmc-sjs.org/#organization",
        "name": "Josephite Math Club",
        "alternateName": "JMC",
        "url": "https://jmc-sjs.org",
        "logo": "https://jmc-sjs.org/images/logo.png",
        "description": "The official website of the Josephite Math Club. Promoting excellence in mathematics through workshops, math olympiads, research, and publications.",
        "foundingDate": "2015",
        "location": {
          "@type": "Place",
          "name": "St. Joseph Higher Secondary School",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Asad Avenue",
            "addressRegion": "Dhaka",
            "postalCode": "1207",
            "addressCountry": "Bangladesh"
          }
        },
        "sameAs": [
          "https://www.facebook.com/josephitemathclub",
          "https://jmc-sjs.org"
        ]
      },
      {
        "@type": "ItemList",
        "@id": "https://jmc-sjs.org/#sitelinks",
        "name": "Josephite Math Club Sitelinks Navigation List",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "About Josephite Math Club",
            "description": "Explore the history, constitution, executive panel, founder notes, and active moderator details of JMC since 2015.",
            "url": "https://jmc-sjs.org/about"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Club notices and Announcements",
            "description": "Stay updated with the latest academic announcements, results declarations, schedule adjustments, and club notices.",
            "url": "https://jmc-sjs.org/notices"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "Events, Festivals and Olympiads",
            "description": "View details of regional and national math festivals, workshops, math workshops, and online/offline olympiad registrations.",
            "url": "https://jmc-sjs.org/events"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Olympiad Challenge Problems",
            "description": "Engage with high-quality, monthly-updated, olympiad-grade math challenges and ascend our competitive leaderboard.",
            "url": "https://jmc-sjs.org/challenge-problems"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 5,
            "name": "Mathematical Research and Articles",
            "description": "Publish and read analytical papers, engaging calculus write-ups, combinatorics breakdowns, and articles generated by Josephites.",
            "url": "https://jmc-sjs.org/articles"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 6,
            "name": "Web Developers and Credits",
            "description": "Learn about the technical development, structural optimization, and engine behind the official JMC web workspace portal.",
            "url": "https://jmc-sjs.org/developers"
          }
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${caveat.variable} ${cormorant.variable} antialiased bg-[#050505] text-zinc-100`}
      >
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}

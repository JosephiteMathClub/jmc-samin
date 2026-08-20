import DevelopersView from "@/views/Developers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Main Developer & Platform Architects | Josephite Math Club",
  description: "Meet Samin Tausif, the main developer and chief architect of the official Josephite Math Club digital platform, and the engineering contributors.",
  keywords: [
    "Samin Tausif",
    "Main Developer Josephite Math Club",
    "Chief Architect JMC",
    "Josephite Math Club Developers",
    "Staff Web Engineers SJS",
    "Tawhid Bin Omar",
    "Sharan Haque Shakin",
    "Sanjid Kabir",
    "JMC Web Platform Credits",
  ],
  alternates: {
    canonical: "/developers",
  },
  openGraph: {
    title: "Samin Tausif - Main Developer & Chief Architect | Josephite Math Club",
    description: "Explore the features, systems, and architectural contributions engineered by Samin Tausif for the official JMC platform.",
    url: "https://jmc-sjs.org/developers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Samin Tausif - Main Developer & Chief Architect",
    description: "The main developer and architectural visionary behind the official Josephite Math Club web application.",
  },
};

export default function DevelopersPage() {
  const developersJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/developers#webpage",
        "url": "https://jmc-sjs.org/developers",
        "name": "Samin Tausif - Main Developer & Platform Architects",
        "description": "Samin Tausif, the main developer and chief platform architect of the official Josephite Math Club digital ecosystem.",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/developers#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/developers#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://jmc-sjs.org"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Developers",
            "item": "https://jmc-sjs.org/developers"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(developersJsonLd) }}
      />
      <DevelopersView />
    </>
  );
}

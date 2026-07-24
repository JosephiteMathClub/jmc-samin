import DevelopersView from "@/views/Developers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web Platform Architects & Engineers",
  description: "Meet the student architects, full-stack engineers, design specialists, and technical minds who designed and developed the official Josephite Math Club digital platform.",
  keywords: [
    "Josephite Math Club Developers",
    "Staff Web Engineers SJS",
    "Samin Tausif",
    "Tawhid Bin Omar",
    "Sharan Haque Shakin",
    "Sanjid Kabir",
    "JMC Web Platform Credits",
  ],
  alternates: {
    canonical: "/developers",
  },
  openGraph: {
    title: "Web Platform Architects & Engineers | Josephite Math Club",
    description: "Meet the engineering minds and designers behind the official SJS Math Club web application, built with high-performance modern tech stacks.",
    url: "https://jmc-sjs.org/developers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Official JMC Web Platform Architects",
    description: "Meet the full-stack student developers and designers who brought the Josephite Math Club workspace to life.",
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
        "name": "Web Platform Architects & Engineers",
        "description": "The technical development, optimization credits, and engine architecture of the official JMC web platform.",
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

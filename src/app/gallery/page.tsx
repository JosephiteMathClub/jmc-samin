import { GalleryView } from "@/views/Gallery";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Photo Gallery & Memories",
  description: "Experience the rich visual history, award ceremonies, interactive math matches, and beautiful memories of Josephite Math Club workshops and festivals.",
  keywords: [
    "JMC Photo Gallery",
    "St. Joseph Math Club Memories",
    "Josephite Math Festival Photos",
    "Academic Club Gallery Dhaka",
    "Math Workshop Pictures BD",
  ],
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Interactive Photo Gallery & Memories | Josephite Math Club",
    description: "Browse photographs from regional tournaments, national math festivals, intensive workshops, and milestone celebrations of JMC.",
    url: "https://jmc-sjs.org/gallery",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Josephite Math Club Gallery",
    description: "Take a visual journey through SJS Math Club activities, national festivals, workshops, and ceremony moments.",
  },
};

export default function GalleryPage() {
  const galleryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/gallery#webpage",
        "url": "https://jmc-sjs.org/gallery",
        "name": "Interactive Photo Gallery & Memories",
        "description": "A curated visual documentation of workshops, national festivals, math matches, and community sessions hosted by Josephite Math Club.",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/gallery#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/gallery#breadcrumb",
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
            "name": "Gallery",
            "item": "https://jmc-sjs.org/gallery"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryJsonLd) }}
      />
      <GalleryView />
    </>
  );
}


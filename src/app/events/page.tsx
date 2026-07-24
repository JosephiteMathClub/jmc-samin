import Events from "@/views/Events";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Math Festivals, Olympiads & Workshops",
  description: "Join upcoming math workshops, national math festivals, monthly competitions, and analytical events organized by Josephite Math Club.",
  keywords: [
    "Math Olympiad Bangladesh",
    "Josephite Math Club Events",
    "National Josephite Math Festival",
    "Math Competitions Dhaka",
    "High School Math Workshops",
    "SJS Math Olympiad Registration",
  ],
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "Math Festivals, Olympiads & Workshops | Josephite Math Club",
    description: "Access upcoming mathematical events, national olympiad announcements, workshops, and school festivals organized by JMC SJS.",
    url: "https://jmc-sjs.org/events",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Math Festivals & Olympiads",
    description: "Get details on workshops, competitions, and national mathematical festivals organized by Josephite Math Club.",
  },
};

export default function Page() {
  const eventsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/events#webpage",
        "url": "https://jmc-sjs.org/events",
        "name": "Math Festivals, Olympiads & Workshops",
        "description": "Information and registration portal for mathematical workshops, regional olympiads, and national math festivals at St. Joseph.",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/events#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/events#breadcrumb",
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
            "name": "Events & Festivals",
            "item": "https://jmc-sjs.org/events"
          }
        ]
      },
      {
        "@type": "EventSeries",
        "name": "National Josephite Math Festival",
        "description": "The flagship annual mathematics festival organized by the Josephite Math Club, featuring olympiads, project displays, and puzzle hunts.",
        "organizer": {
          "@id": "https://jmc-sjs.org/#organization"
        },
        "location": {
          "@type": "Place",
          "name": "St. Joseph Higher Secondary School campus",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Asad Avenue",
            "addressRegion": "Dhaka",
            "postalCode": "1207",
            "addressCountry": "Bangladesh"
          }
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
      />
      <Events />
    </>
  );
}


import About from "@/views/About";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About JMC - History & Executive Panel",
  description: "Learn about the mission, founding history, organizational structure, and executive committee of the Josephite Math Club (EST. 2015).",
  keywords: [
    "About Josephite Math Club",
    "JMC SJS Dhaka History",
    "Josephite Math Club Executive Committee",
    "JMC Moderators and Founder",
    "St. Joseph School Dhaka Clubs",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About JMC - History & Executive Panel | Josephite Math Club",
    description: "Discover the founding history, constitution, active moderators, and executive committee of the Josephite Math Club since 2015.",
    url: "https://jmc-sjs.org/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Josephite Math Club",
    description: "Learn about our founding history, constitution, active moderators, and executive committee since 2015.",
  },
};

export default function Page() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/about#webpage",
        "url": "https://jmc-sjs.org/about",
        "name": "About Josephite Math Club - History & Panel",
        "description": "Learn about the mission, founding history, constitution, and executive committee of the Josephite Math Club (EST. 2015).",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/about#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/about#breadcrumb",
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
            "name": "About Us",
            "item": "https://jmc-sjs.org/about"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <About />
    </>
  );
}


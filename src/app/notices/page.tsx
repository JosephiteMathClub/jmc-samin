import Notices from "@/views/Notices";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Announcements & Club Notices",
  description: "Read official circulars, notice boards, schedule updates, result publications, and syllabus declarations of the Josephite Math Club.",
  keywords: [
    "JMC Notices",
    "Math Club Circulars Dhaka",
    "Olympiad Syllabus BD",
    "Math Club Announcements",
    "Josephite Results Publications",
  ],
  alternates: {
    canonical: "/notices",
  },
  openGraph: {
    title: "Official Announcements & Club Notices | Josephite Math Club",
    description: "Stay informed with official circulars, event schedule updates, olympiad results, and math club notifications.",
    url: "https://jmc-sjs.org/notices",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Notices - Josephite Math Club",
    description: "Access official results, syllabus guidelines, and schedule announcements from Josephite Math Club.",
  },
};

export default function Page() {
  const noticesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/notices#webpage",
        "url": "https://jmc-sjs.org/notices",
        "name": "Official Announcements & Club Notices",
        "description": "The central board for official circulars, schedules, results, and curriculum syllabi for Josephite Math Club activities.",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/notices#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/notices#breadcrumb",
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
            "name": "Notices",
            "item": "https://jmc-sjs.org/notices"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(noticesJsonLd) }}
      />
      <Notices />
    </>
  );
}


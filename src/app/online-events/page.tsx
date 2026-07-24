import OnlineEvents from "@/views/OnlineEvents";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Olympiad & Online Math Events",
  description: "Participate in online quizzes, weekly math challenges, live virtual olympiads, and puzzle contests on our interactive online portal.",
  keywords: [
    "Virtual Math Olympiad Bangladesh",
    "Online Math Quizzes Dhaka",
    "Weekly Math Competitions SJS",
    "Interactive Math Portal BD",
    "Josephite Online Events",
  ],
  alternates: {
    canonical: "/online-events",
  },
  openGraph: {
    title: "Virtual Olympiad & Online Math Events | Josephite Math Club",
    description: "Compete globally and locally in online quizzes, weekly analytical brain teasers, live virtual olympiads, and math puzzles.",
    url: "https://jmc-sjs.org/online-events",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Olympiad Portal",
    description: "Unleash your logical skills with interactive quizzes, live events, and challenge problems online.",
  },
};

export default function Page() {
  const onlineEventsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/online-events#webpage",
        "url": "https://jmc-sjs.org/online-events",
        "name": "Virtual Olympiad & Online Math Events",
        "description": "Interactive online portal of the Josephite Math Club for live quizzes, weekly academic competitions, and virtual olympiads.",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/online-events#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/online-events#breadcrumb",
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
            "name": "Online Events",
            "item": "https://jmc-sjs.org/online-events"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(onlineEventsJsonLd) }}
      />
      <OnlineEvents />
    </>
  );
}

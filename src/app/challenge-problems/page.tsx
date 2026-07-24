import ChallengeProblems from "@/views/ChallengeProblems";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Olympiad Challenge Problems & Leaderboard",
  description: "Put your math skills to the test! Work on our hand-selected mathematical challenge problems, view the real-time student leaderboard, and submit your elegant proofs.",
  keywords: [
    "Math Olympiad Problems",
    "High School Math Challenges",
    "Math Brain Teasers Dhaka",
    "Math Leaderboard Bangladesh",
    "Mathematical Proofs St. Joseph",
    "Weekly Math Competitions",
  ],
  alternates: {
    canonical: "/challenge-problems",
  },
  openGraph: {
    title: "Olympiad Challenge Problems & Leaderboard | Josephite Math Club",
    description: "Train with monthly olympiad-grade math challenges, submit your analytic proofs, and ascend the real-time JMC leaderboard.",
    url: "https://jmc-sjs.org/challenge-problems",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Olympiad Challenge Problems & Leaderboard",
    description: "Engage with custom olympiad mathematical tasks, submit proofs, and see the highest ranks on our real-time leaderboard.",
  },
};

export default function Page() {
  const challengeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://jmc-sjs.org/challenge-problems#webpage",
        "url": "https://jmc-sjs.org/challenge-problems",
        "name": "Olympiad Challenge Problems & Leaderboard",
        "description": "Custom high school mathematical challenge tasks, proof submission board, and real-time competitive leaderboard.",
        "isPartOf": {
          "@id": "https://jmc-sjs.org/#website"
        },
        "breadcrumb": {
          "@id": "https://jmc-sjs.org/challenge-problems#breadcrumb"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://jmc-sjs.org/challenge-problems#breadcrumb",
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
            "name": "Challenge Problems",
            "item": "https://jmc-sjs.org/challenge-problems"
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(challengeJsonLd) }}
      />
      <ChallengeProblems />
    </>
  );
}


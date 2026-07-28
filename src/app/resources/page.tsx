import ResourcesView from "@/views/Resources";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mathematical Resources, Web Apps & Magic Square Library",
  description: "Explore curated interactive web applications, predicate logic trainers, magic square matrix research, video lectures, and downloadable Olympiad PDFs — sorted by category with explicit learning outcomes.",
  keywords: [
    "Math Resources",
    "Discover Math Play",
    "Know Math Symbols",
    "Magic Squares",
    "3x3 Magic Square Proof",
    "Ramanujan Birthday Magic Square",
    "Josephite Math Club Resources",
    "Olympiad Math PDFs",
    "Combinatorics Guides",
    "Linear Algebra Magic Matrices",
  ],
  alternates: {
    canonical: "/resources",
  },
  openGraph: {
    title: "Mathematical Resources & Interactive Learning Library | JMC",
    description: "Browse interactive math apps, logic checkers, magic square proofs, video lectures, and PDF preparation guides categorized with clear learning takeaways.",
    type: "website",
  },
};

export default function ResourcesPage() {
  return <ResourcesView />;
}

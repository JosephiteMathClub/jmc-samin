import ArticlesView from "@/views/Articles";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mathematical Articles & Publications",
  description: "Browse academic publications, student-written logs, math theories, historical breakthroughs, and olympiad guidelines published by local members.",
  keywords: ["Math Articles BD", "Josephite Publications", "JMC Journal", "Olympiad Preps", "High School Mathematics Essays"],
};

export default function ArticlesPage() {
  return <ArticlesView />;
}


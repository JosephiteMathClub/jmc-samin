import Events from "@/views/Events";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Festivals",
  description: "Join upcoming math workshops, national math festivals, monthly competitions, and analytical events organized by Josephite Math Club.",
  keywords: ["Math Olympiad Bangladesh", "JMC Events", "National Math Festival", "Math Competitions Dhaka", "Josephite Workshops"],
};

export default function Page() {
  return <Events />;
}


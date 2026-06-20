import About from "@/views/About";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission, founding history, structure, and executive committee of the Josephite Math Club (EST. 2015).",
  keywords: ["About JMC", "Josephite Math Club Executive Committee", "JMC Moderators", "JMC History", "St. Joseph Dhaka"],
};

export default function Page() {
  return <About />;
}


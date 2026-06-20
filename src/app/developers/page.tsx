import DevelopersView from "@/views/Developers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Architects",
  description: "Meet the student architects, full-stack engineers, design specialists, and technical minds who designed and developed the official Josephite Math Club platform.",
  keywords: ["JMC Developers", "Staff Web Engineers SJS", "Samin Tausif", "Tawhid Bin Omar", "Sharan Haque Shakin", "Sanjid Kabir"],
};

export default function DevelopersPage() {
  return <DevelopersView />;
}

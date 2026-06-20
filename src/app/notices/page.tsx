import Notices from "@/views/Notices";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Announcements",
  description: "Read official circulars, notice boards, schedule updates, result publications, and circular boards of the Josephite Math Club.",
  keywords: ["JMC Notices", "Math Club Circulars", "Olympiad Syllabus", "Math Club Announcements Dhaka", "Josephite Notices"],
};

export default function Page() {
  return <Notices />;
}


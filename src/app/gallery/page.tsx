import { GalleryView } from "@/views/Gallery";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Photo Gallery",
  description: "Experience the history and beautiful memories of Josephite Math Club workshops, award ceremonies, and interactive math festival matches.",
  keywords: ["JMC Gallery", "Math Club Photos", "St. Joseph Festivals", "Educational Match Dhaka Gallery", "Josephite Math Club Memories"],
  robots: {
    index: false,
    follow: true,
  },
};

export default function GalleryPage() {
  return <GalleryView />;
}


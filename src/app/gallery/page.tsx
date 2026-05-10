import { GalleryView } from "@/views/Gallery";
import { metadata as layoutMetadata } from "../layout";

export const metadata = {
  ...layoutMetadata,
  title: "Gallery | Josephite Math Club",
  description: "Experience the legacy of JMC through our immersive interactive 3D gallery.",
};

export default function GalleryPage() {
  return <GalleryView />;
}

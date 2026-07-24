import Profile from "@/views/Profile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Member Profile",
  description: "View and edit your Josephite Math Club profile details, track stats, and configure account preferences.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <Profile />;
}

import Panel from "@/views/Panel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Dashboard Panel",
  description: "Access your member workspace, register for events, see validation details, and manage your student club features.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <Panel />;
}

import Contact from "@/views/Contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Josephite Math Club. Submit support inquiries, ask about membership registration, math contest criteria, or partnership ideas.",
  keywords: ["JMC Contact Details", "St. Joseph Dhaka School Office", "Math Club Email Address", "JMC Support Hours"],
};

export default function Page() {
  return <Contact />;
}


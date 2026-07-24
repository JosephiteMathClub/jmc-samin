import RegisterMember from "@/views/RegisterMember";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register SJS Member",
  description: "Register as a member of the Josephite Math Club. Complete your school verification and join the elite mathematical community.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <RegisterMember />;
}

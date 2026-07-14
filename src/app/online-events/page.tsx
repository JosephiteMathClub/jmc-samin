import OnlineEvents from "@/views/OnlineEvents";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Events - Josephite Math Club",
  description: "Participate in online quizzes, weekly math challenges, live events, and more on our virtual olympiad portal.",
};

export default function Page() {
  return <OnlineEvents />;
}

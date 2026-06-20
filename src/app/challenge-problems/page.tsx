import ChallengeProblems from "@/views/ChallengeProblems";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Challenge Problems",
  description: "Put your math skills to the test! Work on our hand-selected mathematical challenge problems, view the leaderboard, and submit your elegant proofs.",
  keywords: ["Math Olympiad Problems", "Math Brain Teasers", "Math Leaderboard Dhaka", "Mathematical Proofs SJS", "Weekly Math Challenges"],
};

export default function Page() {
  return <ChallengeProblems />;
}


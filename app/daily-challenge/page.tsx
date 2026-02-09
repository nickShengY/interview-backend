import type { Metadata } from "next"
import DailyChallengeClient from "./daily-challenge-client"

export const metadata: Metadata = {
  title: "Daily Interview Challenge | Interview Pro",
  description: "Practice one interview question every day. Build a streak, earn credits, and sharpen your interview skills with daily AI-generated challenges.",
  keywords: ["daily interview question", "interview practice daily", "interview streak", "daily coding challenge"],
  openGraph: {
    title: "Daily Interview Challenge | Interview Pro",
    description: "One question a day keeps rejection away. Build your interview streak!",
    url: "https://interview-pro.ai/daily-challenge",
  },
  alternates: {
    canonical: "/daily-challenge",
  }
}

export default function Page() {
  return <DailyChallengeClient />
}

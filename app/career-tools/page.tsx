import type { Metadata } from "next"
import CareerToolsClient from "./career-tools-client"

export const metadata: Metadata = {
  title: "AI Career Toolkit | Interview Pro",
  description: "Complete career toolkit with STAR Story Bank, Elevator Pitch Generator, Networking Email Templates, Offer Comparison Tool, Interview Day Checklist, and Company Research Assistant.",
  keywords: ["career tools", "STAR method", "elevator pitch", "networking emails", "job offer comparison", "interview checklist", "company research"],
  openGraph: {
    title: "AI Career Toolkit | Interview Pro",
    description: "All-in-one career toolkit for job seekers. STAR stories, elevator pitches, networking emails, and more.",
    url: "https://interview-pro.ai/career-tools",
  },
  alternates: {
    canonical: "/career-tools",
  }
}

export default function Page() {
  return <CareerToolsClient />
}

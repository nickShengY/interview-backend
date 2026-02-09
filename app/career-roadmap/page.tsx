import type { Metadata } from "next"
import CareerRoadmapClient from "./career-roadmap-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "AI Career Roadmap Planner | Interview Pro",
  description: "Plan your career transition with AI-powered roadmaps, skill gap analysis, certification recommendations, and salary progression forecasts.",
  keywords: ["career roadmap", "career planner", "skill gap analysis", "career transition", "career path planning"],
  openGraph: {
    title: "AI Career Roadmap Planner | Interview Pro",
    description: "Plan your career transition with AI-powered roadmaps and skill gap analysis.",
    url: "https://interview-pro.ai/career-roadmap",
  },
  alternates: {
    canonical: "/career-roadmap",
  }
}

const faqs = [
  {
    question: "How personalized is the career roadmap?",
    answer: "Very personalized. We analyze your current role, skills, experience level, and target role to create a phased plan with specific resources, projects, and milestones tailored to your unique career transition."
  },
  {
    question: "Does it include actual course recommendations?",
    answer: "Yes! The AI recommends specific courses, platforms, certifications, and projects based on your skill gaps. It includes resources from platforms like Coursera, Udemy, and official certification providers."
  },
  {
    question: "How realistic are the salary projections?",
    answer: "Salary projections are based on market data for your target role and location. They represent typical ranges and should be used as a general guide alongside your own research on sites like Glassdoor and Levels.fyi."
  },
]

export default function Page() {
  return (
    <>
      <CareerRoadmapClient />
      <FAQSection items={faqs} title="Career Roadmap FAQs" description="Common questions about career planning" className="mt-12" />
    </>
  )
}

import type { Metadata } from "next"
import SalaryNegotiationClient from "./salary-negotiation-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "AI Salary Negotiation Coach | Interview Pro",
  description: "Get AI-powered salary negotiation scripts, market data, counter-offer strategies, and expert coaching to maximize your compensation package.",
  keywords: ["salary negotiation", "compensation negotiation", "salary coach", "counter offer strategy", "job offer negotiation"],
  openGraph: {
    title: "AI Salary Negotiation Coach | Interview Pro",
    description: "Maximize your compensation with AI-powered negotiation scripts and market data.",
    url: "https://interview-pro.ai/salary-negotiation",
  },
  alternates: {
    canonical: "/salary-negotiation",
  }
}

const faqs = [
  {
    question: "How accurate is the salary data?",
    answer: "Our AI provides estimated salary ranges based on widely available market data for your specific role, industry, and location. While not a substitute for sites like Glassdoor or Levels.fyi, it gives you a solid starting framework for negotiations."
  },
  {
    question: "Can I practice negotiation scenarios?",
    answer: "Yes! We provide multiple negotiation scripts for different scenarios including initial offers, counter-offers, and competing offers. You can practice these scripts and adapt them to your situation."
  },
  {
    question: "What if I've never negotiated before?",
    answer: "Our tool is designed for all experience levels. We provide step-by-step timelines, common mistakes to avoid, and ready-to-use scripts that even first-time negotiators can use with confidence."
  },
]

export default function Page() {
  return (
    <>
      <SalaryNegotiationClient />
      <FAQSection items={faqs} title="Salary Negotiation FAQs" description="Common questions about negotiating your compensation" className="mt-12" />
    </>
  )
}

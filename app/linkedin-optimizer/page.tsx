import type { Metadata } from "next"
import LinkedInOptimizerClient from "./linkedin-optimizer-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "AI LinkedIn Profile Optimizer | Interview Pro",
  description: "Optimize your LinkedIn profile with AI-powered analysis. Get headline suggestions, keyword optimization, and content strategy for maximum visibility.",
  keywords: ["LinkedIn optimizer", "LinkedIn profile review", "LinkedIn headline", "personal branding", "LinkedIn keywords"],
  openGraph: {
    title: "AI LinkedIn Profile Optimizer | Interview Pro",
    description: "Boost your LinkedIn visibility with AI-powered profile optimization.",
    url: "https://interview-pro.ai/linkedin-optimizer",
  },
  alternates: {
    canonical: "/linkedin-optimizer",
  }
}

const faqs = [
  {
    question: "How does the LinkedIn optimizer work?",
    answer: "Paste your current LinkedIn headline, summary, and experience. Our AI analyzes keyword density, readability, personal branding strength, and provides an optimized version with actionable recommendations."
  },
  {
    question: "Will it help me get more recruiter views?",
    answer: "Yes! Our optimizer focuses on the keywords recruiters search for, headline impact, and summary engagement. Users typically see a 40-60% increase in profile views after implementing our suggestions."
  },
  {
    question: "Is my LinkedIn data stored?",
    answer: "No. We do not store your LinkedIn profile data. All analysis is done in real-time and results are only shown to you during your session."
  },
]

export default function Page() {
  return (
    <>
      <LinkedInOptimizerClient />
      <FAQSection items={faqs} title="LinkedIn Optimizer FAQs" description="Common questions about LinkedIn profile optimization" className="mt-12" />
    </>
  )
}

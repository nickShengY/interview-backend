import type { Metadata } from "next"
import TechnicalInterviewClient from "./technical-interview-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "Technical Interview Practice | AI Mock Coding Interviews",
  description: "Practice technical interview questions for software engineering, data science, and product management. Get real-time AI feedback on your answers.",
  keywords: ["technical interview prep", "mock coding interview", "software engineer interview", "system design questions", "AI coding practice", "technical questions"],
  openGraph: {
    title: "Technical Interview Practice | AI Mock Coding Interviews",
    description: "Master technical interviews with industry-specific questions and AI feedback.",
    url: "https://interview-pro.ai/technical-interview",
  },
  alternates: {
    canonical: "/technical-interview",
  }
}

const faqs = [
  {
    question: "What programming languages are supported?",
    answer: "Our AI evaluates logic and concepts, so you can answer in any major language like Python, JavaScript, Java, C++, Go, or even pseudocode. We focus on your problem-solving approach and algorithmic thinking."
  },
  {
    question: "What roles are covered?",
    answer: "We cover over 50 specific roles including Frontend Engineer (React, Vue), Backend Engineer (Node, Django, Spring), Data Scientist (ML, SQL), DevOps, Product Manager, and more."
  },
  {
    question: "How is the feedback generated?",
    answer: "Our AI analyzes your response for correctness, efficiency (Big O notation), and clarity. It highlights edge cases you might have missed and suggests cleaner, more idiomatic implementation patterns."
  },
  {
    question: "Can I practice System Design?",
    answer: "Yes. You can select 'System Design' as a focus area to get questions about scalability, database choices, load balancing, and API design, suitable for Senior and Staff level roles."
  }
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Technical Interview Preparation",
  "description": "Interactive technical interview practice with AI feedback for software engineers and tech professionals.",
  "provider": {
    "@type": "Organization",
    "name": "Interview Pro"
  }
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(f => ({
    "@type": "Question",
    "name": f.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": f.answer
    }
  }))
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <TechnicalInterviewClient />
      <FAQSection items={faqs} title="Technical Interview FAQs" description="Common questions about coding & system design practice" className="mt-12" />
    </>
  )
}

import type { Metadata } from "next"
import BehavioralInterviewClient from "./behavioral-interview-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "Behavioral Interview Prep | STAR Method & Voice Practice",
  description: "Master behavioral interview questions using the STAR method. Practice speaking your answers with voice analysis and MBTI-personalized questions.",
  keywords: ["behavioral interview questions", "STAR method practice", "soft skills interview", "voice interview practice", "culture fit interview"],
  openGraph: {
    title: "Behavioral Interview Prep | STAR Method & Voice Practice",
    description: "Practice behavioral questions personalized to your profile. Includes breathing exercises and voice analysis.",
    url: "https://interview-pro.ai/behavioral-interview",
  },
  alternates: {
    canonical: "/behavioral-interview",
  }
}

const faqs = [
  {
    question: "How does the STAR method work?",
    answer: "STAR stands for Situation, Task, Action, and Result. It's the industry-standard framework for answering behavioral questions. Our AI guides you to structure your stories ensuring you cover the context (Situation/Task), what you specifically did (Action), and the positive outcome (Result)."
  },
  {
    question: "Is my voice recording stored?",
    answer: "No, voice processing happens in real-time or is transiently processed to generate the transcript and feedback. We do not permanently store your voice recordings."
  },
  {
    question: "How does MBTI personalization work?",
    answer: "If you provide your MBTI type in your profile, we tailor questions to challenge your natural tendencies. For example, if you are an Introvert, we might ask more about team collaboration and vocal leadership to help you prepare for those discussions."
  },
  {
    question: "Can I use this for non-tech roles?",
    answer: "Absolutely. Behavioral questions are universal. Whether you're in marketing, sales, finance, or operations, demonstrating leadership, conflict resolution, and adaptability is key."
  }
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Behavioral Interview Coaching",
  "description": "AI-guided behavioral interview practice focusing on the STAR method and communication skills.",
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
      <BehavioralInterviewClient />
      <FAQSection items={faqs} title="Behavioral Interview FAQs" description="Common questions about soft skills & STAR method" className="mt-12" />
    </>
  )
}

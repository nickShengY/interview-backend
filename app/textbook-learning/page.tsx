import type { Metadata } from "next"
import TextbookLearningClient from "./textbook-learning-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "AI Textbook Learning & Flashcards | Active Recall Study Tool",
  description: "Upload any textbook and let AI generate study plans, flashcards, and quizzes. Master new fields in weeks with spaced repetition and Feynman technique.",
  keywords: ["AI study tool", "textbook to flashcards", "PDF summarizer", "spaced repetition app", "active recall", "Feynman technique", "exam prep"],
  openGraph: {
    title: "AI Textbook Learning | Turn PDFs into Flashcards & Quizzes",
    description: "Accelerate your learning with AI. Upload textbooks to generate flashcards, quizzes, and personalized study schedules.",
    url: "https://interview-pro.ai/textbook-learning",
  },
  alternates: {
    canonical: "/textbook-learning",
  }
}

const faqs = [
  {
    question: "What types of files can I upload?",
    answer: "You can upload PDF documents and TXT files. We recommend uploading complete textbooks, technical documentation, or lecture notes. The AI works best with structured text-heavy documents."
  },
  {
    question: "How long does processing take?",
    answer: "For a standard 300-page textbook, initial processing usually takes 1-2 minutes. This includes text extraction, chapter analysis, and the generation of your first batch of flashcards and quiz questions."
  },
  {
    question: "What is Spaced Repetition?",
    answer: "Spaced Repetition is a learning technique where you review material at increasing intervals (e.g., 1 day, 3 days, 1 week). Our system tracks which cards you find difficult and schedules them more frequently, ensuring efficient long-term memory retention."
  },
  {
    question: "Can I use the Feynman Technique here?",
    answer: "Yes! We have a dedicated Feynman mode where the AI asks you to explain a concept in simple terms. It then grades your explanation for simplicity and accuracy, helping you identify gaps in your understanding."
  }
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "AI Textbook Assistant",
  "description": "Tool that converts textbooks into interactive study materials like flashcards and quizzes using AI.",
  "educationalUse": "Study Aid",
  "interactivityType": "Mixed"
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
      <TextbookLearningClient />
      <FAQSection items={faqs} title="Textbook Learning FAQs" description="Common questions about AI study tools" className="mt-12" />
    </>
  )
}

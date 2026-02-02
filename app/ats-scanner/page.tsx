import type { Metadata } from "next"
import ATSScannerClient from "./ats-scanner-client"
import { FAQSection } from "@/components/faq-section"

export const metadata: Metadata = {
  title: "Free AI ATS Resume Scanner & Optimizer | Interview Pro",
  description: "Boost your resume with our free AI ATS scanner. Get instant feedback on keywords, formatting, and match rate for your target job description.",
  keywords: ["ATS scanner", "resume optimizer", "keyword matcher", "resume score", "free resume review", "ATS checker", "applicant tracking system"],
  openGraph: {
    title: "Free AI ATS Resume Scanner & Optimizer | Interview Pro",
    description: "Get instant feedback on your resume's ATS compatibility. Score your resume against job descriptions for free.",
    url: "https://interview-pro.ai/ats-scanner",
    images: [
      {
        url: "/og-ats.png",
        width: 1200,
        height: 630,
        alt: "AI ATS Scanner Interface",
      },
    ],
  },
  alternates: {
    canonical: "/ats-scanner",
  }
}

const faqs = [
  {
    question: "How does the ATS scanner score my resume?",
    answer: "Our AI analyzes your resume against a specific job description using two scoring methods: a traditional keyword match (tracking exact phrases) and a semantic AI score (understanding context and skills). We also check for formatting issues that often confuse Applicant Tracking Systems."
  },
  {
    question: "What file formats are supported?",
    answer: "We support PDF, DOCX (Word), and TXT files. For best results with most modern ATS software, we recommend using a clean, text-based PDF or DOCX without complex columns or graphics."
  },
  {
    question: "Is my resume data kept private?",
    answer: "Yes. Your resume is processed securely and is not shared with third parties. We use it solely to generate your analysis and improvement recommendations."
  },
  {
    question: "How can I improve my ATS score?",
    answer: "Focus on including relevant keywords from the job description, quantifying your achievements with numbers (e.g., 'Increased sales by 20%'), and using standard section headings like 'Experience' and 'Education'."
  }
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "AI ATS Resume Scanner",
  "provider": {
    "@type": "Organization",
    "name": "Interview Pro"
  },
  "description": "Analyze and optimize your resume for Applicant Tracking Systems (ATS) with AI.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
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
      <ATSScannerClient />
      <FAQSection items={faqs} title="ATS Scanner FAQs" description="Common questions about resume optimization" className="mt-12" />
    </>
  )
}

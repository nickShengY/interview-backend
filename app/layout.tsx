import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Providers } from "@/components/providers"
import Navigation from "@/components/navigation"
import { FloatingCredits } from "@/components/floating-credits"
import DevDemoButton from "@/components/dev-demo"

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://interview-pro.ai'),
  title: {
    default: "Interview Pro - AI-Powered Resume Scanner & Interview Practice",
    template: "%s | Interview Pro"
  },
  description: "Get hired faster with Interview Pro. Free AI resume scanner, ATS optimization, technical coding interview practice, and behavioral coaching. Master your career transition in weeks.",
  applicationName: 'Interview Pro',
  authors: [{ name: 'Interview Pro Team', url: 'https://interview-pro.ai' }],
  generator: 'Next.js',
  keywords: [
    'ATS scanner', 'resume checker', 'AI resume builder', 'mock interview practice', 
    'technical interview prep', 'behavioral interview questions', 'coding interview practice',
    'career change', 'job search tools', 'AI career coach', 'resume optimization',
    'Google Gemini interview prep', 'textbook learning', 'active recall', 'spaced repetition',
    'interview preparation', 'career advancement', 'job placement'
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Interview Pro',
  publisher: 'Interview Pro',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://interview-pro.ai',
    siteName: 'Interview Pro',
    title: 'Interview Pro - AI-Powered Career Advancement',
    description: 'Master your interviews with AI-powered resume scanning, ATS optimization, and intelligent interview practice. Join 10k+ successful candidates.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Interview Pro AI Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interview Pro - AI-Powered Career Advancement',
    description: 'Master your interviews with AI-powered resume scanning and interview practice',
    images: ['/og-image.png'],
    creator: '@interviewpro',
    site: '@interviewpro',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    other: {
      me: ['your-personal-verification-code'],
    },
  },
  category: 'education',
  classification: 'Career & Education',
  other: {
    'geo.region': 'US',
    'geo.placename': 'San Francisco',
    'geo.position': '37.7749;-122.4194',
    'ICBM': '37.7749, -122.4194',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Interview Pro',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: 'AI-powered platform for resume scanning, interview preparation, and accelerated learning.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '1250',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-all duration-500">
            <Navigation />
            <main className="container mx-auto px-4 py-8">{children}</main>
            <FloatingCredits />
            <DevDemoButton />
          </div>
        </Providers>
      </body>
    </html>
  )
}

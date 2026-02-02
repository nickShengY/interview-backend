import React from 'react'

interface StructuredDataProps {
  data: Record<string, any>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Interview Pro',
  url: 'https://interview-pro.ai',
  logo: 'https://interview-pro.ai/logo.png',
  sameAs: [
    'https://twitter.com/interviewpro',
    'https://linkedin.com/company/interview-pro',
    'https://facebook.com/interviewpro',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-555-555-5555',
    contactType: 'customer service',
    areaServed: 'US',
    availableLanguage: 'en',
  },
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Interview Pro',
  url: 'https://interview-pro.ai',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://interview-pro.ai/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://interview-pro.ai${item.item}`,
    })),
  }
}

"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  items?: FAQItem[]
  title?: string
  description?: string
  className?: string
}

export function FAQSection({ 
  items = [], 
  title = "Frequently Asked Questions", 
  description = "Common questions about our AI tools and features.",
  className 
}: FAQSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section className={cn("py-16 md:py-24 max-w-4xl mx-auto px-4", className)}>
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {description}
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {items.map((item, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`} 
            className="border px-4 rounded-lg bg-card/50 backdrop-blur-sm"
          >
            <AccordionTrigger className="text-lg font-medium text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

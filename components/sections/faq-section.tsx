"use client"

import { Section } from "@/components/common/section-wrapper"
import { Heading } from "@/components/common/heading"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQSectionProps {
  heading: {
    title: string
    subtitle?: string
    tag?: string
  }
  questions: FAQItem[]
}

export function FAQSection({ heading, questions }: FAQSectionProps) {
  return (
    <Section>
      <Heading title={heading.title} subtitle={heading.subtitle} tag={heading.tag} />
      
      <div className="mx-auto w-full max-w-3xl">
        <Accordion type="multiple" className="w-full space-y-0">
          {questions.map((item, index) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className={index === 0 ? "border-t border-border" : ""}
            >
              <AccordionTrigger className="text-left text-base font-medium leading-relaxed tracking-tight hover:no-underline lg:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground lg:text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}

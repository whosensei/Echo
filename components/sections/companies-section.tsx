"use client"

import { Section } from "@/components/common/section-wrapper"

interface CompaniesProps {
  subtitle?: string
  companies: Array<{
    id: string
    name: string
    logo: string
  }>
}

export function CompaniesSection({ subtitle = "Trusted by leading teams", companies }: CompaniesProps) {
  return (
    <Section container="full" className="py-16 md:py-20 bg-muted/30 border-y border-border/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70 mb-2">
            {subtitle}
          </p>
          <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-border to-transparent"></div>
        </div>
        
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
          
          <div className="no-scrollbar flex max-w-full justify-center overflow-auto">
            <div className="flex shrink-0 items-center gap-12 md:gap-16 lg:gap-20 px-6">
              {companies.map((company, index) => (
                <div
                  key={company.id}
                  className="group flex h-16 items-center justify-center px-6 relative"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <span className="relative text-2xl font-semibold bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent opacity-40 group-hover:opacity-100 transition-all duration-500 tracking-tight">
                    {company.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Section>
  )
}

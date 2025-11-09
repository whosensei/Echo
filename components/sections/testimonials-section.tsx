import { Section } from "@/components/common/section-wrapper"
import { Heading } from "@/components/common/heading"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Testimonial {
  id: string
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
}

interface TestimonialsProps {
  heading: {
    title: string
    subtitle?: string
    tag?: string
  }
  testimonials: Testimonial[]
}

export function TestimonialsSection({ heading, testimonials }: TestimonialsProps) {
  // Split testimonials into two rows
  const midPoint = Math.ceil(testimonials.length / 2);
  const firstRow = testimonials.slice(0, midPoint);
  const secondRow = testimonials.slice(midPoint);

  // Duplicate for seamless infinite scroll
  const duplicatedFirstRow = [...firstRow, ...firstRow];
  const duplicatedSecondRow = [...secondRow, ...secondRow];

  return (
    <Section>
      <Heading title={heading.title} subtitle={heading.subtitle} tag={heading.tag} />
      
      <div className="relative overflow-hidden mt-12 space-y-4">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* First row - scrolling left */}
        <div className="flex gap-4 animate-scroll-left">
          {duplicatedFirstRow.map((testimonial, index) => (
            <Card
              key={`row1-${testimonial.id}-${index}`}
              className="min-w-[400px] max-w-[400px] p-5 border border-border bg-card/50 backdrop-blur-sm flex-shrink-0"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.author} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
                "{testimonial.quote}"
              </p>
            </Card>
          ))}
        </div>

        {/* Second row - scrolling right */}
        <div className="flex gap-4 animate-scroll-right">
          {duplicatedSecondRow.map((testimonial, index) => (
            <Card
              key={`row2-${testimonial.id}-${index}`}
              className="min-w-[400px] max-w-[400px] p-5 border border-border bg-card/50 backdrop-blur-sm flex-shrink-0"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.author} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
                "{testimonial.quote}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}

import { Section } from "@/components/common/section-wrapper"
import { Heading } from "@/components/common/heading"
import { ButtonLinkCustom } from "@/components/common/button-custom"
import Image from "next/image"

interface Feature {
  id: string
  title: string
  description: string
  icon: string
}

interface FeaturesGridProps {
  heading: {
    title: string
    subtitle?: string
    tag?: string
  }
  features: Feature[]
  actions?: Array<{
    id: string
    label: string
    href: string
    type: "primary" | "secondary"
  }>
}

export function FeaturesGridSection({ heading, features, actions }: FeaturesGridProps) {
  return (
    <Section>
      <Heading title={heading.title} subtitle={heading.subtitle} tag={heading.tag} />
      
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {features.map((feature) => (
          <article
            key={feature.id}
            className="flex flex-col gap-4 rounded-lg border border-border p-4 [box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset] hover:border-primary/30 transition-all duration-300"
          >
            <figure className="flex size-9 items-center justify-center rounded-full border border-border bg-muted p-2">
              <span className="text-2xl">{feature.icon}</span>
            </figure>
            <div className="flex flex-col items-start gap-1">
              <h5 className="text-lg font-medium">{feature.title}</h5>
              <p className="text-pretty text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </article>
        ))}
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex items-center justify-center gap-3 md:order-3">
          {actions.map((action) => (
            <ButtonLinkCustom
              key={action.id}
              href={action.href}
              intent={action.type}
              size="lg"
            >
              {action.label}
            </ButtonLinkCustom>
          ))}
        </div>
      )}
    </Section>
  )
}

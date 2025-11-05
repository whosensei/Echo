"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import clsx from "clsx"

interface HeroProps {
  customerSatisfactionText?: string
  title: string
  subtitle: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function HeroSection({
  customerSatisfactionText = "Trusted by thousands of teams worldwide",
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: HeroProps) {
  return (
    <section className="relative min-h-[calc(630px-64px)] overflow-hidden pb-10">
      {/* Grid decoration */}
      <div className="absolute left-0 top-0 z-0 grid h-full w-full grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)] border-b border-border dark:border-border/50 dark:border-[oklch(0.20_0_0)]">
        <div className="col-span-1 flex h-full items-center justify-center" />
        <div className="col-span-1 flex h-full items-center justify-center border-x border-border dark:border-[oklch(0.30_0_0)]" />
        <div className="col-span-1 flex h-full items-center justify-center" />
      </div>
      
      {/* Gradient blur effects */}
      <figure className="pointer-events-none absolute -bottom-[70%] left-1/2 z-0 block aspect-square w-[720px] -translate-x-1/2 rounded-full bg-primary/30 blur-[300px] dark:bg-primary/30" />
      <figure className="pointer-events-none absolute left-[4vw] top-[64px] z-0 hidden aspect-square w-[40vw] rounded-full bg-white/20 opacity-20 blur-[180px] dark:bg-background dark:opacity-60 md:block" />
      <figure className="pointer-events-none absolute bottom-[-50px] right-[7vw] z-0 hidden aspect-square w-[38vw] rounded-full bg-white/20 opacity-20 blur-[180px] dark:bg-background dark:opacity-60 md:block" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col divide-y divide-border dark:divide-[oklch(0.30_0_0)] pt-[35px]">
        {/* Customer satisfaction banner */}
        <div className="flex flex-col items-center justify-end">
          <div className="flex items-center gap-2 !border !border-b-0 border-border dark:border-[oklch(0.30_0_0)] px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm tracking-tight text-muted-foreground">
              {customerSatisfactionText}
            </p>
          </div>
        </div>
        
        {/* Main hero content */}
        <div>
          <div className="mx-auto flex min-h-[288px] max-w-[80vw] shrink-0 flex-col items-center justify-center gap-2 px-2 py-4 sm:px-16 lg:px-24">
            <h1 className="!max-w-screen-lg text-pretty text-center text-[clamp(32px,7vw,64px)] font-medium leading-none tracking-[-1.44px] text-foreground md:tracking-[-2.16px]">
              {title}
            </h1>
            <h2 className="text-md max-w-2xl text-pretty text-center text-muted-foreground md:text-lg">
              {subtitle}
            </h2>
          </div>
        </div>
        
        {/* CTA buttons */}
        <div className="flex items-start justify-center px-8 sm:px-24">
          <div className="flex w-full max-w-[80vw] flex-col items-center justify-start md:!max-w-[392px]">
            <Link href={primaryAction.href} className="w-full">
              <Button
                className={clsx(
                  "!h-14 flex w-full flex-col items-center justify-center rounded-none !text-base"
                )}
                size="lg"
              >
                {primaryAction.label}
              </Button>
            </Link>
            {secondaryAction && (
              <Link href={secondaryAction.href} className="w-full">
                <Button
                  variant="outline"
                  className={clsx(
                    "!h-14 flex w-full flex-col items-center justify-center rounded-none !border-x !border-y-0 border-border dark:!border-[oklch(0.30_0_0)] !bg-transparent !text-base backdrop-blur-xl transition-colors duration-150 hover:!bg-black/5 dark:hover:!bg-white/5"
                  )}
                  size="lg"
                >
                  {secondaryAction.label}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

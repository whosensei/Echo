"use client"

import { Check, Loader2, CheckCircle2 } from "lucide-react"
import { type SVGProps, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Section } from "@/components/common/section-wrapper"
import { Heading } from "@/components/common/heading"
import { ButtonCustom } from "@/components/common/button-custom"
import { useSession } from "@/lib/auth-client"

interface PricingPlan {
  id: string
  title: string
  price: string
  billed: string
  isMostPopular: boolean
  planType: "free" | "pro" | "enterprise"
  features: Array<{
    id: string
    title: string
  }>
}

interface PricingSectionProps {
  heading: {
    title: string
    subtitle?: string
  }
  plans: PricingPlan[]
}

export function PricingSection({ heading, plans }: PricingSectionProps) {
  return (
    <Section className="xl:max-w-screen-xl" id="pricing">
      <Heading title={heading.title} subtitle={heading.subtitle} />
      <div className="flex flex-col gap-5 self-stretch lg:flex-row">
        {plans.map((plan) => (
          <PricingCard key={plan.title} {...plan} />
        ))}
      </div>
    </Section>
  )
}

function PricingCard(item: PricingPlan) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro" | "enterprise" | null>(null)
  const [planStatus, setPlanStatus] = useState<string | null>(null)

  const fetchPlanStatus = async () => {
    try {
      const response = await fetch("/api/billing/status")
      if (response.ok) {
        const data = await response.json()
        setCurrentPlan(data.plan)
        setPlanStatus(data.status)
      }
    } catch (error) {
      console.error("Failed to fetch plan status:", error)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchPlanStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  const isCurrentPlan = currentPlan === item.planType
  const isActive = planStatus === "active" || planStatus === "trialing"

  const handleCheckout = async () => {
    // If not authenticated, redirect to signup
    if (!session?.user) {
      router.push("/signup")
      return
    }

    // If already on this plan, do nothing
    if (isCurrentPlan && isActive) {
      return
    }

    // Free plan - just redirect to dashboard
    if (item.planType === "free") {
      router.push("/dashboard")
      return
    }

    // Pro or Enterprise - create checkout session
    setIsLoading(true)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: item.planType,
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to create checkout session" }))
        console.error("Checkout error:", error)
        alert(error.error || "Failed to start checkout. Please try again.")
        setIsLoading(false)
        return
      }

      const data = await response.json()
      if (data.url) {
        // Redirect to Dodo hosted checkout
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      console.error("Checkout failed:", error)
      alert("Failed to start checkout. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <article
      className={clsx(
        "relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border",
        "[box-shadow:_-100px_50px_200px_0px_rgba(255,255,255,0.02)_inset]",
        "min-h-[520px]", // Make cards taller
      )}
    >
      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Header */}
        <header className="flex flex-col gap-3">
          {item.isMostPopular ? (
            <span className="text-center text-sm font-medium text-primary">
              Most popular
            </span>
          ) : (
            <span className="text-center text-sm font-medium text-transparent">
              &nbsp;
            </span>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-center text-4xl font-medium lg:text-5xl">{item.price}</span>
            <h5 className="text-center text-xl font-medium">{item.title}</h5>
            <p className="text-center text-sm text-muted-foreground">
              {item.billed}
            </p>
          </div>
        </header>

        {/* Features */}
        <ul className="flex flex-col gap-3">
          {item.features.map((feature) => (
            <li
              key={feature.title}
              className="flex items-start gap-2.5 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0" />
              <span>{feature.title}</span>
            </li>
          ))}
        </ul>

        {/* CTA - Pushed to bottom */}
        <div className="relative mt-auto pt-4">
          {item.isMostPopular && (
            <>
              {/* Glow effect behind button */}
              <div className="absolute inset-0 -bottom-4 bg-gradient-to-t from-primary/20 via-primary/10 to-transparent blur-2xl" />
              <Shadow className="pointer-events-none absolute left-0 top-0 h-full w-full origin-bottom scale-[2.0] text-primary" />
            </>
          )}
          <ButtonCustom
            className="z-10 w-full relative"
            onClick={handleCheckout}
            disabled={isLoading || (isCurrentPlan && isActive)}
            intent={item.isMostPopular ? "primary" : "secondary"}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isCurrentPlan && isActive ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Active
              </>
            ) : item.planType === "free" ? (
              "Get started"
            ) : (
              "Upgrade now"
            )}
          </ButtonCustom>
        </div>
      </div>
    </article>
  )
}

function Shadow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 312 175" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g filter="url(#filter0_f_6956_27669)">
        <path
          d="M-41 398C-41 371.998 -35.9174 346.251 -26.0424 322.229C-16.1673 298.206 -1.69321 276.379 16.5535 257.993C34.8002 239.607 56.4622 225.022 80.3027 215.072C104.143 205.121 129.695 200 155.5 200C181.305 200 206.857 205.121 230.697 215.072C254.538 225.022 276.2 239.607 294.446 257.993C312.693 276.379 327.167 298.206 337.042 322.229C346.917 346.251 352 371.998 352 398L-41 398Z"
          fill="currentColor"
          opacity="0.2"
        />
      </g>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="598"
          id="filter0_f_6956_27669"
          width="793"
          x="-241"
          y="0"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
          <feGaussianBlur result="effect1_foregroundBlur_6956_27669" stdDeviation="100" />
        </filter>
      </defs>
    </svg>
  )
}

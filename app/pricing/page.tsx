"use client"

import { PricingSection } from "@/components/sections/pricing-section"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={session?.user ? "/dashboard" : "/"}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            {session?.user ? (
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <PricingSection
          heading={{
            title: "",
            subtitle: "",
          }}
          plans={[
            {
              id: "1",
              title: "Free",
              price: "Free",
              billed: "Forever free",
              isMostPopular: false,
              planType: "free",
              features: [
                { id: "1", title: "Basic AI model access" },
                { id: "2", title: "100 transcription minutes per month" },
                { id: "3", title: "10,000 AI tokens per month" },
                { id: "4", title: "Standard email support" },
                { id: "5", title: "Basic analytics dashboard" },
              ],
            },
            {
              id: "2",
              title: "Pro",
              price: "$19/mo",
              billed: "Billed monthly",
              isMostPopular: true,
              planType: "pro",
              features: [
                { id: "1", title: "Advanced AI model access" },
                { id: "2", title: "300 transcription minutes included" },
                { id: "3", title: "300,000 AI tokens included" },
                { id: "4", title: "Overage: $0.06/min, $0.30 per 1K tokens" },
                { id: "5", title: "Priority email and chat support" },
                { id: "6", title: "Enhanced analytics dashboard" },
              ],
            },
            {
              id: "3",
              title: "Enterprise",
              price: "Custom",
              billed: "Contact sales",
              isMostPopular: false,
              planType: "enterprise",
              features: [
                { id: "1", title: "Premium AI models with customization" },
                { id: "2", title: "Higher usage quotas" },
                { id: "3", title: "Dedicated account manager" },
                { id: "4", title: "Custom integrations and APIs" },
                { id: "5", title: "SLA and enterprise support" },
                { id: "6", title: "Volume discounts available" },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}




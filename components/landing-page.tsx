"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { Mic, ArrowRight } from "lucide-react"
import { HeroSection } from "@/components/sections/hero-section"
import { FeaturesGridSection } from "@/components/sections/features-grid-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { CompaniesSection } from "@/components/sections/companies-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { FAQSection } from "@/components/sections/faq-section"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function LandingPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-background landing-page-dark">
      <nav className="sticky left-0 top-0 z-[110] flex w-full flex-col border-b border-border bg-background">
        <div className="flex h-14 sm:h-16 bg-background">
          <div className="container mx-auto grid w-full grid-cols-3 items-center px-4 sm:px-6">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center ring-offset-2">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-lg sm:text-xl font-medium tracking-tight">Echo</span>
                </div>
              </Link>
            </div>
            
            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center justify-center gap-1">
              <Link href="#features">
                <Button variant="ghost" size="sm" className="font-medium">
                  Features
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="ghost" size="sm" className="font-medium">
                  Pricing
                </Button>
              </Link>
              <Link href="#blog">
                <Button variant="ghost" size="sm" className="font-medium">
                  Blog
                </Button>
              </Link>
            </div>
            
            {/* Right: Auth Buttons */}
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              {session?.user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="font-medium text-xs sm:text-sm hidden sm:inline-flex">Dashboard</Button>
                  </Link>
                  <Link href="/record">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 font-medium text-xs sm:text-sm">Start Recording</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-medium text-xs sm:text-sm">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 font-medium text-xs sm:text-sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <HeroSection
        customerSatisfactionText="Trusted by thousands of teams worldwide"
        title="Turn conversations into actionable insights"
        subtitle="Record, transcribe, and analyze your meetings with cutting edge AI. Get speaker identification, smart summaries, and action items automatically."
        primaryAction={{
          label: session?.user ? "Start Recording Now" : "Get Started Free",
          href: session?.user ? "/record" : "/signup"
        }}
        secondaryAction={{
          label: "See How It Works",
          href: "#features"
        }}
      />

      {/* Companies/Logos */}
      <CompaniesSection
        subtitle="Trusted by leading teams worldwide"
        companies={[
          { id: "1", name: "Acme Corp", logo: "/logos/acme.svg" },
          { id: "2", name: "TechFlow", logo: "/logos/techflow.svg" },
          { id: "3", name: "DataSync", logo: "/logos/datasync.svg" },
          { id: "4", name: "CloudBase", logo: "/logos/cloudbase.svg" },
          { id: "5", name: "NextGen", logo: "/logos/nextgen.svg" },
        ]}
      />

      {/* Features Grid */}
      <div id="features">
        <FeaturesGridSection
          heading={{
            title: "Everything you need to stay productive",
            subtitle: "Powerful AI features that transform how you capture and understand meetings",
            tag: "Features"
          }}
        features={[
          {
            id: "1",
            title: "Crystal Clear Recording",
            description: "Professional-grade audio capture with automatic noise reduction and enhancement",
            icon: "🎙️"
          },
          {
            id: "2",
            title: "AI Transcription",
            description: "99% accurate transcription with support for 50+ languages and accents",
            icon: "📝"
          },
          {
            id: "3",
            title: "Speaker Identification",
            description: "Automatically detect and label different speakers in your conversations",
            icon: "👥"
          },
          {
            id: "4",
            title: "Smart Summaries",
            description: "AI-generated summaries with key points, decisions, and action items",
            icon: "🧠"
          },
          {
            id: "5",
            title: "Real-time Processing",
            description: "Get instant transcriptions and insights as your meeting progresses",
            icon: "⚡"
          },
          {
            id: "6",
            title: "Enterprise Security",
            description: "Bank-level encryption, GDPR compliant, and SOC 2 certified",
            icon: "🔒"
          }
        ]}
        actions={[
          {
            id: "1",
            label: session?.user ? "Start Recording" : "Get Started Free",
            href: session?.user ? "/record" : "/signup",
            type: "primary"
          }
        ]}
      />
      </div>

      <section className="py-14 md:py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 md:gap-8">
            {[
              { value: "99%", label: "Transcription Accuracy" },
              { value: "50+", label: "Languages Supported" },
              { value: "10M+", label: "Minutes Transcribed" },
              { value: "4.9/5", label: "User Rating" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl md:text-6xl font-medium bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent mb-3 tracking-[-1.44px] md:tracking-[-2.16px]">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium text-[15px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection
        heading={{
          title: "Loved by teams everywhere",
          subtitle: "See what our customers have to say about Echo",
          tag: "Testimonials"
        }}
        testimonials={[
          {
            id: "1",
            quote: "Echo has completely transformed how we handle our team meetings. The transcription accuracy is incredible, and the AI summaries save us hours every week.",
            author: "Sarah Johnson",
            role: "VP of Operations",
            company: "TechCorp"
          },
          {
            id: "2",
            quote: "The speaker identification feature is a game-changer. We can finally keep track of who said what in our all-hands meetings without taking manual notes.",
            author: "Michael Chen",
            role: "Product Manager",
            company: "InnovateLabs"
          },
          {
            id: "3",
            quote: "As a remote-first company, Echo helps us stay aligned. The action items extraction is spot-on and ensures nothing falls through the cracks.",
            author: "Emma Rodriguez",
            role: "CEO",
            company: "RemoteWorks"
          },
          {
            id: "4",
            quote: "The export and integration features make it seamless to share meeting insights with our project management tools. Highly recommend!",
            author: "David Park",
            role: "Engineering Lead",
            company: "DevStream"
          },
          {
            id: "5",
            quote: "We've tried several meeting tools, but Echo's accuracy and ease of use are unmatched. It's become an essential part of our workflow.",
            author: "Lisa Anderson",
            role: "Head of Marketing",
            company: "GrowthHub"
          },
          {
            id: "6",
            quote: "The real-time processing is incredible. We get instant transcriptions during live meetings, which helps keep everyone on the same page.",
            author: "James Wilson",
            role: "CTO",
            company: "CloudScale"
          }
        ]}
      />

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection
          heading={{
            title: "Simple pricing for your team",
            subtitle: "Check out our different pricing plans."
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
              { id: "2", title: "600 transcription minutes per month" },
              { id: "3", title: "200,000 AI tokens per month" },
              { id: "4", title: "Standard email support" },
              { id: "5", title: "Basic analytics dashboard" }
            ]
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
              { id: "2", title: "2,000 transcription minutes per month" },
              { id: "3", title: "1,000,000 AI tokens per month" },
              { id: "4", title: "Priority email support" },
              { id: "5", title: "Enhanced analytics dashboard" }
            ]
          },
          {
            id: "3",
            title: "Max",
            price: "$59/mo",
            billed: "Billed monthly",
            isMostPopular: false,
            planType: "enterprise",
            features: [
              { id: "1", title: "Premium AI models with customization" },
              { id: "2", title: "5,000 transcription minutes per month" },
              { id: "3", title: "5,000,000 AI tokens per month" },
              { id: "4", title: "Dedicated account manager" },
              { id: "5", title: "Volume discounts available" }
            ]
          }
        ]}
      />
      </div>

      {/* FAQ Section */}
      <FAQSection
        heading={{
          title: "Frequently asked questions",
          subtitle: "Everything you need to know about Echo",
          tag: "FAQ"
        }}
        questions={[
          {
            id: "1",
            question: "How accurate is the transcription?",
            answer: "Our AI-powered transcription delivers 99% accuracy across 50+ languages and accents. We use advanced speech recognition models that continuously improve with use."
          },
          {
            id: "2",
            question: "Can I use Echo for free?",
            answer: "Yes! Our free plan includes up to 600 minutes of transcription per month and 200,000 AI tokens per month, along with basic AI summaries and speaker identification. No credit card required."
          },
          {
            id: "3",
            question: "How does speaker identification work?",
            answer: "Our AI automatically detects different voices in your recordings and assigns speaker labels. You can also manually edit and assign names to speakers for future meetings."
          },
          {
            id: "4",
            question: "Is my data secure?",
            answer: "Absolutely. We use bank-level encryption for all data in transit and at rest. We're GDPR compliant and SOC 2 certified. Your meeting data is never used to train AI models without explicit permission."
          },
          {
            id: "5",
            question: "What file formats do you support?",
            answer: "We support all major audio and video formats including MP3, WAV, M4A, MP4, and more. You can also record directly in our app or upload existing files."
          },
          {
            id: "6",
            question: "What languages are supported?",
            answer: "We support over 50 languages including English, Spanish, French, German, Mandarin, Japanese, and many more. Our AI handles multiple languages in the same recording."
          },
          {
            id: "7",
            question: "Can I cancel my subscription anytime?",
            answer: "Yes, you can cancel your subscription at any time. Your data will remain accessible, and you'll continue to have access until the end of your billing period."
          }
        ]}
      />

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-primary/95 via-primary to-primary/90 text-primary-foreground">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-[-1.44px] md:tracking-[-2.16px] leading-tight mb-6">
            Ready to transform
            <span className="block">your meetings?</span>
          </h2>
          <p className="text-lg md:text-xl mb-12 opacity-90 font-normal max-w-2xl mx-auto">
            Join thousands of teams using Echo to capture every important conversation
          </p>
          {session?.user ? (
            <Link href="/record">
              <Button size="lg" className="text-base px-8 h-12 bg-background text-foreground hover:bg-background/90 font-medium shadow-2xl">
                <Mic className="mr-2 h-4.5 w-4.5" strokeWidth={2.5} />
                Start Recording Now
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="lg" className="text-base px-8 h-12 bg-background text-foreground hover:bg-background/90 font-medium shadow-2xl">
                Get Started Free
                <ArrowRight className="ml-2 h-4.5 w-4.5" strokeWidth={2.5} />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="container mx-auto grid grid-cols-2 grid-rows-[auto_auto_auto] place-items-start items-center gap-y-7 px-6 sm:grid-cols-[1fr_auto_1fr] sm:grid-rows-2 sm:gap-x-3 sm:gap-y-16">
          {/* Logo */}
          <Link href="/" aria-label="Homepage" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <Mic className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-medium tracking-tight">Echo</span>
          </Link>

          {/* Navigation */}
          <nav className="col-start-1 row-start-2 flex flex-col gap-x-2 gap-y-3 self-center sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:flex-row sm:items-center sm:place-self-center md:gap-x-4 lg:gap-x-8">
            <Link href="#features" className="px-2 font-light tracking-tight text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="px-2 font-light tracking-tight text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/dashboard" className="px-2 font-light tracking-tight text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/record" className="px-2 font-light tracking-tight text-muted-foreground hover:text-foreground">
              Record
            </Link>
          </nav>

          {/* Theme Switcher */}
          <div className="col-start-2 row-start-1 flex items-center gap-3 self-center justify-self-end sm:col-span-1 sm:col-start-3 sm:row-start-1">
            <p className="hidden text-muted-foreground sm:block text-sm">
              Appearance
            </p>
            <ThemeSwitcher />
          </div>

          {/* Copyright and Legal Links */}
          <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
            <p className="text-pretty text-sm text-muted-foreground">
              © 2025 Echo. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <ul className="col-span-2 col-start-1 row-start-3 flex w-full items-center gap-x-3.5 gap-y-4 sm:col-span-1 sm:col-start-3 sm:row-start-2 sm:w-auto sm:flex-wrap sm:justify-self-end">
            <li>
              <Link href="https://twitter.com" target="_blank" className="block aspect-square p-0.5 hover:opacity-70">
                <span className="sr-only">Twitter</span>
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
            </li>
            <li>
              <Link href="https://github.com" target="_blank" className="block aspect-square p-0.5 hover:opacity-70">
                <span className="sr-only">GitHub</span>
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </Link>
            </li>
            <li>
              <Link href="https://linkedin.com" target="_blank" className="block aspect-square p-0.5 hover:opacity-70">
                <span className="sr-only">LinkedIn</span>
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"
import { Mic, Sparkles, Users, FileText, Zap, Shield, ArrowRight, Check } from "lucide-react"

export default function LandingPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MeetingAI
              </span>
            </div>
            <div className="flex items-center gap-3">
              {session?.user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <Link href="/record">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Start Recording
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 mb-8">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">AI-Powered Meeting Intelligence</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Turn conversations into
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                actionable insights
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Record, transcribe, and analyze your meetings with cutting-edge AI. Get speaker identification, 
              smart summaries, and action items—automatically.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session?.user ? (
                <Link href="/record">
                  <Button size="lg" className="text-lg px-8 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording Now
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                  See How It Works
                </Button>
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground">
              ✨ No credit card required • Free forever plan • 99% accuracy
            </p>
          </div>
        </div>
        
        {/* Gradient blur effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to stay productive
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI features that transform how you capture and understand meetings
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: "Crystal Clear Recording",
                description: "Professional-grade audio capture with automatic noise reduction and enhancement"
              },
              {
                icon: FileText,
                title: "AI Transcription",
                description: "99% accurate transcription with support for 50+ languages and accents"
              },
              {
                icon: Users,
                title: "Speaker Identification",
                description: "Automatically detect and label different speakers in your conversations"
              },
              {
                icon: Sparkles,
                title: "Smart Summaries",
                description: "AI-generated summaries with key points, decisions, and action items"
              },
              {
                icon: Zap,
                title: "Real-time Processing",
                description: "Get instant transcriptions and insights as your meeting progresses"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption, GDPR compliant, and SOC 2 certified"
              }
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Three simple steps to better meetings
            </h2>
            <p className="text-xl text-muted-foreground">
              From recording to insights in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Record or Upload",
                description: "Start recording with one click or upload an existing audio file. We support all major formats."
              },
              {
                step: "02",
                title: "AI Processing",
                description: "Our AI transcribes, identifies speakers, and extracts key information automatically."
              },
              {
                step: "03",
                title: "Get Insights",
                description: "Review transcripts, summaries, action items, and share them with your team instantly."
              }
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl mb-6">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-500 to-purple-600" />
                )}
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "99%", label: "Transcription Accuracy" },
              { value: "50+", label: "Languages Supported" },
              { value: "10M+", label: "Minutes Transcribed" },
              { value: "4.9/5", label: "User Rating" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Start free, upgrade when you need
            </h2>
            <p className="text-xl text-muted-foreground">
              No credit card required to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-2">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 100 minutes/month",
                  "AI transcription",
                  "Speaker identification",
                  "Basic summaries",
                  "7-day history"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </Card>

            <Card className="p-8 border-2 border-primary shadow-lg relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited minutes",
                  "Advanced AI summaries",
                  "Priority processing",
                  "Team collaboration",
                  "Unlimited history",
                  "Export & integrations"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Start Free Trial
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your meetings?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join thousands of teams using MeetingAI to capture every important conversation
          </p>
          {session?.user ? (
            <Link href="/record">
              <Button size="lg" className="text-lg px-8 h-12 bg-white text-purple-600 hover:bg-gray-100">
                <Mic className="mr-2 h-5 w-5" />
                Start Recording Now
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 h-12 bg-white text-purple-600 hover:bg-gray-100">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">MeetingAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered transcription and meeting intelligence for modern teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/record" className="hover:text-foreground">Recording</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
                <li><Link href="#" className="hover:text-foreground">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 MeetingAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

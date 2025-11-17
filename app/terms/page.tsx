"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSession } from "@/lib/auth-client"

export default function TermsOfServicePage() {
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

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Echo ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
            <p className="mb-4">
              These Terms apply to all users of the Service, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Echo is an AI-powered platform that provides:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Audio recording and transcription services</li>
              <li>AI-powered meeting summaries and analysis</li>
              <li>Speaker identification and diarization</li>
              <li>Integration with Google Calendar and Gmail</li>
              <li>AI chat functionality for querying transcripts</li>
              <li>Export capabilities (PDF, email)</li>
            </ul>
            <p className="mb-4">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Creation</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You must provide accurate, current, and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Eligibility</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You must be at least 13 years old to use the Service</li>
              <li>If you are under 18, you must have parental or guardian consent</li>
              <li>You must have the legal capacity to enter into binding agreements</li>
              <li>You may not create multiple accounts to circumvent usage limits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Upload, record, or transmit content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy</li>
              <li>Impersonate any person or entity or falsely state or misrepresent your affiliation</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service or other accounts</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove any copyright, trademark, or proprietary notices</li>
              <li>Use the Service to violate intellectual property rights of others</li>
              <li>Record or transcribe content without proper authorization or consent from all participants</li>
              <li>Use the Service to violate privacy rights or record confidential information without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Subscriptions and Payment</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Subscription Plans</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>We offer Free, Pro, and Enterprise subscription plans with different usage limits</li>
              <li>Plan features and limits are subject to change with notice</li>
              <li>Free plan users are subject to usage limits as specified in the plan</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Billing</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Subscriptions are billed in advance on a monthly basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>Prices are subject to change with 30 days' notice to existing subscribers</li>
              <li>You authorize us to charge your payment method for all fees</li>
              <li>If payment fails, we may suspend or terminate your subscription</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Cancellation</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You will continue to have access to paid features until the end of your billing period</li>
              <li>No refunds are provided for partial billing periods</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.4 Usage Limits</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Usage limits are reset at the beginning of each billing period</li>
              <li>Exceeding limits may result in service restrictions</li>
              <li>We reserve the right to enforce fair usage policies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Our Rights</h3>
            <p className="mb-4">
              The Service, including its original content, features, and functionality, is owned by Echo and protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Your Content</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You retain ownership of audio recordings, transcripts, and content you upload</li>
              <li>You grant us a license to use, store, process, and transmit your content solely to provide the Service</li>
              <li>You represent that you have the right to upload and process all content you provide</li>
              <li>You are responsible for ensuring you have consent from all participants before recording</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 AI-Generated Content</h3>
            <p className="mb-4">
              Transcripts, summaries, and AI-generated content are provided "as is" and may contain errors. We do not guarantee accuracy, completeness, or suitability of AI-generated content. You are responsible for reviewing and verifying all AI-generated content before use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Third-Party Services</h2>
            <p className="mb-4">
              The Service integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Google Calendar and Gmail (for calendar sync and email functionality)</li>
              <li>AssemblyAI (for transcription services)</li>
              <li>OpenAI, Anthropic, and Google Gemini (for AI features)</li>
              <li>AWS S3 (for file storage)</li>
              <li>Dodo Payments (for payment processing)</li>
            </ul>
            <p className="mb-4">
              Your use of third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the availability, accuracy, or practices of third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as described in the Privacy Policy.
            </p>
            <p className="mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Obtaining consent from all meeting participants before recording</li>
              <li>Complying with applicable privacy laws and regulations</li>
              <li>Ensuring you have the right to record and process any content you upload</li>
              <li>Protecting sensitive or confidential information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Service Availability</h3>
            <p className="mb-4">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Accuracy Disclaimer</h3>
            <p className="mb-4">
              While we strive for accuracy, transcriptions and AI-generated content may contain errors. We do not guarantee the accuracy, completeness, or reliability of any content generated by the Service. You should verify all information before relying on it.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9.3 Limitation of Liability</h3>
            <p className="mb-4">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
              <li>We are not responsible for any loss of data, profits, or business opportunities</li>
              <li>We are not liable for any decisions made based on AI-generated content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless Echo and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Content you upload or record</li>
              <li>Your failure to obtain proper consent for recording</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Termination by You</h3>
            <p className="mb-4">
              You may terminate your account at any time by deleting your account through the Service or contacting us.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Termination by Us</h3>
            <p className="mb-4">
              We may suspend or terminate your access to the Service immediately, without prior notice, if:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You violate these Terms</li>
              <li>You engage in fraudulent, illegal, or harmful activity</li>
              <li>You fail to pay subscription fees</li>
              <li>We are required to do so by law</li>
              <li>We discontinue the Service</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Effect of Termination</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Your right to use the Service will immediately cease</li>
              <li>We may delete your account and data after a reasonable retention period</li>
              <li>Provisions that by their nature should survive termination will remain in effect</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.1 Dispute Resolution Process</h3>
            <p className="mb-4">
              Any disputes arising out of or relating to these Terms or the Service shall be resolved through:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>Good faith negotiation between the parties</li>
              <li>Class action waiver: You agree to resolve disputes individually and waive any right to participate in class actions</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Posting the updated Terms on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification for significant changes</li>
            </ul>
            <p className="mb-4">
              Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. General Provisions</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">14.1 Entire Agreement</h3>
            <p className="mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Echo regarding the Service.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">14.2 Severability</h3>
            <p className="mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">14.3 Waiver</h3>
            <p className="mb-4">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of such right.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">14.4 Assignment</h3>
            <p className="mb-4">
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <ul className="list-none mb-4 space-y-2">
              <li><strong>Help:</strong> <a href="mailto:legal@echoai.com" className="text-primary hover:underline">echoai.help@gmail.com</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}


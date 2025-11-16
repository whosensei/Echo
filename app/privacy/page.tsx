"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSession } from "@/lib/auth-client"

export default function PrivacyPolicyPage() {
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
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Echo ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience when using our services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered meeting transcription and analysis platform.
            </p>
            <p className="mb-4">
              By using Echo, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and profile picture when you create an account or sign in with Google</li>
              <li><strong>Audio Recordings:</strong> Audio files you upload or record through our platform</li>
              <li><strong>Meeting Information:</strong> Meeting titles, descriptions, and calendar event data when you sync with Google Calendar</li>
              <li><strong>Payment Information:</strong> Billing details processed through our payment provider (Dodo Payments). We do not store your full payment card information.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Information about how you use our services, including transcription minutes, AI token usage, and feature interactions</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
              <li><strong>Session Data:</strong> Authentication tokens, session IDs, and login timestamps</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to maintain your session and improve your experience</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Third-Party Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Google Services:</strong> When you connect Google Calendar or Gmail, we access calendar events, meeting details, and email functionality as authorized by you</li>
              <li><strong>OAuth Tokens:</strong> We store encrypted OAuth tokens to maintain your Google account connection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our transcription, summarization, and AI chat services</li>
              <li><strong>Audio Processing:</strong> To transcribe your audio recordings using third-party AI services (AssemblyAI)</li>
              <li><strong>AI Features:</strong> To generate summaries, action items, and provide AI-powered chat responses using OpenAI, Anthropic, and Google Gemini</li>
              <li><strong>Calendar Integration:</strong> To sync and display your Google Calendar meetings</li>
              <li><strong>Email Functionality:</strong> To send transcripts, summaries, and PDFs via Gmail when you request it</li>
              <li><strong>Billing and Subscriptions:</strong> To process payments, manage subscriptions, and track usage limits</li>
              <li><strong>Communication:</strong> To send you service updates, support responses, and important notifications</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, or security threats</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve our services (aggregated and anonymized data)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
            <p className="mb-4">We use the following third-party services that may have access to your data:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>AssemblyAI:</strong> Processes audio files for transcription. Their privacy policy applies to audio data sent to their service.</li>
              <li><strong>OpenAI:</strong> Powers AI chat and summarization features. Your prompts and transcripts may be sent to OpenAI for processing.</li>
              <li><strong>Anthropic:</strong> Alternative AI model provider for chat features. Your data may be processed by Anthropic.</li>
              <li><strong>Google Gemini:</strong> AI model for chat and analysis. Data sent to Google is subject to Google's privacy policy.</li>
              <li><strong>Google Services:</strong> Calendar and Gmail integration. We access only the data you authorize.</li>
              <li><strong>AWS S3:</strong> Stores your audio files securely. Files are encrypted and access-controlled.</li>
              <li><strong>Dodo Payments:</strong> Processes subscription payments. Payment data is handled according to their privacy policy.</li>
              <li><strong>Neon Database:</strong> Hosts our database containing your account and usage data.</li>
            </ul>
            <p className="mb-4">
              All third-party services are bound by their respective privacy policies and data processing agreements. We only share the minimum data necessary for each service to function.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Storage and Security</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Storage</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Audio files are stored in AWS S3 with encryption at rest</li>
              <li>Transcripts and metadata are stored in our secure database</li>
              <li>Data is retained for as long as your account is active or as needed to provide services</li>
              <li>You can delete your recordings and data at any time through the application</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Security Measures</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Secure authentication via Better Auth with session management</li>
              <li>OAuth tokens are encrypted and stored securely</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication requirements for all data access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information through your account settings</li>
              <li><strong>Deletion:</strong> Delete your account and associated data at any time</li>
              <li><strong>Data Portability:</strong> Export your transcripts and recordings</li>
              <li><strong>Opt-Out:</strong> Disconnect third-party integrations (Google Calendar, Gmail) at any time</li>
              <li><strong>Cookie Preferences:</strong> Manage cookies through your browser settings</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us at <a href="mailto:echoai.help@gmail.com" className="text-primary hover:underline">echoai.help@gmail.com</a> or use the settings page in your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>We retain your data for as long as your account is active</li>
              <li>Deleted recordings are permanently removed within 30 days</li>
              <li>Account data is retained for up to 90 days after account deletion for legal and compliance purposes</li>
              <li>Usage and billing records may be retained longer as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
            <p className="mb-4">
              Our services are not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately, and we will delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. We ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Standard contractual clauses for data transfers</li>
              <li>Compliance with GDPR and other applicable data protection regulations</li>
              <li>Third-party service providers that meet international data protection standards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Cookies and Tracking Technologies</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze service usage (anonymized)</li>
              <li>Improve security</li>
            </ul>
            <p className="mb-4">
              You can control cookies through your browser settings, but disabling cookies may affect service functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending an email notification for significant changes</li>
            </ul>
            <p className="mb-4">
              Your continued use of our services after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none mb-4 space-y-2">
              <li><strong>Help:</strong> <a href="mailto:echoai.help@gmail.com" className="text-primary hover:underline">echoai.help@gmail.com</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. GDPR Compliance</h2>
            <p className="mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to object to processing</li>
              <li>Right to data portability</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us at <a href="mailto:echoai.help@gmail.com" className="text-primary hover:underline">echoai.help@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


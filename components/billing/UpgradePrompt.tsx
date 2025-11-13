"use client"

import { AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface UpgradePromptProps {
  type: "transcription" | "tokens"
  used: number
  limit: number
  className?: string
}

export function UpgradePrompt({ type, used, limit, className }: UpgradePromptProps) {
  const isTranscription = type === "transcription"
  const resourceName = isTranscription ? "transcription minutes" : "AI tokens"
  
  return (
    <Alert className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Limit Exceeded</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          You have used {isTranscription ? used.toFixed(1) : used.toLocaleString()} of {isTranscription ? limit : limit.toLocaleString()} {resourceName} for this billing period.
        </p>
        <Button asChild variant="default" size="sm">
          <Link href="/pricing">
            Upgrade Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}



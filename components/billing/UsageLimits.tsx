"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Sparkles } from "lucide-react"
import { useUsageLimits } from "@/hooks/use-usage-limits"

interface UsageLimitsProps {
  className?: string
  compact?: boolean
}

export function UsageLimits({ className, compact = false }: UsageLimitsProps) {
  const { usage, loading } = useUsageLimits()

  if (loading || !usage) {
    return null
  }

  const transcriptionPercent = Math.min((usage.transcriptionMinutes.used / usage.transcriptionMinutes.limit) * 100, 100)
  const tokensPercent = Math.min((usage.aiTokens.used / usage.aiTokens.limit) * 100, 100)
  
  const transcriptionExceeded = usage.transcriptionMinutes.used >= usage.transcriptionMinutes.limit
  const tokensExceeded = usage.aiTokens.used >= usage.aiTokens.limit

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`flex items-center gap-2 ${transcriptionExceeded ? 'text-destructive' : ''}`}>
          <Mic className={`h-4 w-4 ${transcriptionExceeded ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${transcriptionExceeded ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {usage.transcriptionMinutes.used.toFixed(1)} / {usage.transcriptionMinutes.limit}
          </span>
        </div>
        <div className={`flex items-center gap-2 ${tokensExceeded ? 'text-destructive' : ''}`}>
          <Sparkles className={`h-4 w-4 ${tokensExceeded ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${tokensExceeded ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {Math.round(usage.aiTokens.used / 1000)}K / {Math.round(usage.aiTokens.limit / 1000)}K
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Transcription Minutes */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Mic className={`h-4 w-4 ${transcriptionExceeded ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${transcriptionExceeded ? 'text-destructive' : ''}`}>Transcription</span>
          </div>
          <span className={transcriptionExceeded ? "text-destructive font-semibold" : "text-muted-foreground"}>
            {usage.transcriptionMinutes.used.toFixed(1)} / {usage.transcriptionMinutes.limit} min
          </span>
        </div>
        <Progress value={transcriptionPercent} className={`h-2 ${transcriptionExceeded ? '[&>div]:bg-destructive' : ''}`} />
      </div>

      {/* AI Tokens */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${tokensExceeded ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${tokensExceeded ? 'text-destructive' : ''}`}>AI Tokens</span>
          </div>
          <span className={tokensExceeded ? "text-destructive font-semibold" : "text-muted-foreground"}>
            {Math.round(usage.aiTokens.used / 1000)}K / {Math.round(usage.aiTokens.limit / 1000)}K
          </span>
        </div>
        <Progress value={tokensPercent} className={`h-2 ${tokensExceeded ? '[&>div]:bg-destructive' : ''}`} />
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Mic, Zap, AlertCircle } from "lucide-react"

interface UsageData {
  transcriptionMinutes: {
    used: number
    included: number
    limit: number
  }
  aiTokens: {
    used: number
    included: number
    limit: number
  }
  periodStart: string
  periodEnd: string
  plan: string
}

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/billing/usage")
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading usage data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Failed to load usage data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const calculateProgress = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-red-500"
    if (progress >= 80) return "bg-yellow-500"
    return "bg-primary"
  }

  const transcriptionProgress = calculateProgress(
    usage.transcriptionMinutes.used,
    usage.transcriptionMinutes.limit
  )

  const tokensProgress = calculateProgress(
    usage.aiTokens.used,
    usage.aiTokens.limit
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          Usage & Quotas
        </CardTitle>
        <CardDescription>
          Current billing period: {formatDate(usage.periodStart)} - {formatDate(usage.periodEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transcription Minutes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Transcription Minutes</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">
                {usage.transcriptionMinutes.used.toFixed(1)} / {formatNumber(usage.transcriptionMinutes.limit)}
              </span>
            </div>
          </div>
          <Progress
            value={transcriptionProgress}
            className="h-2"
          />
        </div>

        {/* AI Tokens */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI Tokens</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">
                {formatNumber(usage.aiTokens.used)} / {formatNumber(usage.aiTokens.limit)}
              </span>
            </div>
          </div>
          <Progress
            value={tokensProgress}
            className="h-2"
          />
        </div>

        {/* Info Note */}
        {usage.plan === "free" && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Free Plan Limits</p>
              <p className="text-xs text-blue-700 mt-1">
                Upgrade to Pro for higher limits and overage billing
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



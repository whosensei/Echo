"use client"

import { useEffect, useState } from "react"

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
  plan: "free" | "pro" | "enterprise"
  periodStart: string
  periodEnd: string
}

export function useUsageLimits() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = async () => {
    try {
      setError(null)
      const response = await fetch("/api/billing/usage")
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      } else {
        setError("Failed to fetch usage data")
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err)
      setError("Failed to fetch usage data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [])

  const canTranscribe = usage
    ? usage.transcriptionMinutes.used < usage.transcriptionMinutes.limit
    : true

  const canChat = usage
    ? usage.aiTokens.used < usage.aiTokens.limit
    : true

  return {
    usage,
    loading,
    error,
    canTranscribe,
    canChat,
    refetch: fetchUsage,
  }
}



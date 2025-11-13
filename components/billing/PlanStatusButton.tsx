"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface BillingStatus {
  plan: "free" | "pro" | "enterprise"
  status: string
}

export function PlanStatusButton() {
  const router = useRouter()
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/billing/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch billing status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewPlans = () => {
    router.push("/pricing")
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Loading plan status...</span>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return null
  }

  const planLabels = {
    free: "Free",
    pro: "Pro",
    enterprise: "Max",
  }

  const isActive = status.status === "active" || status.status === "trialing"

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Your Plan</span>
                <Badge
                  variant={status.plan === "free" ? "outline" : "default"}
                  className={
                    isActive
                      ? "bg-green-500/15 text-green-700 border-green-500/20"
                      : ""
                  }
                >
                  {isActive && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {planLabels[status.plan]}
                </Badge>
              </div>
              {status.plan !== "free" && (
                <p className="text-xs text-muted-foreground mt-1">
                  {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                </p>
              )}
            </div>
          </div>
          {status.plan === "free" ? (
            <Button onClick={handleViewPlans} size="sm">
              Upgrade
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleViewPlans} variant="outline" size="sm">
              View Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}




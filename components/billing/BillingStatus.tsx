"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/toaster"

interface BillingStatus {
  plan: "free" | "pro" | "enterprise"
  status: string
  subscriptionId: string | null
  customerId: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export function BillingStatus() {
  const { toast } = useToast()
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

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

  const handleManageBilling = async () => {
    setIsOpeningPortal(true)
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to open billing portal")
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "Failed to open billing portal",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const handleUpgrade = async (plan: "pro" | "enterprise") => {
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          returnUrl: `${window.location.origin}/settings`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "Failed to start checkout",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading billing status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Failed to load billing status</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const planLabels = {
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
  }

  const statusColors = {
    active: "bg-green-500/15 text-green-700 border-green-500/20",
    trialing: "bg-blue-500/15 text-blue-700 border-blue-500/20",
    inactive: "bg-gray-500/15 text-gray-700 border-gray-500/20",
    on_hold: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20",
    cancelled: "bg-orange-500/15 text-orange-700 border-orange-500/20",
    expired: "bg-red-500/15 text-red-700 border-red-500/20",
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className={`border-border/50 shadow-sm ${
      status.status === "active" || status.status === "trialing"
        ? "bg-gradient-to-br from-card to-primary/5"
        : ""
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription Plan
            </CardTitle>
            <CardDescription className="mt-2">
              Your current billing plan and subscription status
            </CardDescription>
          </div>
          <Badge
            className={`${
              statusColors[status.status as keyof typeof statusColors] ||
              statusColors.inactive
            }`}
          >
            {status.status === "active" || status.status === "trialing" ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : null}
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Current Plan</span>
            <span className="text-lg font-semibold text-foreground">
              {planLabels[status.plan]}
            </span>
          </div>

          {/* Billing Period */}
          {(status.currentPeriodStart || status.currentPeriodEnd) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(status.currentPeriodStart)} - {formatDate(status.currentPeriodEnd)}
              </span>
            </div>
          )}

          {/* Cancellation Notice */}
          {status.cancelAtPeriodEnd && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-700 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Subscription will cancel at period end
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your subscription will remain active until {formatDate(status.currentPeriodEnd)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {status.plan === "free" ? (
            <>
              <Button
                onClick={() => handleUpgrade("pro")}
                className="flex-1"
              >
                Upgrade to Pro
              </Button>
              <Button
                onClick={() => handleUpgrade("enterprise")}
                variant="outline"
                className="flex-1"
              >
                Enterprise
              </Button>
            </>
          ) : (
            <Button
              onClick={handleManageBilling}
              disabled={isOpeningPortal}
              variant="outline"
              className="w-full"
            >
              {isOpeningPortal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}




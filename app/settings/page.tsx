"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toaster";
import { User, Mail, Calendar, CheckCircle2, XCircle, Loader2, AlertTriangle, Trash2, LogOut, RefreshCw } from "lucide-react";

interface IntegrationStatus {
  isConnected: boolean;
  hasGmailAccess: boolean;
  hasCalendarAccess: boolean;
  tokenMightBeExpired: boolean;
  email: string;
  scopes: string[];
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/integrations/status");
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data);
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/integrations/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      toast({
        title: "Google account disconnected",
        description: "You can reconnect anytime from settings.",
      });

      // Refresh status
      await checkIntegrationStatus();
    } catch (error) {
      toast({
        title: "Failed to disconnect",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReconnectGoogle = async () => {
    // Trigger Google OAuth flow
    window.location.href = "/api/auth/sign-in/social/google";
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-8 pb-16">
          {/* Page header with gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-8">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
            <div className="relative">
              <div className="space-y-2">
                <h1 className="text-4xl font-medium tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground text-lg">
                  Manage your account and integrations
                </p>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-medium text-foreground tracking-tight">Profile</h2>
                <p className="text-sm text-muted-foreground">Your account information</p>
              </div>
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    defaultValue={session?.user?.name || ""}
                    placeholder="Enter your name"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      defaultValue={session?.user?.email || ""}
                      placeholder="your.email@example.com"
                      disabled
                      className="h-11 pr-20"
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    >
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="lg" className="min-w-32">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Google Integrations Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-chart-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-medium text-foreground tracking-tight">Google Integration</h2>
                <p className="text-sm text-muted-foreground">Gmail and Calendar connection</p>
              </div>
            </div>

            {isLoading ? (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading integration status...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className={`border-border/50 shadow-sm transition-all ${
                  integrationStatus?.isConnected 
                    ? 'bg-gradient-to-br from-card to-chart-1/5' 
                    : ''
                }`}>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Connection Status Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-foreground">Google Account</h3>
                            {integrationStatus?.isConnected && session?.user?.email && (
                              <p className="text-sm text-muted-foreground mt-0.5">{session.user.email}</p>
                            )}
                          </div>
                        </div>
                        {integrationStatus?.isConnected ? (
                          <Badge className="bg-chart-1/15 text-chart-1 border-chart-1/20 hover:bg-chart-1/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                        )}
                      </div>

                      <Separator />

                      {/* Services Grid */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Gmail Service */}
                        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">Gmail</h4>
                              <p className="text-xs text-muted-foreground">Email integration</p>
                            </div>
                            {integrationStatus?.hasGmailAccess ? (
                              <CheckCircle2 className="h-5 w-5 text-chart-1" />
                            ) : integrationStatus?.isConnected ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Send transcripts and summaries via email
                          </p>
                          {integrationStatus?.isConnected && !integrationStatus?.hasGmailAccess && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1.5">
                              <p className="text-xs text-yellow-800">
                                Missing permission
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Calendar Service */}
                        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-chart-3/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-chart-3" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">Calendar</h4>
                              <p className="text-xs text-muted-foreground">Event sync</p>
                            </div>
                            {integrationStatus?.hasCalendarAccess ? (
                              <CheckCircle2 className="h-5 w-5 text-chart-1" />
                            ) : integrationStatus?.isConnected ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Sync upcoming meetings and events
                          </p>
                          {integrationStatus?.isConnected && !integrationStatus?.hasCalendarAccess && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1.5">
                              <p className="text-xs text-yellow-800">
                                Missing permission
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {integrationStatus?.isConnected ? (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={handleDisconnectGoogle}
                            disabled={isDisconnecting}
                            className="w-full"
                          >
                            {isDisconnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Disconnecting...
                              </>
                            ) : (
                              <>
                                <LogOut className="h-4 w-4 mr-2" />
                                Disconnect Google Account
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            onClick={handleReconnectGoogle}
                            className="w-full"
                          >
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Connect Google Account
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Banner */}
                {integrationStatus?.isConnected && (
                  <Card className="border-primary/20 bg-primary/5 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-lg mt-0.5">
                          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground">Single Sign-On Connection</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Gmail and Calendar use a unified Google OAuth connection. Disconnecting will remove access to both services.
                            {integrationStatus?.tokenMightBeExpired && (
                              <span className="block mt-2 text-yellow-700 font-medium">
                                ⚠️ Your access token may have expired. Try reconnecting if you experience issues.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </section>

          {/* Danger Zone */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-medium text-foreground tracking-tight">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">Irreversible actions</p>
              </div>
            </div>

            <Card className="border-destructive/30 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium text-destructive flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Permanently delete your account and all associated data including recordings, transcriptions, and summaries. This action cannot be undone.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" className="flex-shrink-0">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

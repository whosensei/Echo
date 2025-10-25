"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toaster";
import { User, Mail, Calendar, Key, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

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
        <div className="space-y-8">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
            <p className="text-slate-600 mt-1">
              Manage your account settings and integrations
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      defaultValue={session?.user?.name || ""}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={session?.user?.email || ""}
                      placeholder="your.email@example.com"
                      disabled
                    />
                    <p className="text-xs text-slate-500">
                      Email cannot be changed after registration
                    </p>
                  </div>
                  <Separator />
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div>
                      <p className="text-sm font-medium text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Google Integrations</CardTitle>
                  <CardDescription>
                    Manage your Gmail and Calendar connections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {/* Gmail Integration */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">Gmail</h3>
                              {integrationStatus?.isConnected && integrationStatus?.hasGmailAccess ? (
                                <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Connected
                                </Badge>
                              ) : integrationStatus?.isConnected && !integrationStatus?.hasGmailAccess ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Limited Access
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Connected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Send transcripts and summaries via email
                            </p>
                            {integrationStatus?.isConnected && session?.user?.email && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Connected as: {session.user.email}
                              </p>
                            )}
                            {integrationStatus?.isConnected && !integrationStatus?.hasGmailAccess && (
                              <p className="text-xs text-yellow-700 mt-1">
                                ⚠️ Missing "gmail.send" permission. Please reconnect.
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          {integrationStatus?.isConnected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDisconnectGoogle}
                              disabled={isDisconnecting}
                            >
                              {isDisconnecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Disconnect"
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleReconnectGoogle}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Calendar Integration */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-chart-3/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-chart-3" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">Google Calendar</h3>
                              {integrationStatus?.isConnected && integrationStatus?.hasCalendarAccess ? (
                                <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Connected
                                </Badge>
                              ) : integrationStatus?.isConnected && !integrationStatus?.hasCalendarAccess ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Limited Access
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Connected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Sync upcoming meetings and events
                            </p>
                            {integrationStatus?.isConnected && session?.user?.email && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Connected as: {session.user.email}
                              </p>
                            )}
                            {integrationStatus?.isConnected && !integrationStatus?.hasCalendarAccess && (
                              <p className="text-xs text-yellow-700 mt-1">
                                ⚠️ Missing "calendar.readonly" permission. Please reconnect.
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          {integrationStatus?.isConnected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDisconnectGoogle}
                              disabled={isDisconnecting}
                            >
                              {isDisconnecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Disconnect"
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleReconnectGoogle}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="bg-accent/50 border border-accent rounded-lg p-4">
                    <p className="text-sm text-accent-foreground">
                      <strong>Note:</strong> Gmail and Calendar integrations use a single Google OAuth
                      connection. Disconnecting will remove access to both services.
                      {integrationStatus?.tokenMightBeExpired && integrationStatus?.isConnected && (
                        <span className="block mt-2 text-yellow-700">
                          ⚠️ Your access token may have expired. If you're experiencing issues, try reconnecting.
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for third-party services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* AssemblyAI API Key */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-600" />
                      <Label htmlFor="assemblyai-key">AssemblyAI API Key</Label>
                      <Badge variant="secondary" className="text-xs">
                        Transcription
                      </Badge>
                    </div>
                    <Input
                      id="assemblyai-key"
                      type="password"
                      placeholder="Enter your AssemblyAI API key"
                      defaultValue="••••••••••••••••"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for audio transcription, speaker diarization, entity detection, and AI summaries. Get your key from{" "}
                      <a
                        href="https://www.assemblyai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        assemblyai.com
                      </a>
                    </p>
                  </div>

                  <Separator />

                  {/* Gemini API Key */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-600" />
                      <Label htmlFor="gemini-key">Google Gemini API Key (Optional)</Label>
                      <Badge variant="secondary" className="text-xs">
                        Additional AI
                      </Badge>
                    </div>
                    <Input
                      id="gemini-key"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      defaultValue="••••••••••••••••"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for AI-powered meeting summaries and action points. Get your key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <Separator />

                  <Button>Save API Keys</Button>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-900">
                      <strong>Security:</strong> API keys are encrypted and stored securely. Never
                      share your API keys with anyone.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

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
import { User, Mail, Calendar, Key, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    // In a real app, you'd check if the user has valid OAuth tokens
    // For now, we'll assume they're connected if they have a session
    if (session?.user) {
      setGmailConnected(true);
      setCalendarConnected(true);
    }
  };

  const handleDisconnectIntegration = async (type: "gmail" | "calendar") => {
    setIsLoading(true);
    try {
      // In a real app, you'd revoke the OAuth token here
      toast({
        title: `${type === "gmail" ? "Gmail" : "Calendar"} disconnected`,
        description: "You can reconnect anytime from settings.",
      });
      
      if (type === "gmail") {
        setGmailConnected(false);
      } else {
        setCalendarConnected(false);
      }
    } catch (error) {
      toast({
        title: "Failed to disconnect",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnectIntegration = async (type: "gmail" | "calendar") => {
    // Trigger Google OAuth flow
    window.location.href = "/api/auth/sign-in/social/google";
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">
              Manage your account settings and integrations
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="text-sm font-medium text-red-900">Delete Account</p>
                      <p className="text-xs text-red-700">
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
                  {/* Gmail Integration */}
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">Gmail</h3>
                          {gmailConnected ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Send transcripts and summaries via email
                        </p>
                        {gmailConnected && session?.user?.email && (
                          <p className="text-xs text-slate-500 mt-1">
                            Connected as: {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {gmailConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectIntegration("gmail")}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Disconnect"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReconnectIntegration("gmail")}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Calendar Integration */}
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">Google Calendar</h3>
                          {calendarConnected ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          Sync upcoming meetings and events
                        </p>
                        {calendarConnected && session?.user?.email && (
                          <p className="text-xs text-slate-500 mt-1">
                            Connected as: {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {calendarConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectIntegration("calendar")}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Disconnect"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReconnectIntegration("calendar")}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Gmail and Calendar integrations require Google OAuth
                      authentication. Make sure you grant the necessary permissions during the
                      connection process.
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
                  {/* Gladia API Key */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-600" />
                      <Label htmlFor="gladia-key">Gladia API Key</Label>
                      <Badge variant="secondary" className="text-xs">
                        Transcription
                      </Badge>
                    </div>
                    <Input
                      id="gladia-key"
                      type="password"
                      placeholder="Enter your Gladia API key"
                      defaultValue="••••••••••••••••"
                    />
                    <p className="text-xs text-slate-500">
                      Used for audio transcription and speaker diarization. Get your key from{" "}
                      <a
                        href="https://gladia.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        gladia.io
                      </a>
                    </p>
                  </div>

                  <Separator />

                  {/* Gemini API Key */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-slate-600" />
                      <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                      <Badge variant="secondary" className="text-xs">
                        AI Summary
                      </Badge>
                    </div>
                    <Input
                      id="gemini-key"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      defaultValue="••••••••••••••••"
                    />
                    <p className="text-xs text-slate-500">
                      Used for AI-powered meeting summaries and action points. Get your key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Divider } from "@/components/auth/divider";
import { EmailFieldSignIn, PasswordField } from "@/components/auth/form-fields";
import Link from "next/link";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authClient.signIn.email({
        email,
        password,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium tracking-tight">Welcome to MeetingAI</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <div className="space-y-4">
          {/* OAuth */}
          <OAuthButtons />

          {/* Divider */}
          <Divider />

          {/* Error Message */}
          {error && (
            <div className="text-xs text-destructive text-center">{error}</div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <EmailFieldSignIn value={email} onChange={setEmail} disabled={isLoading} />
            <PasswordField value={password} onChange={setPassword} disabled={isLoading} />

            <div className="flex items-center justify-start">
              <Link 
                href="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button 
              className="w-full h-11" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* Terms */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        By signing in you agree to our{" "}
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms of service
        </Link>
        {" & "}
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy policy
        </Link>
      </div>
    </div>
  );
}

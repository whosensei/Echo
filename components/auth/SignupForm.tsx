"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Divider } from "@/components/auth/divider";
import { EmailFieldSignUp, PasswordFieldWithValidation } from "@/components/auth/form-fields";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.signUp.email({
        email,
        password,
        name: email.split('@')[0], // Use email prefix as name
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Get started with your free account</p>
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
            <EmailFieldSignUp value={email} onChange={setEmail} disabled={isLoading} />
            <PasswordFieldWithValidation value={password} onChange={setPassword} disabled={isLoading} />

            <Button 
              className="w-full h-11" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        By signing up you agree to our{" "}
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

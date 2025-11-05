"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface FieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function NameField({ value, onChange, disabled }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="name" className="text-sm font-medium">
        Full name
      </Label>
      <Input
        id="name"
        type="text"
        placeholder="Enter your full name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        className="h-11"
      />
    </div>
  );
}

export function EmailFieldSignUp({ value, onChange, disabled }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium">
        Email address
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        className="h-11"
      />
    </div>
  );
}

export function EmailFieldSignIn({ value, onChange, disabled }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium">
        Email address
      </Label>
      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        className="h-11"
      />
    </div>
  );
}

export function PasswordField({ value, onChange, disabled }: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="password" className="text-sm font-medium">
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          className="h-11 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function PasswordFieldWithValidation({ value, onChange, disabled }: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="password" className="text-sm font-medium">
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password (min. 8 characters)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          className="h-11 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

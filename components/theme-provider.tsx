'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const NextThemesProviderTyped = NextThemesProvider as React.ComponentType<{
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  themes?: string[];
}>;

export function ThemeProvider({ children, ...props }: {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme' | 'style';
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  themes?: string[];
}) {
  return (
    <NextThemesProviderTyped {...props}>
      {children}
    </NextThemesProviderTyped>
  );
}

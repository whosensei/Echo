import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@/app/globals.css'
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ProfileDropdown } from "@/components/ProfileDropdown";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Echo",
  description: "AI-Powered Ad Creation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={false} className="fixed top-4 left-4">
            <AppSidebar />
            <main className="flex-1">
                <SidebarTrigger className="top-4 left-4 z-50 h-10 w-10 bg-sidebar border border-sidebar-border shadow-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground "/>
              <div className="p-6">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

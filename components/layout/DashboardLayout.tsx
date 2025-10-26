"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Mic,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Meetings", href: "/meetings", icon: FileText },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

const recordButton = { name: "Record", href: "/record", icon: Mic };

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-300",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}>
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-border justify-between">
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center">
                  <Mic className="h-6 w-6 text-primary" />
                  <span className="text-xl font-semibold text-foreground ml-2">
                    Meeting AI
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Mic className="h-8 w-8 text-primary mx-auto" />
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Record Button - Primary Action */}
            <Link
              href={recordButton.href}
              className={cn(
                "flex items-center justify-center py-3 text-sm font-semibold rounded-lg transition-all shadow-sm mb-4",
                pathname === recordButton.href
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-primary/90 text-primary-foreground hover:bg-primary",
                isSidebarCollapsed ? "px-2" : "px-4"
              )}
              title={isSidebarCollapsed ? recordButton.name : undefined}
            >
              <recordButton.icon className={cn(
                isSidebarCollapsed ? "h-6 w-6" : "h-5 w-5",
                !isSidebarCollapsed && "mr-2"
              )} />
              {!isSidebarCollapsed && recordButton.name}
            </Link>

            {/* Regular Navigation Items */}
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isSidebarCollapsed ? "justify-center px-2" : "px-3"
                  )}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn(
                    isSidebarCollapsed ? "h-6 w-6" : "h-5 w-5",
                    !isSidebarCollapsed && "mr-3"
                  )} />
                  {!isSidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex-shrink-0 border-t border-border p-4">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between mb-3 px-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Appearance
                </span>
                <ThemeToggle />
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center mb-3">
                <ThemeToggle />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors",
                  isSidebarCollapsed && "justify-center px-2"
                )}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isSidebarCollapsed && (
                    <div className="ml-3 text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session?.user?.email || ""}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center h-16 px-4 border-b border-border bg-card">
          <div className="flex items-center space-x-2">
            <Mic className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">
              Meeting AI
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

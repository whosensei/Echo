import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";

export default function TypesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-50 p-4">
            <SidebarTrigger className="h-10 w-10 bg-sidebar border border-sidebar-border shadow-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"/>
          </div>
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

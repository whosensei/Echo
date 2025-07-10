import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ProfileDropdown } from "./ProfileDropdown"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-2 border-b border-border bg-background/80 top-0 z-10">
      <div className="flex w-full items-center pr-4 lg:gap-2 lg:px-4">
        <SidebarTrigger className="" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => authClient.signOut()}
          className="ml-2"
        >
          Sign Out
        </Button>
      </div>
    </header>
  )
}

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ProfileDropdown } from "./ProfileDropdown"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-2 border-b border-border bg-background/80 top-0 z-10">
      <div className="flex w-full items-center pr-4 lg:gap-2 lg:px-4">
        <SidebarTrigger className="" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
            <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

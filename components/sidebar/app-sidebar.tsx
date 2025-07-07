"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconCreditCard,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUserCircle,
  IconUsers,
  type Icon,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

// import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FolderOpen, Image, Images, Library, Receipt, ReceiptText, Sparkles, User, type LucideIcon } from "lucide-react"
import { NavGen } from "./nav-gen"

// Union type to handle both Tabler and Lucide icons
type IconComponent = Icon | LucideIcon

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
   
    // {
    //   title: "Creations",
    //   url: "#",
    //   icon: Images,
    // },

    {
      title: "Library",
      url: "#",
      icon: Library,
    },
  ],
  navGenerate: [
    {
      title: "Headshots",
      url: "#",
      icon: IconUserCircle,
    },
    {
      title: "Portraits",
      url: "#",
      icon: Image,
    },
    {
      title: "Hairstyles",
      url: "#",
      icon: User,
    },
    {
      title: "Images",
      url: "#",
      icon: Images,
    },
    {
      title: "ADs",
      url: "#",
      icon: IconFileDescription,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Account",
      url: "#",
      icon: IconUserCircle,
    },
    {
      title: "Billing",
      url: "#",
      icon: IconCreditCard,
    },
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted on client side to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Don't render theme-specific content until mounted
  if (!mounted) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={toggleTheme}
          className="data-[slot=sidebar-menu-button]:!p-2"
        >
          <Moon className="!size-4" />
          <span>Theme</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleTheme}
        className="data-[slot=sidebar-menu-button]:!p-2"
      >
        {theme === 'dark' ? (
          <>
            <Sun className="!size-4" />
            <span>Light mode</span>
          </>
        ) : (
          <>
            <Moon className="!size-4" />
            <span>Dark mode</span>
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Echo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavGen items={data.navGenerate} />
        {/* <NavDocument items={data.documents} />  */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        
        {/* Theme Toggle */}
        <SidebarMenu className="mt-4">
          <ThemeToggle />
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

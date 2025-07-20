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
  IconCirclePlusFilled,
  IconMail,
  IconCreditCard as IconBilling,
  IconDotsVertical,
  IconLogout,
  IconLogout2,
  IconNotification,
  type Icon,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { Moon, Sun, LogOut, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import { FolderOpen, Image, Images, Library, Receipt, ReceiptText, Sparkles, User, MessageCircle } from "lucide-react"
import { useChatFlow } from "@/lib/hooks/useChatFlow"
import type { Chat } from "@/lib/types/chat"

type IconComponent = Icon | LucideIcon

// Data configuration
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Library",
      url: "#",
      icon: Library,
    },
    {
      title: "Templates",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Creations",
      url: "#",
      icon: Images,
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
}

// NavMain Component
function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: IconComponent
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}


// NavChats Component
function NavChats() {
  const { chats, currentChat, loadChat, isLoading } = useChatFlow()

  const handleChatClick = async (chat: Chat) => {
    try {
      await loadChat(chat.chatID)
    } catch (error) {
      console.error('Failed to load chat:', error)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {isLoading ? (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <MessageCircle />
                <span className="text-muted-foreground">Loading chats...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : chats.length === 0 ? (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <MessageCircle />
                <span className="text-muted-foreground">No chats yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            chats.map((chat) => (
              <SidebarMenuItem key={chat.chatID}>
                <SidebarMenuButton 
                  tooltip={chat.title || 'Untitled Chat'} 
                  onClick={() => handleChatClick(chat)}
                  className={`${currentChat?.chatID === chat.chatID ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                >
                  <MessageCircle />
                  <span className="truncate">{chat.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// NavSecondary Component
function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// NavUser Component
function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          <LogOut className="size-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// Theme Toggle Component
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

  if (!mounted) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={toggleTheme}
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

// Main AppSidebar Component
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
        <NavChats />
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
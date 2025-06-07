"use client"
import { Calendar, Circle, Home, Inbox, Search, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "./ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar"

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url : "#",
    icon : Inbox
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const projects = [
    {
        title:"Project1",
        url:"#"
    }
]


export function AppSidebar() {
    const SIDEBAR_KEYBOARD_SHORTCUT = "b"

    const {
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      } = useSidebar()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <a href= "/">
                    <Circle/>
                    <span>Echo</span>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
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
        <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {
                        projects.map((project)=>(
                            <SidebarMenuItem key={project.title}>
                                <SidebarMenuButton asChild>
                                    <a href={project.url}>
                                    <span>{project.title}</span>
                                    </a>
                                </SidebarMenuButton>
                                {/* <SidebarMenuAction></SidebarMenuAction> */}

                            </SidebarMenuItem>
                        ))
                    }
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

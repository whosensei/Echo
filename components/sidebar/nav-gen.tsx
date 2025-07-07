"use client";

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";
import { type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Union type to handle both Tabler and Lucide icons
type IconComponent = Icon | LucideIcon;

export function NavGen({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: IconComponent;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Generate</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
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
  );
}

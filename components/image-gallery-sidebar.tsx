"use client"

import * as React from "react"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface ImageItem {
  id: string
  url: string
  alt: string
}

interface ImageGallerySidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}

// Hardcoded images - replace with database call later
const sampleImages: ImageItem[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
    alt: "Mountain landscape"
  },
  {
    id: "2", 
    url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop&crop=center",
    alt: "Ocean sunset"
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop&crop=center", 
    alt: "Forest path"
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center",
    alt: "Desert dunes"
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop&crop=center",
    alt: "Lake reflection"
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&h=200&fit=crop&crop=center",
    alt: "Alpine meadow"
  },
  {
    id: "7",
    url: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=200&h=200&fit=crop&crop=center",
    alt: "Cityscape"
  },
  {
    id: "8",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&crop=center",
    alt: "Beach waves"
  }
]

// Hardcoded button categories - number will be decided later
const categoryButtons = [
  { id: "nature", label: "Nature" },
  { id: "portraits", label: "Portraits" },
  { id: "abstract", label: "Abstract" },
  { id: "vintage", label: "Vintage" }
]

export function ImageGallerySidebar({
  isOpen,
  onClose,
  onOpen
}: ImageGallerySidebarProps) {
  const [selectedCategory, setSelectedCategory] = React.useState("nature")

  return (
    <>
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpen}
          className="fixed top-4 right-4 z-50 h-10 w-10 bg-sidebar border border-sidebar-border shadow-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <IconMenu2 className="h-4 w-4" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-64 bg-sidebar border-l border-sidebar-border shadow-lg">
      <div className="flex h-full flex-col">
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between p-2">
                <span className="text-base font-semibold text-sidebar-foreground">
                  Gallery
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <IconMenu2 className="h-4 w-4" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium text-sidebar-foreground/70 mb-3">
              Categories
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-wrap gap-2 mb-1">
                {categoryButtons.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "text-xs bg-sidebar border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                      selectedCategory === category.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium text-sidebar-foreground/70 mb-1">
              {categoryButtons.find(cat => cat.id === selectedCategory)?.label || "Images"}
            </SidebarGroupLabel>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <div className="grid grid-cols-2 gap-3">
                {sampleImages.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors cursor-pointer group"
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
              
              {sampleImages.length === 0 && (
                <div className="text-center py-8 text-sidebar-foreground/50 text-sm">
                  No images available
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </div>
      )}
    </>
  )
} 
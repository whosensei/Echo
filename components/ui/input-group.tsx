"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full flex-col gap-2 rounded-xl border bg-background/50 backdrop-blur-sm p-2.5 shadow-sm transition-colors",
        className
      )}
      {...props}
    />
  )
})
InputGroup.displayName = "InputGroup"

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[36px] max-h-[200px] w-full resize-none border-0 bg-transparent px-0 py-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
InputGroupTextarea.displayName = "InputGroupTextarea"

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "block-end"
  }
>(({ className, align = "center", ...props }, ref) => {
  const alignClass = {
    start: "items-start",
    center: "items-center",
    "block-end": "items-end",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex gap-2 flex-wrap",
        alignClass[align],
        className
      )}
      {...props}
    />
  )
})
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        "shrink-0",
        className
      )}
      {...props}
    />
  )
})
InputGroupButton.displayName = "InputGroupButton"

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "flex items-center text-xs text-muted-foreground whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
})
InputGroupText.displayName = "InputGroupText"

export {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
}

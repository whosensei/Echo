import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("flex w-full flex-col gap-3", {
  variants: {
    align: {
      center: "items-center text-center",
      left: "items-start text-left",
      right: "items-end text-right",
      none: "",
    },
  },
  defaultVariants: {
    align: "center",
  },
})

interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof headingVariants> {
  asChild?: boolean
  tag?: React.ReactNode
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children?: React.ReactNode
}

function Heading({
  className,
  align,
  asChild = false,
  tag,
  title,
  subtitle,
  children,
  ...props
}: HeadingProps) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp className={cn(headingVariants({ align }), className)} {...props}>
      {tag && <HeadingTag>{tag}</HeadingTag>}
      {title && <HeadingTitle>{title}</HeadingTitle>}
      {children && <HeadingTitle>{children}</HeadingTitle>}
      {subtitle && <HeadingSubtitle>{subtitle}</HeadingSubtitle>}
    </Comp>
  )
}

interface HeadingTagProps extends React.HTMLAttributes<HTMLDivElement> {}

function HeadingTag({ className, ...props }: HeadingTagProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

interface HeadingTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean
}

function HeadingTitle({ className, asChild = false, ...props }: HeadingTitleProps) {
  const Comp = asChild ? Slot : "h2"
  return (
    <Comp
      className={cn("text-balance text-3xl font-medium leading-none tracking-[-1.44px] md:text-5xl md:tracking-[-2.16px]", className)}
      {...props}
    />
  )
}

interface HeadingSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean
}

function HeadingSubtitle({ className, asChild = false, ...props }: HeadingSubtitleProps) {
  const Comp = asChild ? Slot : "p"
  return (
    <Comp
      className={cn("max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl", className)}
      {...props}
    />
  )
}

export { Heading, HeadingTag, HeadingTitle, HeadingSubtitle }

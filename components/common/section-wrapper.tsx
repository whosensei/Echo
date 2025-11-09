import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const sectionVariants = cva("w-full py-14 md:py-[72px]", {
  variants: {
    container: {
      default: "container mx-auto px-6",
      full: "px-6",
    },
  },
  defaultVariants: {
    container: "default",
  },
})

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

export function Section({ className, container, ...props }: SectionProps) {
  return (
    <section
      className={cn(sectionVariants({ container }), "flex flex-col gap-10", className)}
      {...props}
    />
  )
}

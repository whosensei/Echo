import { type VariantProps, cva } from "class-variance-authority";
import Link, { type LinkProps } from "next/link";

export const $button = cva(
  "gap-1 font-normal shrink-0 rounded-full ring-primary focus-visible:ring-2 outline-hidden outline-0 transition-all duration-150",
  {
    variants: {
      intent: {
        primary:
          "bg-primary hover:bg-primary/90 text-primary-foreground border-primary",
        secondary:
          "bg-secondary text-foreground border-border border hover:bg-secondary/80",
        tertiary:
          "bg-foreground text-background border border-border hover:bg-foreground/90",
      },
      disabled: {
        true: "opacity-30 pointer-events-none",
      },
      onlyButton: {
        true: "rounded-xs",
      },
      iconSide: {
        left: "flex-row-reverse pl-3",
        right: "flex-row pr-3",
      },
      unstyled: {
        true: "px-0 py-0 bg-transparent border-none hover:bg-transparent hover:border-none",
      },
      size: {
        md: "inline-flex items-center justify-center px-3.5 text-sm h-8 md:px-5",
        lg: "inline-flex items-center justify-center h-9 px-5 text-sm md:text-base md:h-10",
      },
    },
  },
);

type ButtonProps<C extends keyof React.JSX.IntrinsicElements> = VariantProps<typeof $button> &
  React.JSX.IntrinsicElements[C] & {
    icon?: React.ReactNode;
    unstyled?: boolean;
  };

export const ButtonCustom = ({
  children,
  intent = "primary",
  disabled = false,
  onlyButton = false,
  icon,
  iconSide = "left",
  unstyled,
  className,
  size = "md",
  ref,
  ...props
}: ButtonProps<"button">) => {
  return (
    <button
      ref={ref}
      className={$button(
        !unstyled
          ? {
              intent,
              disabled,
              onlyButton,
              iconSide: icon ? iconSide : undefined,
              unstyled,
              className,
              size,
            }
          : { className },
      )}
      disabled={disabled}
      {...props}
    >
      {children}
      {icon ? <span>{icon}</span> : null}
    </button>
  );
};

export const ButtonLinkCustom = ({
  children,
  intent = "primary",
  disabled = false,
  onlyButton = false,
  icon,
  iconSide = "left",
  unstyled,
  className,
  size = "md",
  ref,
  ...props
}: ButtonProps<"a"> & LinkProps) => {
  return (
    <Link
      ref={ref}
      className={$button(
        !unstyled
          ? {
              intent,
              disabled,
              onlyButton,
              iconSide: icon ? iconSide : undefined,
              unstyled,
              className,
              size,
            }
          : { className },
      )}
      {...props}
    >
      {children}
      {icon ? <span>{icon}</span> : null}
    </Link>
  );
};

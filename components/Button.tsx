import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "muted";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize | "xs";
  fullWidth?: boolean;
  className?: string;
  prefetch?: boolean;
  linkBehavior?: "router" | "anchor";
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-primary bg-primary text-white shadow-[0_10px_22px_-16px_rgba(31,122,83,0.55)] hover:bg-primary-hover focus:ring-primary/30",
  secondary:
    "border border-primary-border bg-primary-soft text-ink shadow-[0_10px_24px_-22px_rgba(17,32,24,0.16)] hover:border-primary/26 hover:bg-primary-soft hover:text-primary focus:ring-primary/15",
  tertiary:
    "border border-transparent bg-transparent text-ink shadow-none hover:bg-primary-soft/75 hover:text-primary focus:ring-primary/12",
  muted:
    "border border-transparent bg-primary-soft text-primary hover:bg-primary-soft/88 focus:ring-primary/15",
};

const sizeClasses: Record<ButtonSize | "xs", string> = {
  xs: "min-h-8 px-2.5 py-1 text-[11px]",
  sm: "min-h-8.5 px-3 py-1.5 text-xs",
  md: "min-h-9 px-3 py-1.5 text-sm",
  lg: "min-h-10 px-4 py-2 text-sm sm:px-5 sm:py-2.5",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  prefetch,
  linkBehavior = "router",
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas",
    "disabled:cursor-not-allowed disabled:opacity-60",
    buttonProps.disabled ? "pointer-events-none opacity-60" : "",
    fullWidth ? "w-full" : "",
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    if (linkBehavior === "anchor") {
      return (
        <a href={href} className={classes} {...(buttonProps as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} prefetch={prefetch} className={classes} {...(buttonProps as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "muted";
type ButtonSize = "md" | "lg";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-primary bg-primary text-white shadow-[0_16px_32px_-18px_rgba(31,122,83,0.6)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_22px_40px_-18px_rgba(31,122,83,0.52)] focus:ring-primary/30",
  secondary:
    "border border-primary-border bg-primary-soft text-ink shadow-[0_10px_24px_-22px_rgba(17,32,24,0.16)] hover:-translate-y-0.5 hover:border-primary/26 hover:bg-primary-soft hover:text-primary focus:ring-primary/15",
  tertiary:
    "border border-transparent bg-transparent text-ink shadow-none hover:bg-primary-soft/75 hover:text-primary focus:ring-primary/12",
  muted:
    "border border-transparent bg-primary-soft text-primary hover:bg-primary-soft/88 hover:-translate-y-0.5 focus:ring-primary/15",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm sm:px-6 sm:py-3.5",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-2xl font-semibold",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas",
    "disabled:cursor-not-allowed disabled:opacity-60",
    fullWidth ? "w-full" : "",
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
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
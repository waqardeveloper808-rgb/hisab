import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[1rem] border border-line bg-surface p-3 shadow-[0_12px_24px_-24px_rgba(17,32,24,0.14)]",
        "backdrop-blur-[2px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
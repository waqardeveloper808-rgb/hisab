import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_18px_45px_-34px_rgba(17,32,24,0.18)]",
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
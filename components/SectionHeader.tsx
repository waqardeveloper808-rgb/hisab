import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  titleAs?: "h1" | "h2";
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  titleAs = "h1",
  action,
  className = "",
}: SectionHeaderProps) {
  const isCentered = align === "center";
  const TitleTag = titleAs;

  return (
    <div
      className={[
        isCentered ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
        {eyebrow}
      </p>
      <TitleTag className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </TitleTag>
      <p className="mt-4 text-base leading-7 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
  className?: string;
  label?: string;
};

export function BrandMark({
  compact = false,
  href = "/",
  className = "",
  label = "Gulf Hisab home",
}: BrandMarkProps) {
  const content = (
    <div className={["flex items-center gap-3.5 overflow-visible", className].filter(Boolean).join(" ")}>
      {compact ? (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-white shadow-[0_16px_30px_-18px_rgba(31,122,83,0.22)] ring-1 ring-[#dce8df]">
          <Image src="/icon.svg" alt="Gulf Hisab icon" width={32} height={32} className="size-8" />
        </span>
      ) : (
        <Image
          src="/gulf-hisab-wordmark.svg"
          alt="Gulf Hisab"
          width={228}
          height={44}
          className="h-11 w-[228px] max-w-full shrink-0"
        />
      )}
    </div>
  );

  return (
    <Link href={href} aria-label={label} title={label} className="rounded-2xl pr-2">
      <span className="sr-only">{label}</span>
      {content}
    </Link>
  );
}
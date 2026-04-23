import Image from "next/image";
import Link from "next/link";

const WEBSITE_PRIMARY_SRC = "/branding/gulf-hisab-main-logo.png";
const WEBSITE_COMPACT_SRC = "/branding/gulf-hisab-compact-logo.svg";

type BrandMarkProps = {
  variant?: "primary" | "compact";
  href?: string;
  className?: string;
  label?: string;
};

export function BrandMark({
  variant = "primary",
  href = "/",
  className = "",
  label = "Gulf Hisab home",
}: BrandMarkProps) {
  const content = (
    <div className={["flex items-center gap-3.5 overflow-visible", className].filter(Boolean).join(" ")}>
      {variant === "compact" ? (
        <span className="flex min-h-14 w-full shrink-0 items-start justify-center overflow-visible pt-1">
          <Image src={WEBSITE_COMPACT_SRC} alt="Gulf Hisab compact logo" width={46} height={46} className="size-[46px] object-contain" />
        </span>
      ) : (
        <Image
          src={WEBSITE_PRIMARY_SRC}
          alt="Gulf Hisab"
          width={236}
          height={56}
          className="h-9 w-auto max-w-full shrink-0 object-contain md:h-10"
        />
      )}
    </div>
  );

  return (
    <Link href={href} aria-label={label} title={label} className={variant === "compact" ? "block w-full rounded-2xl py-2" : "rounded-2xl pr-2"}>
      <span className="sr-only">{label}</span>
      {content}
    </Link>
  );
}
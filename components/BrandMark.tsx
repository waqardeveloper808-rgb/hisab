import Image from "next/image";
import Link from "next/link";
import { appName, iconLogoPath, mainLogoPath } from "@/lib/brand";

type BrandMarkProps = {
  variant?: "primary" | "compact";
  href?: string;
  className?: string;
  label?: string;
  imageClassName?: string;
};

export function BrandMark({
  variant = "primary",
  href = "/",
  className = "",
  label = `${appName} home`,
  imageClassName = "",
}: BrandMarkProps) {
  const content = (
    <div className={["flex items-center gap-3.5 overflow-visible", className].filter(Boolean).join(" ")}>
      {variant === "compact" ? (
        <span className="flex min-h-12 w-full shrink-0 items-center justify-center overflow-visible">
          <Image src={iconLogoPath} alt={`${appName} icon`} width={42} height={42} className={["size-[42px] object-contain", imageClassName].filter(Boolean).join(" ")} />
        </span>
      ) : (
        <Image
          src={mainLogoPath}
          alt={appName}
          width={320}
          height={96}
          className={["h-10 w-auto max-w-full shrink-0 object-contain md:h-11", imageClassName].filter(Boolean).join(" ")}
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
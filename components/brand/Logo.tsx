import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The source logo files have a lot of transparent margin baked in
 * (see public/ashwinLogo.png) so a plain object-contain <img> renders
 * tiny and inconsistent depending on the box it's placed in. This
 * crops in on the wordmark instead: a fixed-aspect box + object-cover
 * fills the box with the logo and lets overflow-hidden trim the
 * excess margin — same crop ratio everywhere the logo appears.
 */
export function Logo({
  variant = "dark",
  marathi = false,
  contain = false,
  className,
}: {
  variant?: "dark" | "light";
  marathi?: boolean;
  /** Show the whole image (stacked logo) instead of cropping it to a wide strip. */
  contain?: boolean;
  className?: string;
}) {
  // /ashwinLogoMarathi.png doesn't exist in public/ — render the wordmark as
  // text instead of requesting a 404 image (which broke hydration).
  if (marathi) {
    return (
      <span className={cn("block text-right font-serif text-2xl leading-none text-[#111111]", className)}>
        अश्विन
      </span>
    );
  }

  return (
    <div className={cn("relative aspect-[4/1] overflow-hidden shrink-0", className)}>
      <Image
        src="/ashwinLogo.png"
        alt="Ashwin"
        fill
        priority
        className={cn(contain ? "object-contain" : "object-cover", variant === "light" && "brightness-0 invert")}
      />
    </div>
  );
}

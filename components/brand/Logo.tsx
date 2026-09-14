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
  className,
}: {
  variant?: "dark" | "light";
  marathi?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-[4/1] overflow-hidden shrink-0", className)}>
      <Image
        src={marathi ? "/ashwinLogoMarathi.png" : "/ashwinLogo.png"}
        alt={marathi ? "अश्विन" : "Ashwin"}
        fill
        priority
        className={cn("object-cover", variant === "light" && "brightness-0 invert")}
      />
    </div>
  );
}

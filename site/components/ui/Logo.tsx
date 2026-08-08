"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  /** orange/white = full wordmark; mark = square infinity monogram (admin mobile, favicons). */
  variant?: "orange" | "white" | "mark";
}

const ONE_AND_ONLY_LOGO_SRC: Record<NonNullable<LogoProps["variant"]>, string> = {
  /** Full wordmark (orange) under brand/logos */
  orange: "/assets/marketing/brand/logos/logo-sharp.png",
  /** Full wordmark (white) for dark headers */
  white: "/assets/marketing/brand/logos/logo-sharp-white.png",
  /** Square monogram mark */
  mark: "/assets/marketing/brand/logos/OneandOnlySmall-LogoHS.png",
};

const LOGO_DIMENSIONS: Record<
  NonNullable<LogoProps["variant"]>,
  { width: number; height: number }
> = {
  orange: { width: 1024, height: 263 },
  white: { width: 1024, height: 263 },
  mark: { width: 192, height: 192 },
};

export function OneAndOnlyLogo({ className, variant = "orange" }: LogoProps) {
  const dims = LOGO_DIMENSIONS[variant];
  const alt =
    variant === "mark" ? "One&Only" : "One&Only Furniture";

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src={ONE_AND_ONLY_LOGO_SRC[variant]}
        alt={alt}
        width={dims.width}
        height={dims.height}
        priority
        sizes={
          variant === "mark"
            ? "2.5rem"
            : "(max-width: 768px) 9.375rem, 15rem"
        }
        unoptimized
        className="h-full w-auto object-contain"
      />
    </div>
  );
}

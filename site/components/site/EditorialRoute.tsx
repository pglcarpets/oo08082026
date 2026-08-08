import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

type EditorialHeroProps = {
  lead: string;
  accent: string;
};

export function EditorialHero({ lead, accent }: EditorialHeroProps) {
  return (
    <section className="border-b border-theme-soft bg-[var(--surface-page)] pb-12 pt-[calc(4rem+3rem)] md:pb-16 md:pt-[calc(4rem+4rem)]">
      <div className="home-shell-xl">
        <h1 className="home-heading max-w-4xl !text-[clamp(2.25rem,4vw,3.25rem)]">
          {lead} <span className="text-accent-italic">{accent}</span>
        </h1>
      </div>
    </section>
  );
}

type EditorialArrowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function EditorialArrowLink({
  href,
  children,
  className = "",
}: EditorialArrowLinkProps) {
  return (
    <Link
      href={href}
      className={`group typ-label inline-flex items-center gap-4 text-strong transition-colors hover:text-brand ${className}`.trim()}
    >
      <span>{children}</span>
      <ArrowRight
        aria-hidden="true"
        size={19}
        weight="light"
        className="text-brand transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}

type EditorialCtaProps = {
  lead: string;
  accent: string;
  href: string;
  label: string;
};

export function EditorialCta({ lead, accent, href, label }: EditorialCtaProps) {
  return (
    <section className="border-t border-theme-soft bg-page section-y text-center">
      <div className="home-shell-xl">
        <h2 className="home-heading">
          {lead} <span className="text-accent-italic">{accent}</span>
        </h2>
        <Link href={href} className="btn-primary mt-8 inline-flex">
          {label}
        </Link>
      </div>
    </section>
  );
}

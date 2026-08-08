"use client";

import { useTranslations } from "next-intl";

type CollectionsSectionHeadingProps = {
  as?: "h1" | "h2";
  className?: string;
};

/** Homepage-only collections lockup. Products uses i18n `products.categoriesTitle*`. */
export function CollectionsSectionHeading({
  as: Tag = "h2",
  className = "home-heading max-w-2xl",
}: CollectionsSectionHeadingProps) {
  const t = useTranslations("home");
  const titleLead = t("collections.titleLead");
  const titleAccent = t("collections.titleAccent");

  return (
    <Tag className={className}>
      {titleLead}
      {/* Explicit space keeps a11y/SEO from gluing "Browse"+"workspace" */}
      {" "}
      <span className="text-accent-italic">{titleAccent}</span>
    </Tag>
  );
}

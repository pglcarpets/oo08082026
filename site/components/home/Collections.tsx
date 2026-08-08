"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { CollectionsSectionHeading } from "@/components/home/CollectionsSectionHeading";
import { useFadeUp, useStaggerMotion } from "@/lib/helpers/motion";

interface CollectionItem {
  name: string;
  image: string;
  href: string;
}

export function Collections() {
  const t = useTranslations("home");
  const items = t.raw("collections.items") as CollectionItem[];
  const intro = useFadeUp();
  const stagger = useStaggerMotion();

  return (
    <section
      data-testid="home-collections"
      aria-label="Product collections"
      className="home-section--soft home-collections border-b border-theme-soft section-y-sm"
    >
      <div className="home-shell-xl">
        <motion.div className="mb-10 max-w-3xl" {...intro}>
          <CollectionsSectionHeading className="home-heading" />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger.container}
          initial={stagger.initial}
          whileInView={stagger.whileInView}
          viewport={{ once: true, amount: 0.1 }}
        >
          {items.map((item) => (
            <motion.div
              key={item.name}
              variants={stagger.item}
              className="relative aspect-[5/4] min-h-48 sm:aspect-auto sm:min-h-0 sm:h-72 lg:h-80"
            >
              <Link href={item.href} className="group home-collection-card block h-full w-full">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized
                  className="home-collection-card__media object-contain bg-soft p-2 transition-transform duration-1000 ease-out group-hover:scale-105 sm:p-2.5"
                />
                <div className="home-collection-card__overlay" aria-hidden="true" />
                <div className="home-collection-card__footer flex items-center justify-between gap-4 p-4 md:p-5">
                  <h3 className="typ-overlay-title text-inverse">{item.name}</h3>
                  <span className="home-collection-card__arrow shrink-0" aria-hidden="true">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

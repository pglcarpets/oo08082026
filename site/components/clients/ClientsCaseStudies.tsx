"use client";

import { MarketingImage } from "@/components/site/MarketingImage";

export type ClientCaseStudy = {
  id: string;
  name: string;
  location: string;
  summary: string;
  photos: string[];
};

type ClientsCaseStudiesProps = {
  clients: ClientCaseStudy[];
};

/**
 * Photography-forward case mosaic — static layout.
 * Signature motion lives on ClientsProofStrip (one beat per page).
 */
export function ClientsCaseStudies({ clients }: ClientsCaseStudiesProps) {
  return (
    <div className="clients-work">
      {clients.map((client, index) => {
        const secondaryPhotos = client.photos.slice(1, 3);
        const mosaicVariant =
          secondaryPhotos.length === 0 ? "clients-work__mosaic--solo" : "clients-work__mosaic--dual";

        return (
          <article
            key={client.id}
            className="clients-work__case portfolio-case"
            aria-labelledby={`clients-work-${client.id}`}
          >
            <div className="clients-work-caption">
              <p className="clients-work__index home-kicker text-contrast-accent" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 id={`clients-work-${client.id}`} className="clients-work__title home-heading">
                {client.name}
              </h2>
              <p className="clients-work__location typ-body text-muted">{client.location}</p>
              <p className="clients-work-caption__scope page-copy text-body">{client.summary}</p>
            </div>

            <div className={`clients-work__mosaic portfolio-case__mosaic ${mosaicVariant}`}>
              <div
                className={
                  secondaryPhotos.length > 0
                    ? "clients-work__media clients-work__media--primary portfolio-case__media"
                    : "clients-work__media clients-work__media--primary clients-work__media--primary-solo portfolio-case__media"
                }
              >
                <MarketingImage
                  src={client.photos[0]}
                  alt={`${client.name} installed workplace — primary view`}
                  sizes={secondaryPhotos.length > 0 ? "(max-width: 768px) 100vw, 58vw" : "100vw"}
                  className="portfolio-case__img object-cover"
                  priority={index === 0}
                />
              </div>
              {secondaryPhotos.map((photo, photoIndex) => (
                <div
                  key={photo}
                  className={
                    secondaryPhotos.length === 1
                      ? "clients-work__media clients-work__media--secondary clients-work__media--secondary-solo portfolio-case__media"
                      : "clients-work__media clients-work__media--secondary portfolio-case__media"
                  }
                >
                  <MarketingImage
                    src={photo}
                    alt={`${client.name} installed workplace — detail ${photoIndex + 2}`}
                    sizes="(max-width: 768px) 50vw, 42vw"
                    className="portfolio-case__img object-cover"
                  />
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

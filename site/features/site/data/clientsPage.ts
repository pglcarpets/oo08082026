/**
 * Clients page media — executed install poster (dmrc-hero under 120 KB).
 * Poster-only hero (no loop) — case studies carry photography.
 */
export const CLIENTS_HERO_IMAGE = {
  src: "/assets/marketing/clients/FranklinTempleton/franklin-templeton-office.webp",
  alt: "Franklin Templeton workspaces installed by One&Only",
} as const;

export const CLIENTS_HERO_MEDIA = {
  poster: CLIENTS_HERO_IMAGE.src,
} as const;

import React from "react";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export function MockNextImage({
  alt = "",
  src,
  priority,
  unoptimized,
  fill: _fill,
  ...rest
}: ImageProps) {
  return (
    <img
      alt={alt}
      src={typeof src === "string" ? src : undefined}
      {...rest}
      data-priority={priority ? "true" : undefined}
      data-unoptimized={unoptimized ? "true" : undefined}
    />
  );
}

export function installNextImageMock() {
  // Registered globally from tests/setup.ts via vi.mock.
}

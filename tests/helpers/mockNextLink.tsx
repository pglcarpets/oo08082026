import React from "react";

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  prefetch?: boolean | null;
  "data-testid"?: string;
};

export function MockNextLink({ children, href, prefetch: _prefetch, ...rest }: LinkProps) {
  // Prefer an explicit data-testid; ignore undefined so callers that pass
  // data-testid={optional} do not wipe the default mock attribute.
  const explicitTestId = rest["data-testid"];
  const testId =
    typeof explicitTestId === "string" && explicitTestId.length > 0
      ? explicitTestId
      : "next-link";
  return (
    <a href={href} {...rest} data-testid={testId}>
      {children}
    </a>
  );
}

export function installNextLinkMock() {
  // Registered globally from tests/setup.ts via vi.mock.
}

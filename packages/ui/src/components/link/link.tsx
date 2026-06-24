import type { LinkProps as NextLinkProps } from "next/link";
import NextLink from "next/link";
import type { AnchorHTMLAttributes, MouseEventHandler, PropsWithChildren } from "react";

export type LinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
    Pick<NextLinkProps, "href" | "as" | "replace" | "scroll" | "prefetch">
> & {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function Link({
  children,
  href,
  as,
  replace,
  scroll = false,
  prefetch,
  ...anchorProps
}: LinkProps) {
  return (
    <NextLink
      href={href}
      as={as}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
      {...anchorProps}
    >
      {children}
    </NextLink>
  );
}

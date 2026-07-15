"use client";

import BrowseLayout from "./BrowseLayout";
import { LazyMotion, m } from "framer-motion";
const loadFramerMotionFeatures = () =>
  import(/* webpackChunkName: 'lib' */ "../../lib/framer-motion-features").then(
    (mod) => mod.default
  );

interface Props {
  hasHits: boolean;
  totalHits: number;
  facets?: Record<string, Record<string, number>>;
  query: string;
  basePath?: string;
  children: React.ReactNode;
}

export default function SearchResultsLayout({
  hasHits, totalHits, facets, query, basePath = "/search", children,
}: Props) {
  if (!hasHits) {
    return <>{children}</>;
  }

  return (
    <LazyMotion features={loadFramerMotionFeatures} strict={true}>
      <m.main
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0 },
        }}
      >
        <BrowseLayout totalHits={totalHits} facets={facets} query={query} basePath={basePath}>
          {children}
        </BrowseLayout>
      </m.main>
    </LazyMotion>
  );
}

import SortViewBar from "./SortViewBar";
import MobileFilterDrawer from "./MobileFilterDrawer";

interface Props {
  total: number;
  query?: string;
  facets?: Record<string, Record<string, number>>;
  basePath?: string;
}

export default function SearchControls({ total, query, facets, basePath = "/search" }: Props) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {/* Filter button — mobile/tablet only (desktop uses sidebar) */}
      <MobileFilterDrawer facets={facets} total={total} basePath={basePath} />
      {/* Sort controls — takes remaining space */}
      <SortViewBar total={total} query={query} basePath={basePath} />
    </div>
  );
}

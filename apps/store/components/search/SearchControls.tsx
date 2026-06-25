import SortViewBar from "./SortViewBar";
import MobileFilterDrawer from "./MobileFilterDrawer";

interface Props {
  total: number;
  query?: string;
  facets?: Record<string, Record<string, number>>;
  basePath?: string;
  /** Desktop sidebar open state (SearchResultsLayout) */
  filtersOpen?: boolean;
  /** Desktop sidebar toggle (SearchResultsLayout) */
  onToggleFilters?: () => void;
}

export default function SearchControls({
  total, query, facets, basePath = "/search", filtersOpen, onToggleFilters,
}: Props) {
  return (
    <div className="flex items-center gap-2 pb-5 border-b border-b-gray-400">
      {/* Filter button — mobile/tablet only; desktop uses sidebar toggle in SortViewBar */}
      <MobileFilterDrawer facets={facets} total={total} basePath={basePath} />
      <SortViewBar
        total={total}
        query={query}
        basePath={basePath}
        filtersOpen={filtersOpen}
        onToggleFilters={onToggleFilters}
      />
    </div>
  );
}

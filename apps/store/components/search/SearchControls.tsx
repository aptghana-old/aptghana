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
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <MobileFilterDrawer facets={facets} total={total} basePath={basePath} />
      <div className="flex-1 min-w-0">
        <SortViewBar total={total} query={query} basePath={basePath} />
      </div>
    </div>
  );
}

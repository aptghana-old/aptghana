"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ListIcon as ListViewIcon,
  Grid2X2Icon as GridViewIcon,
  SortAscIcon,
} from "lucide-react";
import classNames from "classnames";
import { Button, IconLabel, Select } from "@apt/ui";

interface Props {
  total: number;
  query?: string;
  basePath?: string;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A–Z" },
];

const PER_OPTIONS = [ 12, 24, 48 ];

export default function SortViewBar({ total, query, basePath = "/search" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "relevance";
  const currentView = searchParams.get("view") ?? "grid";
  const currentPer = searchParams.get("per") ?? "24";
  const currentSortOption = SORT_OPTIONS.find((opt) => opt.value === currentSort) ?? SORT_OPTIONS[ 0 ];

  function push(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">

      {/* Result count — hidden on mobile (mobile count lives next to the filter button) */}
      <p className="hidden sm:block text-sm shrink-0" style={{ color: "var(--text-3)" }}>
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>
          {total.toLocaleString()}
        </span>
        {query
          ? <> for <span className="font-medium">&ldquo;{query}&rdquo;</span></>
          : " products"
        }
      </p>

      <div className="hidden sm:block flex-1" />

      {/* Per-page selector — sm+ only */}
      <Select
        options={PER_OPTIONS.map((n) => ({ value: String(n), label: String(n) + " per page" }))}
        currentOption={{ value: currentPer, label: currentPer + " per page" }}
        onChange={(e) => push("per", String(e.value))}
        className="border rounded-sm px-2 py-1"
      />

      {/* Sort — flex-1 on mobile so it fills available width, fixed width on sm+ */}
      <Select
        options={SORT_OPTIONS}
        currentOption={currentSortOption}
        prefix={
          <IconLabel
            icon={SortAscIcon}
            label="Sort:"
            labelPosition="right"
            classNameLabel="label-regular"
            classNameIcon="w-4 h-4"
          />
        }
        onChange={(e) => push("sort", e.value)}
        aria-label="Sort products"
      />

      <div className="hidden sm:flex items-center gap-1 ">
        <div className="lg:small-bold">Display</div>

        <Button
          title="View products as a grid"
          aria-label="Grid view"
          aria-pressed={currentView === "grid"}
          disabled={currentView === "grid"}
          className={classNames("px-1 lg:p-0 hover:cursor-pointer", {
            "text-[#5468ff]!": currentView === "grid",
          })}
          onClick={() => push("view", "grid")}
        >
          <GridViewIcon className="w-6 h-6" />
        </Button>
        <Button
          title="View products as a list"
          aria-label="List view"
          aria-pressed={currentView === "list"}
          disabled={currentView === "list"}
          className={classNames("px-1 lg:p-0 hover:cursor-pointer", {
            "text-[#5468ff]!": currentView === "list",
          })}
          onClick={() => push("view", "list")}
        >
          <ListViewIcon className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

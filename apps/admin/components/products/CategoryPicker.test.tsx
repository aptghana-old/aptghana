import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryPicker, {
  clearDescendants,
  type CategoryNode,
} from "./CategoryPicker";

// ─── Fixture hierarchy ──────────────────────────────────────────────────────
//
// Electrical Solutions (g1)
//   └ Circuit Breakers (c1)
//       └ Acti9 Circuit Protection (s1)
//           └ Acti9 iC60 (r1)
//   └ Switchgear (c2)
//       └ LV Switchgear (s2)            (no ranges)

const GROUP: CategoryNode = { id: "g1", name: "Electrical Solutions", slug: "electrical-solutions", level: "group" };
const CATEGORY: CategoryNode = { id: "c1", name: "Circuit Breakers", slug: "circuit-breakers", level: "category" };
const CATEGORY_2: CategoryNode = { id: "c2", name: "Switchgear", slug: "switchgear", level: "category" };
const SUBCATEGORY: CategoryNode = { id: "s1", name: "Acti9 Circuit Protection", slug: "acti9-circuit-protection", level: "subcategory" };
const SUBCATEGORY_2: CategoryNode = { id: "s2", name: "LV Switchgear", slug: "lv-switchgear", level: "subcategory" };
const RANGE: CategoryNode = { id: "r1", name: "Acti9 iC60", slug: "acti9-ic60", level: "range" };

const CHILDREN: Record<string, CategoryNode[]> = {
  root: [GROUP],
  g1: [CATEGORY, CATEGORY_2],
  c1: [SUBCATEGORY],
  c2: [SUBCATEGORY_2],
  s1: [RANGE],
  s2: [],
};

const CHAINS: Record<string, Record<string, CategoryNode>> = {
  g1: { group: GROUP },
  c1: { group: GROUP, category: CATEGORY },
  c2: { group: GROUP, category: CATEGORY_2 },
  s1: { group: GROUP, category: CATEGORY, subcategory: SUBCATEGORY },
  s2: { group: GROUP, category: CATEGORY_2, subcategory: SUBCATEGORY_2 },
  r1: { group: GROUP, category: CATEGORY, subcategory: SUBCATEGORY, range: RANGE },
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function installFetchMock() {
  const fetchMock = vi.fn((input: string) => {
    const url = new URL(input, "http://localhost");

    if (url.pathname === "/api/categories/children") {
      const parentId = url.searchParams.get("parentId");
      return jsonResponse({ children: CHILDREN[parentId ?? "root"] ?? [] });
    }

    if (url.pathname === "/api/categories/search") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      if (!q) return jsonResponse({ results: [] });
      const results = Object.entries(CHAINS)
        .filter(([id]) => {
          const node = CHAINS[id][Object.keys(CHAINS[id]).pop()!];
          return node?.name.toLowerCase().includes(q);
        })
        .map(([id, chain]) => {
          const levels = ["group", "category", "subcategory", "range"] as const;
          const ordered = levels.map((l) => chain[l]).filter(Boolean) as CategoryNode[];
          const leaf = ordered[ordered.length - 1];
          return { ...leaf, id, breadcrumb: ordered.slice(0, -1).map((n) => ({ name: n.name, slug: n.slug })) };
        });
      return jsonResponse({ results });
    }

    const chainMatch = url.pathname.match(/^\/api\/categories\/([^/]+)\/chain$/);
    if (chainMatch) {
      const id = chainMatch[1];
      const chain = CHAINS[id];
      if (!chain) return jsonResponse({ error: "not found" }, 404);
      return jsonResponse(chain);
    }

    return jsonResponse({ error: "unhandled in test" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function getSelect(level: "Group" | "Category" | "Subcategory" | "Range") {
  return screen.getByRole("combobox", { name: level }) as HTMLSelectElement;
}

beforeEach(() => {
  installFetchMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clearDescendants", () => {
  const full = { group: GROUP, category: CATEGORY, subcategory: SUBCATEGORY, range: RANGE };

  it("keeps the level itself and all ancestors", () => {
    expect(clearDescendants(full, "subcategory")).toEqual({
      group: GROUP, category: CATEGORY, subcategory: SUBCATEGORY,
    });
  });

  it("removes everything below the given level", () => {
    expect(clearDescendants(full, "category")).toEqual({ group: GROUP, category: CATEGORY });
  });

  it("preserves the whole chain when clearing at the deepest level", () => {
    expect(clearDescendants(full, "range")).toEqual(full);
  });

  it("never invents an ancestor that wasn't already selected", () => {
    expect(clearDescendants({ group: GROUP }, "subcategory")).toEqual({ group: GROUP });
  });
});

describe("CategoryPicker — cascading selection", () => {
  it("walks Group → Category → Subcategory → Range, keeping every ancestor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryPicker value={null} onChange={onChange} />);

    await waitFor(() => expect(within(getSelect("Group")).getAllByRole("option")).toHaveLength(2));
    await user.selectOptions(getSelect("Group"), "g1");
    expect(getSelect("Group").value).toBe("g1");

    await waitFor(() => expect(within(getSelect("Category")).getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(getSelect("Category"), "c1");
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");

    await waitFor(() => expect(within(getSelect("Subcategory")).getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(getSelect("Subcategory"), "s1");
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");
    expect(getSelect("Subcategory").value).toBe("s1");

    await waitFor(() => expect(within(getSelect("Range")).getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(getSelect("Range"), "r1");

    // Group/Category/Subcategory must all still be intact after picking Range.
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");
    expect(getSelect("Subcategory").value).toBe("s1");
    expect(getSelect("Range").value).toBe("r1");

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("r1", [GROUP, CATEGORY, SUBCATEGORY, RANGE])
    );

    // Breadcrumb shows the complete hierarchy.
    const breadcrumb = within(screen.getByTestId("catalogue-breadcrumb"));
    expect(breadcrumb.getByText("Electrical Solutions")).toBeInTheDocument();
    expect(breadcrumb.getByText("Circuit Breakers")).toBeInTheDocument();
    expect(breadcrumb.getByText("Acti9 Circuit Protection")).toBeInTheDocument();
    expect(breadcrumb.getByText("Acti9 iC60")).toBeInTheDocument();
  });

  it("changing Category after a Subcategory was selected clears Subcategory and Range, keeps Group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryPicker value="s1" onChange={onChange} />);

    // Initialized from an existing value: full chain up to Subcategory present.
    await waitFor(() => expect(getSelect("Subcategory").value).toBe("s1"));
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");

    await waitFor(() => expect(within(getSelect("Category")).getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(getSelect("Category"), "c2");

    // Group preserved; Category updated; Subcategory/Range cleared.
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c2");
    expect(getSelect("Subcategory").value).toBe("");

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("c2", [GROUP, CATEGORY_2])
    );
  });

  it("changing Subcategory after a Range was selected clears Range, keeps Group and Category", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryPicker value="r1" onChange={onChange} />);

    await waitFor(() => expect(getSelect("Range").value).toBe("r1"));
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");
    expect(getSelect("Subcategory").value).toBe("s1");

    // Switch the Subcategory's parent Category first so a *different* Subcategory list loads,
    // then pick within it — Range from the old branch must not survive.
    await waitFor(() => expect(within(getSelect("Category")).getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(getSelect("Category"), "c2");

    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c2");
    expect(getSelect("Subcategory").value).toBe("");
    expect(getSelect("Range").value).toBe("");

    await waitFor(() => expect(within(getSelect("Subcategory")).getAllByRole("option").length).toBeGreaterThan(1));
    await user.selectOptions(getSelect("Subcategory"), "s2");

    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c2");
    expect(getSelect("Subcategory").value).toBe("s2");

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("s2", [GROUP, CATEGORY_2, SUBCATEGORY_2])
    );
  });
});

describe("CategoryPicker — search selection", () => {
  it("picking a deep search result back-fills every ancestor level", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CategoryPicker value={null} onChange={onChange} />);

    await waitFor(() => expect(within(getSelect("Group")).getAllByRole("option")).toHaveLength(2));

    await user.type(screen.getByRole("textbox", { name: /search catalogue hierarchy/i }), "iC60");

    const result = await screen.findByText("Acti9 iC60");
    await user.click(result);

    await waitFor(() => expect(getSelect("Range").value).toBe("r1"));
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");
    expect(getSelect("Subcategory").value).toBe("s1");

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("r1", [GROUP, CATEGORY, SUBCATEGORY, RANGE])
    );
  });
});

describe("CategoryPicker — initialization from an existing value", () => {
  it("resolves the full chain for a deep leaf id on mount", async () => {
    const onChange = vi.fn();
    render(<CategoryPicker value="r1" onChange={onChange} />);

    await waitFor(() => expect(getSelect("Range").value).toBe("r1"));
    expect(getSelect("Group").value).toBe("g1");
    expect(getSelect("Category").value).toBe("c1");
    expect(getSelect("Subcategory").value).toBe("s1");
  });

  it("resolves a shallow Group-only assignment without inventing descendants", async () => {
    const onChange = vi.fn();
    render(<CategoryPicker value="g1" onChange={onChange} />);

    await waitFor(() => expect(getSelect("Group").value).toBe("g1"));
    expect(getSelect("Category").value).toBe("");
    expect(getSelect("Subcategory").value).toBe("");

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("g1", [GROUP]));
  });
});

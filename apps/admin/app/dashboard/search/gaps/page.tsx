import type { Metadata } from "next";
import Link from "next/link";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Plus, FolderPlus, BookOpen } from "lucide-react";
import { resolveRange, formatPercent } from "@/lib/analytics/range";
import { Panel, EmptyState } from "@/components/analytics/primitives";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { auth } from "@/lib/auth";
import {
  getZeroResultSearches, getLowResultSearches, getHighDemandMissingProducts,
  getSynonymOpportunities, getMisspellings, getCatalogueCoverage, getContentOpportunities,
} from "@/lib/searchGapService";
import type { AnalyticsFilters } from "@/lib/searchAnalyticsService";
import SynonymApproveButton from "@/components/search/SynonymApproveButton";

export const metadata: Metadata = { title: "Search Gaps" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ range?: string }>;
}

const RANGES = [{ label: "7d", value: "7d" }, { label: "30d", value: "30d" }, { label: "90d", value: "90d" }];

export default async function SearchGapsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const r = resolveRange(sp.range);
  const filters: AnalyticsFilters = { from: r.from, to: r.to };

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "search:edit");

  const [zeroResults, lowResults, opportunities, synonyms, misspellings, coverage, contentOpportunities] = await Promise.all([
    getZeroResultSearches(filters, { pageSize: 50 }),
    getLowResultSearches(filters, { pageSize: 50 }),
    getHighDemandMissingProducts(filters, 20),
    getSynonymOpportunities(filters),
    getMisspellings(filters, 20),
    getCatalogueCoverage(filters),
    getContentOpportunities(filters, 20),
  ]);

  return (
    <div>
      <PageHeader
        title="Search Gaps"
        description="Missing catalogue content and search opportunities, derived from real search telemetry."
      />

      <div className="flex items-center gap-2 px-6 py-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
          {RANGES.map((rg) => (
            <Link key={rg.value} href={`?range=${rg.value}`} className="px-2.5 py-1 text-xs font-medium" style={{ color: r.key === rg.value ? "var(--apt-text-primary)" : "var(--apt-text-muted)" }}>
              {rg.label}
            </Link>
          ))}
        </div>
        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>last {r.label}</span>
      </div>

      <div className="p-4 sm:p-6">
        <Tabs defaultValue="zero">
          <TabList className="mb-5 overflow-x-auto">
            <Tab value="zero">Zero Results ({zeroResults.total})</Tab>
            <Tab value="low">Low Results ({lowResults.total})</Tab>
            <Tab value="opportunities">High Demand ({opportunities.length})</Tab>
            <Tab value="synonyms">Synonyms ({synonyms.length})</Tab>
            <Tab value="misspellings">Misspellings ({misspellings.length})</Tab>
            <Tab value="coverage">Catalogue Coverage</Tab>
            <Tab value="content">Content Opportunities ({contentOpportunities.length})</Tab>
          </TabList>

          {/* Zero results */}
          <TabPanel value="zero">
            <Panel title="Zero-result searches" subtitle="Queries that never returned a single product">
              {zeroResults.rows.length === 0 ? (
                <EmptyState message="No zero-result searches in this period." />
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                        <th className="pb-2 pr-3">Query</th><th className="pb-2 text-right">Search Count</th><th className="pb-2">Last Searched</th><th className="pb-2">Suggested Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zeroResults.rows.map((row) => (
                        <tr key={row.query} style={{ borderTop: "1px solid var(--apt-border)" }}>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{row.query}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{row.searchCount}</td>
                          <td className="py-2.5 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(row.lastSearched).toLocaleDateString("en-GH")}</td>
                          <td className="py-2.5">
                            {canEdit ? (
                              <div className="flex items-center gap-1.5">
                                <Link href={`/dashboard/products/new?name=${encodeURIComponent(row.query)}`}>
                                  <Button variant="ghost" size="xs" icon={<Plus size={11} />}>Product</Button>
                                </Link>
                                <Link href={`/dashboard/categories/new?name=${encodeURIComponent(row.query)}`}>
                                  <Button variant="ghost" size="xs" icon={<FolderPlus size={11} />}>Category</Button>
                                </Link>
                                <a href={`/dashboard/search/settings?index=products`}>
                                  <Button variant="ghost" size="xs" icon={<BookOpen size={11} />}>Synonym</Button>
                                </a>
                              </div>
                            ) : <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabPanel>

          {/* Low results */}
          <TabPanel value="low">
            <Panel title="Low-result searches" subtitle="Queries averaging 1–3 results">
              {lowResults.rows.length === 0 ? (
                <EmptyState message="No low-result searches in this period." />
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                        <th className="pb-2 pr-3">Query</th><th className="pb-2 text-right">Search Count</th><th className="pb-2 text-right">Avg. Results</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowResults.rows.map((row) => (
                        <tr key={row.query} style={{ borderTop: "1px solid var(--apt-border)" }}>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{row.query}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{row.searchCount}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{row.avgResults}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabPanel>

          {/* High demand missing products */}
          <TabPanel value="opportunities">
            <Panel title="High-demand missing products" subtitle="Opportunity Score = Search Volume × Zero-Result Rate">
              {opportunities.length === 0 ? (
                <EmptyState message="No high-opportunity gaps detected." />
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                        <th className="pb-2 pr-3">Query</th><th className="pb-2 text-right">Volume</th><th className="pb-2 text-right">Zero-Result Rate</th><th className="pb-2 text-right">Opportunity Score</th><th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((row) => (
                        <tr key={row.query} style={{ borderTop: "1px solid var(--apt-border)" }}>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{row.query}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{row.searchCount}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{formatPercent(row.zeroResultRate)}</td>
                          <td className="py-2.5 text-right tabular-nums font-semibold" style={{ color: "#dc2626" }}>{row.opportunityScore}</td>
                          <td className="py-2.5">
                            {canEdit && (
                              <Link href={`/dashboard/products/new?name=${encodeURIComponent(row.query)}`}>
                                <Button variant="ghost" size="xs" icon={<Plus size={11} />}>Create</Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabPanel>

          {/* Synonyms */}
          <TabPanel value="synonyms">
            <Panel title="Synonym opportunities" subtitle="Detected from real query volume against known industry term pairs">
              {synonyms.length === 0 ? (
                <EmptyState message="No synonym opportunities detected yet." />
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                        <th className="pb-2 pr-3">Search Term</th><th className="pb-2 pr-3">Suggested Synonym</th><th className="pb-2 text-right">Search Volume</th><th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {synonyms.map((s) => (
                        <tr key={s.term} style={{ borderTop: "1px solid var(--apt-border)" }}>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{s.term}</td>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{s.suggestedSynonym}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{s.searchVolume}</td>
                          <td className="py-2.5">
                            {s.alreadyApplied ? (
                              <span className="text-[12px]" style={{ color: "#15803d" }}>Applied</span>
                            ) : canEdit ? (
                              <SynonymApproveButton term={s.term} synonym={s.suggestedSynonym} />
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabPanel>

          {/* Misspellings */}
          <TabPanel value="misspellings">
            <Panel title="Likely misspellings" subtitle="Low-result queries within edit-distance 2 of a real brand name">
              {misspellings.length === 0 ? (
                <EmptyState message="No likely misspellings detected." />
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                        <th className="pb-2 pr-3">Incorrect Query</th><th className="pb-2 pr-3">Suggested Query</th><th className="pb-2 text-right">Search Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misspellings.map((m) => (
                        <tr key={m.query} style={{ borderTop: "1px solid var(--apt-border)" }}>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "#dc2626" }}>{m.query}</td>
                          <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "#15803d" }}>{m.suggestedQuery}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{m.searchVolume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabPanel>

          {/* Catalogue coverage */}
          <TabPanel value="coverage">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {coverage.map((m) => (
                <div key={m.label} className="card p-5">
                  <p className="text-[24px] font-bold mb-1" style={{ color: "var(--apt-text-primary)" }}>{m.value != null ? formatPercent(m.value) : "—"}</p>
                  <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{m.label}</p>
                </div>
              ))}
            </div>
            {coverage.every((m) => m.value == null) && (
              <div className="card mt-4"><EmptyState message="No searches with results telemetry yet — coverage appears once results-count tracking accumulates data." /></div>
            )}
          </TabPanel>

          {/* Content opportunities */}
          <TabPanel value="content">
            <Panel title="Content opportunities" subtitle="Real search demand against thin catalogue branches">
              {contentOpportunities.length === 0 ? (
                <EmptyState message="No content opportunities detected." />
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                        <th className="pb-2 pr-3">Group</th><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Subcategory</th><th className="pb-2 text-right">Searches</th><th className="pb-2 text-right">Products</th><th className="pb-2 text-right">Opportunity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentOpportunities.map((c, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--apt-border)" }}>
                          <td className="py-2.5 pr-3 text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{c.group ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{c.category ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{c.subcategory ?? "—"}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{c.searches}</td>
                          <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{c.productCount}</td>
                          <td className="py-2.5 text-right tabular-nums font-semibold" style={{ color: "#dc2626" }}>{c.opportunityScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

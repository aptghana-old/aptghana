import type { Metadata } from "next";
import { Navigation, GripVertical, Plus, ChevronRight } from "lucide-react";
import { SITE_DOMAIN, STORE_DOMAIN } from "@apt/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Navigation Builder" };

const NAV_TREES = [
  {
    id: "corporate", label: "Corporate Navigation", description: `${SITE_DOMAIN} top navigation`,
    items: [ "Solutions", "Industries", "About", "Resources", "Contact" ],
  },
  {
    id: "store", label: "Store Navigation", description: `${STORE_DOMAIN} header`,
    items: [ "Products", "Brands", "Categories", "Deals" ],
  },
  {
    id: "footer", label: "Footer", description: "Footer links across all sites",
    items: [ "Company", "Products", "Support", "Legal" ],
  },
];

export default function NavigationPage() {
  return (
    <div>
      <PageHeader
        title="Navigation Builder"
        description="Edit site navigation without code changes."
        actions={
          <Button variant="secondary" size="sm">Save All Changes</Button>
        }
      />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {NAV_TREES.map((nav) => (
            <div key={nav.id} className="card overflow-hidden">
              <div className="card-header">
                <div>
                  <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{nav.label}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{nav.description}</p>
                </div>
                <Button variant="ghost" size="xs" icon={<Plus size={11} />}>Add</Button>
              </div>
              <div className="p-3 space-y-1">
                {nav.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}
                  >
                    <GripVertical size={12} style={{ color: "var(--apt-text-muted)" }} className="cursor-grab" />
                    <span className="flex-1 text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{item}</span>
                    <ChevronRight size={11} style={{ color: "var(--apt-text-muted)" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <ComingSoon
            icon={<Navigation size={24} />}
            title="Drag-and-Drop Navigation Editor"
            description="Full visual editor for all site navigation structures, mega menus, and footer links. Changes publish instantly with no deployments required."
            milestones={[
              { label: "Navigation DB schema", done: false },
              { label: "Drag-and-drop reordering", done: false },
              { label: "Nested menu support", done: false },
              { label: "Mega menu builder", done: false },
              { label: "Live preview panel", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton, FormSkeleton } from "@/components/ui/Skeleton";
import { Save } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration for APT Ghana admin."
        actions={<Button variant="primary" size="sm" icon={<Save size={13} />} disabled>Save Changes</Button>}
      />
      <div className="flex">
        <div className="w-52 shrink-0 p-4 space-y-1" style={{ borderRight: "1px solid var(--apt-border)" }}>
          {[80, 70, 65, 100, 80].map((w, i) => (
            <Skeleton key={i} height={32} rounded="md" style={{ width: "100%" }} />
          ))}
        </div>
        <div className="flex-1 p-6 max-w-3xl">
          <FormSkeleton fields={6} cols={2} />
        </div>
      </div>
    </div>
  );
}

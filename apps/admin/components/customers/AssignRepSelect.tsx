"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";

interface Props {
  customerId: string;
  current?: string;
  reps: { value: string; label: string }[];
}

export default function AssignRepSelect({ customerId, current, reps }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);

  async function onChange(salesRepId: string) {
    setValue(salesRepId);
    setSaving(true);
    try {
      await fetch(`/api/customers/${customerId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesRepId: salesRepId || null }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select
      placeholder="Unassigned"
      options={reps}
      value={value}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
      className="!h-8 w-44"
    />
  );
}

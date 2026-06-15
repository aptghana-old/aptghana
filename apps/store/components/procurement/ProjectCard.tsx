"use client";

import { inputBase } from "@/components/account/ui";
import { Card } from "./icons";

interface ProjectCardProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
}

export default function ProjectCard({
  value,
  onChange,
  title = "Project Details",
  subtitle = "Tell us about the project, delivery location, timelines, or technical requirements.",
  placeholder = "e.g. Panel upgrade for a water treatment plant in Tema — delivery required by end of July. Open to equivalent alternatives for out-of-stock items.",
}: ProjectCardProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="p-5 sm:p-6">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder={placeholder}
          aria-label={title}
          className={`${inputBase} h-auto py-3 resize-y`}
        />
      </div>
    </Card>
  );
}

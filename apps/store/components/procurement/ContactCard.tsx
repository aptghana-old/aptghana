"use client";

import { FormField, inputBase } from "@/components/account/ui";
import { Card } from "./icons";

export interface ContactValues {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
  company:   string;
  country:   string;
  address:   string;
}

interface ContactCardProps {
  contact: ContactValues;
  onChange: (field: keyof ContactValues, value: string) => void;
  isAuthenticated: boolean;
}

export default function ContactCard({ contact, onChange, isAuthenticated }: ContactCardProps) {
  return (
    <Card
      title="Contact Information"
      subtitle={isAuthenticated
        ? "Prefilled from your account — review and edit before submitting."
        : "Where should we send your quotation?"}
    >
      <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
        <FormField label="First name *">
          <input required value={contact.firstName} onChange={(e) => onChange("firstName", e.target.value)}
            autoComplete="given-name" placeholder="Kwame" className={inputBase} />
        </FormField>
        <FormField label="Last name *">
          <input required value={contact.lastName} onChange={(e) => onChange("lastName", e.target.value)}
            autoComplete="family-name" placeholder="Mensah" className={inputBase} />
        </FormField>
        <FormField label="Email address *">
          <input required type="email" value={contact.email} onChange={(e) => onChange("email", e.target.value)}
            autoComplete="email" placeholder="kwame@company.com" className={inputBase} />
        </FormField>
        <FormField label="Phone number *">
          <input required type="tel" value={contact.phone} onChange={(e) => onChange("phone", e.target.value)}
            autoComplete="tel" placeholder="+233 XX XXX XXXX" className={inputBase} />
        </FormField>
        <FormField label="Company / Organisation">
          <input value={contact.company} onChange={(e) => onChange("company", e.target.value)}
            autoComplete="organization" placeholder="Acme Industries Ltd." className={inputBase} />
        </FormField>
        <FormField label="Country">
          <input value={contact.country} onChange={(e) => onChange("country", e.target.value)}
            autoComplete="country-name" placeholder="Ghana" className={inputBase} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Delivery address" hint="Optional — helps us quote accurate delivery costs.">
            <input value={contact.address} onChange={(e) => onChange("address", e.target.value)}
              autoComplete="street-address" placeholder="Street, city, region" className={inputBase} />
          </FormField>
        </div>
      </div>
    </Card>
  );
}

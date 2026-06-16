import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "Name and email are required"),
  email: z.string().trim().min(1, "Name and email are required").email("Invalid email address"),
  phone: z.string().trim().optional(),
  accountType: z.enum(["business", "personal"]).optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  status: z.string().optional(),
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = z.object({
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  accountType: z.enum(["business", "personal"]).optional(),
  businessType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  billingAddress: z.record(z.string(), z.unknown()).optional(),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
});
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const customerBulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "No customers selected").max(500, "Select at most 500 customers at a time"),
  action: z.enum(["set_status", "assign_rep", "add_tag"]),
  status: z.enum(["active", "inactive", "suspended", "pending"]).optional(),
  salesRepId: z.string().optional(),
  tag: z.string().optional(),
});
export type CustomerBulkActionInput = z.infer<typeof customerBulkActionSchema>;

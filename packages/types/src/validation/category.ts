import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  status: z.string().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional(),
  imageUrl: z.string().optional(),
  icon: z.string().optional(),
  documents: z.array(z.unknown()).optional(),
  benefits: z.array(z.unknown()).optional(),
  bulletPoints: z.array(z.unknown()).optional(),
  products: z.array(z.unknown()).optional(),
  brands: z.array(z.unknown()).optional(),
  applications: z.array(z.unknown()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

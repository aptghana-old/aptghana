import { z } from "zod";

export const articleCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().optional(),
  content: z.string().optional(),
});
export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;

export const articleUpdateSchema = z.object({
  title: z.string().trim().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  canonicalUrl: z.string().optional(),
  content: z.string().optional(),
  slug: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  featuredImage: z.unknown().optional(),
  gallery: z.unknown().optional(),
  videos: z.unknown().optional(),
  attachments: z.unknown().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  status: z.string().optional(),
  publishDate: z.string().optional(),
});
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;

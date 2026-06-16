import { Schema, model, models, type InferSchemaType } from "mongoose";

export const ARTICLE_STATUSES = ["draft", "review", "scheduled", "published", "archived"] as const;

const MediaRefSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, default: "" } },
  { _id: false }
);

const VideoEmbedSchema = new Schema(
  { url: { type: String, required: true }, title: String },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    contentType: String,
    size: Number,
  },
  { _id: false }
);

const SeoSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogImage: String,
  },
  { _id: false }
);

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" }, // sanitized HTML from the rich text editor

    status: { type: String, enum: ARTICLE_STATUSES, default: "draft", index: true },
    publishDate: { type: Date, index: true },

    authorId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    authorName: String,

    category: { type: String, trim: true, index: true },
    tags: { type: [String], default: [], index: true },
    featured: { type: Boolean, default: false, index: true },

    featuredImage: MediaRefSchema,
    gallery: { type: [MediaRefSchema], default: [] },
    videos: { type: [VideoEmbedSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },

    readingTimeMinutes: { type: Number, default: 0 },
    canonicalUrl: String,
    seo: { type: SeoSchema, default: () => ({}) },

    viewCount: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, collection: "articles_v2" }
);

ArticleSchema.index({ status: 1, createdAt: -1 });
ArticleSchema.index({ status: 1, publishDate: -1 });
ArticleSchema.index({ status: 1, updatedAt: -1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ updatedAt: -1 });
ArticleSchema.index(
  { title: "text", excerpt: "text", content: "text", slug: "text" },
  { weights: { title: 10, slug: 8, excerpt: 4, content: 1 }, name: "article_text_search" }
);

export const ArticleModel = models.Article ?? model("Article", ArticleSchema, "articles_v2");
export type ArticleDocument = InferSchemaType<typeof ArticleSchema>;

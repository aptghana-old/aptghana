import { Schema, model, models } from "mongoose";

const AssetSchema = new Schema(
  {
    key:          { type: String, required: true, unique: true },
    url:          { type: String, required: true },
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype:     { type: String, required: true },
    size:         { type: Number, required: true, min: 0 },
    width:        Number,
    height:       Number,
    duration:     Number,
    pageCount:    Number,
    folder:       { type: String, required: true, default: "uncategorized" },
    tags:         { type: [String], default: [] },
    altText:      { type: String, default: "" },
    description:  { type: String, default: "" },
    thumbnails:   {
      small:  String,
      medium: String,
      large:  String,
      _id:    false,
    },
    usedIn: {
      type: [
        {
          type:       { type: String, required: true },
          entityId:   { type: String, required: true },
          entityName: { type: String, required: true },
          field:      { type: String, required: true },
          _id:        false,
        },
      ],
      default: [],
    },
    uploadedBy:    { type: String, default: "" },
    status:        { type: String, enum: ["active", "archived", "pending"], default: "active" },
    isFavorite:    { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0 },
    viewCount:     { type: Number, default: 0 },
  },
  { timestamps: true },
);

AssetSchema.index({ folder: 1, status: 1, createdAt: -1 });
AssetSchema.index({ mimetype: 1, status: 1, createdAt: -1 });
AssetSchema.index({ tags: 1, status: 1 });
AssetSchema.index({ status: 1, createdAt: -1 });
AssetSchema.index({ isFavorite: 1, status: 1 });
AssetSchema.index({ uploadedBy: 1, status: 1 });

export interface AssetDocument {
  _id: { toString(): string } | string;
  key: string;
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  folder: string;
  tags: string[];
  altText?: string;
  description?: string;
  thumbnails?: { small?: string; medium?: string; large?: string };
  usedIn: Array<{ type: string; entityId: string; entityName: string; field: string }>;
  uploadedBy?: string;
  status: "active" | "archived" | "pending";
  isFavorite: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const AssetModel = models.Asset ?? model("Asset", AssetSchema);

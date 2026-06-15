import mongoose, { Schema, model, models } from "mongoose";
import type { MeiliSettings, SearchConfigVersion } from "@apt/types";

export type { SearchConfigVersion };

export interface SearchConfigDocument
  extends Omit<SearchConfigVersion, "_id" | "createdAt" | "updatedAt">,
    mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const TypoToleranceSchema = new Schema(
  {
    enabled:             { type: Boolean, default: true },
    minWordSizeForTypos: {
      oneTypo:  { type: Number, default: 4 },
      twoTypos: { type: Number, default: 8 },
    },
    disableOnWords:      { type: [String], default: [] },
    disableOnAttributes: { type: [String], default: [] },
  },
  { _id: false },
);

const MeiliSettingsSchema = new Schema<MeiliSettings>(
  {
    searchableAttributes: { type: [String], default: [] },
    filterableAttributes: { type: [String], default: [] },
    sortableAttributes:   { type: [String], default: [] },
    rankingRules:         { type: [String], default: [] },
    synonyms:             { type: Schema.Types.Mixed, default: {} },
    stopWords:            { type: [String], default: [] },
    distinctAttribute:    { type: String, default: null },
    typoTolerance:        { type: TypoToleranceSchema, default: () => ({}) },
    faceting:             { maxValuesPerFacet: { type: Number, default: 500 } },
    pagination:           { maxTotalHits: { type: Number, default: 10000 } },
    dictionary:           { type: [String], default: [] },
    separatorTokens:      { type: [String], default: [] },
    nonSeparatorTokens:   { type: [String], default: [] },
  },
  { _id: false },
);

const SearchConfigSchema = new Schema<SearchConfigDocument>(
  {
    index:     { type: String, required: true },
    version:   { type: Number, required: true },
    note:      { type: String, default: "" },
    isActive:  { type: Boolean, default: false, index: true },
    appliedAt: { type: Date, default: null },
    appliedBy: { type: String, default: null },
    settings:  { type: MeiliSettingsSchema, required: true },
    createdBy: { type: String, default: "system" },
  },
  { timestamps: true },
);

SearchConfigSchema.index({ index: 1, version: 1 }, { unique: true });
SearchConfigSchema.index({ index: 1, isActive: 1 });
SearchConfigSchema.index({ index: 1, createdAt: -1 });

export const SearchConfigModel = (
  models.SearchConfig as mongoose.Model<SearchConfigDocument>
) ?? model<SearchConfigDocument>("SearchConfig", SearchConfigSchema);

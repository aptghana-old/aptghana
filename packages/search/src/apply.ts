import type { MeiliSettings } from "@apt/types";
import { getMeilisearchClient } from "./client";

/**
 * Apply a full MeiliSettings object to a named Meilisearch index.
 * Synonyms are pushed via the dedicated updateSynonyms endpoint;
 * everything else goes through updateSettings.
 */
export async function applySettingsToIndex(
  indexName: string,
  settings: MeiliSettings,
): Promise<void> {
  const client = getMeilisearchClient();
  const index  = client.index(indexName);

  const { synonyms, ...rest } = settings;

  await index.updateSettings({
    searchableAttributes: rest.searchableAttributes,
    filterableAttributes: rest.filterableAttributes,
    sortableAttributes:   rest.sortableAttributes,
    rankingRules:         rest.rankingRules,
    stopWords:            rest.stopWords,
    distinctAttribute:    rest.distinctAttribute ?? undefined,
    typoTolerance:        {
      enabled:             rest.typoTolerance.enabled,
      minWordSizeForTypos: rest.typoTolerance.minWordSizeForTypos,
      ...(rest.typoTolerance.disableOnWords?.length
        ? { disableOnWords: rest.typoTolerance.disableOnWords }
        : {}),
      ...(rest.typoTolerance.disableOnAttributes?.length
        ? { disableOnAttributes: rest.typoTolerance.disableOnAttributes }
        : {}),
    },
    faceting:             rest.faceting,
    pagination:           rest.pagination,
    ...(rest.dictionary?.length      ? { dictionary:           rest.dictionary }           : {}),
    ...(rest.separatorTokens?.length ? { separatorTokens:      rest.separatorTokens }      : {}),
    ...(rest.nonSeparatorTokens?.length
      ? { nonSeparatorTokens: rest.nonSeparatorTokens }
      : {}),
  });

  await index.updateSynonyms(synonyms ?? {});
}

/**
 * Fetch the live settings from Meilisearch for a given index.
 * Returns null if the index doesn't exist or Meilisearch is unreachable.
 */
export async function getLiveSettings(indexName: string): Promise<MeiliSettings | null> {
  try {
    const client = getMeilisearchClient();
    const index  = client.index(indexName);
    const [settings, synonyms] = await Promise.all([
      index.getSettings(),
      index.getSynonyms(),
    ]);

    return {
      searchableAttributes: settings.searchableAttributes ?? [],
      filterableAttributes: settings.filterableAttributes ?? [],
      sortableAttributes:   settings.sortableAttributes   ?? [],
      rankingRules:         settings.rankingRules         ?? [],
      stopWords:            settings.stopWords            ?? [],
      distinctAttribute:    settings.distinctAttribute    ?? null,
      typoTolerance: {
        enabled: settings.typoTolerance?.enabled ?? true,
        minWordSizeForTypos: {
          oneTypo:  settings.typoTolerance?.minWordSizeForTypos?.oneTypo  ?? 4,
          twoTypos: settings.typoTolerance?.minWordSizeForTypos?.twoTypos ?? 8,
        },
        disableOnWords:      settings.typoTolerance?.disableOnWords      ?? [],
        disableOnAttributes: settings.typoTolerance?.disableOnAttributes ?? [],
      },
      faceting:            { maxValuesPerFacet: settings.faceting?.maxValuesPerFacet ?? 100 },
      pagination:          { maxTotalHits:      settings.pagination?.maxTotalHits    ?? 1000 },
      dictionary:          settings.dictionary          ?? [],
      separatorTokens:     settings.separatorTokens     ?? [],
      nonSeparatorTokens:  settings.nonSeparatorTokens  ?? [],
      synonyms: (synonyms ?? {}) as Record<string, string[]>,
    };
  } catch {
    return null;
  }
}

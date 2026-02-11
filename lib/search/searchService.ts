import { parseGlobalQuery } from "@/lib/search/queryParser";
import type {
  DomainSearchProvider,
  SearchDomain,
  SearchExecutionResult,
} from "@/lib/search/types";
import type { SearchEventBus } from "@/lib/search/eventBus";

type SearchServiceOptions = {
  providers: Record<SearchDomain, DomainSearchProvider>;
  eventBus: SearchEventBus;
  maxHits?: number;
};

export function createGlobalSearchService({
  providers,
  eventBus,
  maxHits = 24,
}: SearchServiceOptions) {
  const search = (rawQuery: string): SearchExecutionResult => {
    const startedAt = performance.now();
    const parsed = parseGlobalQuery(rawQuery);

    eventBus.publish({
      type: "query_started",
      at: Date.now(),
      query: parsed.raw,
      domains: parsed.selectedDomains,
    });

    const combined = parsed.selectedDomains.flatMap((domain) => {
      const provider = providers[domain];
      const domainHits = provider.search({ query: parsed });

      eventBus.publish({
        type: "domain_searched",
        at: Date.now(),
        domain,
        hitCount: domainHits.length,
      });

      return domainHits;
    });

    const hits = combined
      .sort((a, b) => b.score - a.score || b.at - a.at)
      .slice(0, maxHits);

    const tookMs = Math.max(1, Math.round(performance.now() - startedAt));

    eventBus.publish({
      type: "query_completed",
      at: Date.now(),
      query: parsed.raw,
      totalHits: hits.length,
      tookMs,
    });

    return {
      hits,
      tookMs,
      selectedDomains: parsed.selectedDomains,
      terms: parsed.terms,
    };
  };

  return { search };
}

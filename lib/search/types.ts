export type SearchDomain = "orders" | "activity" | "customers";

export type SearchIntent = {
  domain: SearchDomain;
  token: string;
};

export type ParsedGlobalQuery = {
  raw: string;
  terms: string[];
  intents: SearchIntent[];
  selectedDomains: SearchDomain[];
};

export type GlobalSearchHit = {
  id: string;
  domain: SearchDomain;
  title: string;
  subtitle: string;
  at: number;
  score: number;
};

export type DomainSearchContext = {
  query: ParsedGlobalQuery;
};

export type DomainSearchProvider = {
  domain: SearchDomain;
  search: (context: DomainSearchContext) => GlobalSearchHit[];
};

export type SearchTriggerEvent =
  | {
      type: "query_started";
      at: number;
      query: string;
      domains: SearchDomain[];
    }
  | {
      type: "domain_searched";
      at: number;
      domain: SearchDomain;
      hitCount: number;
    }
  | {
      type: "query_completed";
      at: number;
      query: string;
      totalHits: number;
      tookMs: number;
    };

export type SearchExecutionResult = {
  hits: GlobalSearchHit[];
  tookMs: number;
  selectedDomains: SearchDomain[];
  terms: string[];
};

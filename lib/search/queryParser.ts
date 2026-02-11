import type { ParsedGlobalQuery, SearchDomain, SearchIntent } from "@/lib/search/types";

const DOMAIN_SYNONYMS: Record<SearchDomain, string[]> = {
  orders: ["order", "orders", "payment", "payments", "checkout"],
  activity: ["activity", "activities", "event", "events", "stream", "log", "logs"],
  customers: [
    "customer",
    "customers",
    "user",
    "users",
    "buyer",
    "buyers",
    "country",
    "countries",
    "coutry",
  ],
};

const ALL_DOMAINS = Object.keys(DOMAIN_SYNONYMS) as SearchDomain[];

function normalizeToken(token: string) {
  return token.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function tokenToDomain(token: string): SearchDomain | null {
  for (const domain of ALL_DOMAINS) {
    if (DOMAIN_SYNONYMS[domain].includes(token)) {
      return domain;
    }
  }
  return null;
}

export function parseGlobalQuery(rawValue: string): ParsedGlobalQuery {
  const raw = rawValue.trim();
  const tokens = raw
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  const intents: SearchIntent[] = [];
  const terms: string[] = [];
  const selected = new Set<SearchDomain>();

  tokens.forEach((token) => {
    const domain = tokenToDomain(token);
    if (!domain) {
      terms.push(token);
      return;
    }

    if (selected.has(domain)) return;
    selected.add(domain);
    intents.push({ domain, token });
  });

  const selectedDomains = selected.size > 0 ? [...selected] : ALL_DOMAINS;

  return {
    raw,
    terms,
    intents,
    selectedDomains,
  };
}

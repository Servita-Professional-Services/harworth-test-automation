import type { APIRequestContext, APIResponse } from '@playwright/test';

export type LookupType =
  // consolidated
  | 'contact-type'
  | 'land-use'
  | 'divestment-strategy'
  | 'opportunity-source'
  | 'existing-use'
  | 'planning-status'
  | 'proposed-use'
  | 'planning-timeframe'
  | 'deal-structure'
  | 'land-unit-category'
  // direct routes
  | 'locations'
  | 'statuses'
  | 'sites'
  | 'schemes'
  | 'external-companies'
  | 'external-contacts';

export type LookupItem = {
  id: number;
  name?: string;
  display_name?: string;
  [k: string]: unknown;
};

export type LookupParams = Record<string, string | number | boolean | undefined>;

export const CONSOLIDATED_LOOKUP_TYPES: LookupType[] = [
  'contact-type',
  'land-use',
  'divestment-strategy',
  'opportunity-source',
  'existing-use',
  'planning-status',
  'proposed-use',
  'planning-timeframe',
  'deal-structure',
  'land-unit-category',
];

export const DIRECT_LOOKUP_TYPES: LookupType[] = [
  'locations',
  'statuses',
  'sites',
  'schemes',
  'external-companies',
  'external-contacts',
];

export const ALL_LOOKUP_TYPES: LookupType[] = [
  ...CONSOLIDATED_LOOKUP_TYPES,
  ...DIRECT_LOOKUP_TYPES,
];

function toSnake(kebab: string) {
  return kebab.replace(/-/g, '_');
}

function cleanParams(p: LookupParams = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined) out[k] = v as string | number | boolean;
  }
  return out;
}

export class LookupsClient {
  constructor(private readonly api: APIRequestContext) {}

  async get(type: LookupType, params: LookupParams = {}): Promise<LookupItem[]> {
    const { path, query } = this.buildPath(type, params);
    const res = await this.api.get(path, { params: query });
    await this.ensureOk(res, 200, path, query);
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error(`Expected array from ${path} but got ${typeof json}`);
    }
    return json as LookupItem[];
  }

  // ---------------------------
  // Convenience wrappers
  // ---------------------------
  landUses() { return this.get('land-use'); }
  divestmentStrategies() { return this.get('divestment-strategy'); }
  statuses(opts?: LookupParams) { return this.get('statuses', opts); }
  sites(opts?: LookupParams) { return this.get('sites', opts); }
  externalContacts(opts?: LookupParams) { return this.get('external-contacts', opts); }

  // ---------------------------
  // Internal helpers
  // ---------------------------
  private buildPath(type: LookupType, params: LookupParams) {
    const cleaned = cleanParams(params);

    if (CONSOLIDATED_LOOKUP_TYPES.includes(type)) {
      return {
        path: '/lookups',
        query: { lookup_type: toSnake(type), ...cleaned } as Record<string, string | number | boolean>,
      };
    }

    // Direct (unchanged) tables still use /lookups/{type}
    return { path: `/lookups/${type}`, query: cleaned };
  }

  private async ensureOk(
    res: APIResponse,
    expected: number,
    path: string,
    params: Record<string, string | number | boolean>
  ) {
    if (res.status() === expected) return;
    const body = await res.text().catch(() => '');
    throw new Error(
      `Lookup request failed (${res.status()} != ${expected})\n` +
      `→ ${path}\n` +
      `→ Params: ${JSON.stringify(params)}\n` +
      `→ Body: ${body.slice(0, 800)}`
    );
  }
}

import type { APIRequestContext, APIResponse } from '@playwright/test';

export type LookupType =
  | 'contact-types' | 'land-uses' | 'locations' | 'statuses' | 'sites'
  | 'schemes' | 'divestment-strategies' | 'opportunity-sources'
  | 'external-companies' | 'external-contacts' | 'existing-uses'
  | 'planning-statuses' | 'proposed-uses' | 'data-centre-potential'
  | 'planning-timeframes' | 'deal-structures';

export type LookupItem = {
  id: number;
  name?: string;
  display_name?: string;
  [k: string]: unknown;
};

export type LookupParams = Record<string, string | number | boolean | undefined>;

function cleanParams(p: LookupParams = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined) out[k] = v;
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

  landUses() { return this.get('land-uses'); }
  statuses(opts?: LookupParams) { return this.get('statuses', opts); }
  sites(opts?: LookupParams) { return this.get('sites', opts); }
  externalContacts(opts?: LookupParams) { return this.get('external-contacts', opts); }

  private buildPath(type: LookupType, params: LookupParams) {
    const mode = (process.env.LOOKUPS_MODE ?? 'multi').toLowerCase();
    const cleaned = cleanParams(params);
    if (mode === 'single') {
      return { path: '/lookups', query: { type, ...cleaned } as Record<string, string | number | boolean> };
    }
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

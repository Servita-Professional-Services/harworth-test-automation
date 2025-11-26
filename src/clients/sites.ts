import type { APIRequestContext, APIResponse } from '@playwright/test';

export type Site = {
  id: number | string;
  display_name?: string;
  displayName?: string;
  financial_code?: string;
  scheme_id?: number;
  land_use_id?: number;
  location_id?: number;
  status_id?: number;
  imported?: boolean;
};

export type SitesQuery = {
  display_name?: string;
  scheme_id?: number;
  financial_code?: string;
  land_use_id?: number;
  location_id?: number;
  ids?: Array<number | string>;
  phase?: 'opportunity' | 'site';
  page?: number;
  limit?: number;
};

export type CreateSite = {
  display_name: string;
  description?: string;
  financial_code?: string;
  imported?: boolean;
  land_use_id?: number;
  location_id?: number;
  scheme_id?: number;
  address?: string;
  post_code?: string;
  status_id?: string;
  lead_contact_id?: string;
  comment?: string;
};

export type UpdateSite = {
  display_name?: string | null;
  description?: string | null;
  financial_code?: string | null;
  imported?: boolean | null;
  land_use_id?: number | null;
  location_id?: number | null;
  scheme_id?: number | null;
  address?: string | null;
  post_code?: string | null;
  status_id?: number | null;
};

export type SiteContactCreate = {
  user_id: string;
  contact_type_id: number;
};

export type OpportunityMetadataUpdate = {
  opportunity_source_id?: number | null;
  off_market?: boolean | null;
  date_identified?: string | null; // ISO date
  vendors_agent_id?: number | null;
  harworth_agent_id?: number | null;
};

export class SitesClient {
  constructor(private readonly api: APIRequestContext) {}

  async list(q: SitesQuery = {}): Promise<Site[]> {
    const withDefaults: SitesQuery = {
      phase: q.phase ?? 'site',
      page: q.page ?? 1,
      limit: q.limit ?? 50,
      ...q,
    };
    const { url, params } = this.#buildUrl('/sites', withDefaults);
    const res = await this.api.get(url, { params });
    await this.#expectStatus(res, 'list sites', [200, 204]);
    if (res.status() === 204) return [];
    const body = await res.json();
    return this.#rowsFrom(body) as Site[];
  }

  async listByIds(ids: Array<number | string>, extra: Omit<SitesQuery, 'ids'> = {}): Promise<Site[]> {
    return this.list({ ...extra, ids });
  }

  async get(id: number | string): Promise<Site> {
    const res = await this.api.get(`/sites/${id}`);
    await this.#expectStatus(res, 'get site', [200]);
    return res.json();
  }

  async create(payload: CreateSite): Promise<Site> {
    const res = await this.api.post('/sites', { data: payload });
    await this.#expectStatus(res, 'create site', [200, 201]);
    return res.json();
  }

  async update(id: number | string, payload: UpdateSite): Promise<Site> {
    const res = await this.api.put(`/sites/${id}`, { data: payload });
    await this.#expectStatus(res, 'update site', [200]);
    return res.json();
  }

  async delete(id: number | string): Promise<void> {
    const res = await this.api.delete(`/sites/${id}`);
    await this.#expectStatus(res, 'delete site', [204]);
  }

  async history(id: number | string, q: { page?: number; limit?: number } = {}): Promise<any[]> {
    const res = await this.api.get(`/sites/${id}/history`, { params: q });
    await this.#expectStatus(res, 'site history', [200, 204]);
    if (res.status() === 204) return [];
    const body = await res.json();
    return this.#rowsFrom(body);
  }

  async addContact(siteId: number | string, payload: SiteContactCreate): Promise<any> {
    const res = await this.api.post(`/sites/${siteId}/contacts`, { data: payload });
    await this.#expectStatus(res, 'add site contact', [200, 201]);
    return res.json().catch(() => ({}));
  }

  async deleteContact(siteId: number | string, contactId: number | string): Promise<void> {
    const res = await this.api.delete(`/sites/${siteId}/contacts/${contactId}`);
    await this.#expectStatus(res, 'delete site contact', [204]);
  }

  async updateOpportunityMetadata(siteId: number | string, payload: OpportunityMetadataUpdate): Promise<any> {
    const res = await this.api.put(`/sites/${siteId}/opportunity-metadata`, { data: payload });
    await this.#expectStatus(res, 'update opportunity metadata', [200]);
    return res.json().catch(() => ({}));
  }

  #buildUrl(base: string, q: SitesQuery) {
    const { ids, ...rest } = q;
    let url = base;
    if (ids && ids.length) {
      const repeated = ids.map(v => `ids=${encodeURIComponent(String(v))}`).join('&');
      url += (base.includes('?') ? '&' : '?') + repeated;
    }
    const params: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined || v === null) continue;
      params[k] = v as any;
    }
    return { url, params };
  }

  #rowsFrom(body: any): any[] {
    if (Array.isArray(body)) return body;
    const keys = ['items', 'data', 'results', 'records', 'rows', 'list', 'sites'];
    for (const k of keys) {
      const v = body?.[k];
      if (Array.isArray(v)) return v;
    }
    for (const v of Object.values(body ?? {})) {
      if (Array.isArray(v)) return v as any[];
    }
    return [];
  }

  async #expectStatus(res: APIResponse, action: string, ok: number[]) {
    if (ok.includes(res.status())) return;
    const text = await res.text().catch(() => '');
    throw new Error(`${action} failed: ${res.status()} — ${text}`);
  }

  async getIdByDisplayName(name: string): Promise<number | string> {
    const rows = await this.list({ display_name: name });
    const match = rows.find(
      r => (r.display_name ?? (r as any).displayName) === name
    );
  
    if (!match?.id && match?.id !== 0) {
      throw new Error(
        `getIdByDisplayNameOrThrow: site with display_name='${name}' not found`
      );
    }
    return match.id;
  }
}

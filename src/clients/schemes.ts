import type { APIRequestContext, APIResponse } from '@playwright/test';

export type Scheme = {
  id: number | string;
  display_name?: string;
  displayName?: string;
  description?: string;
  imported?: boolean;
};

export type SchemesQuery = {
  display_name?: string;
  ids?: Array<number | string>;
  page?: number;
  limit?: number;
};

export type CreateScheme = {
  display_name: string;
  description: string; // required by contract
  imported?: boolean;
};

export type UpdateScheme = {
  display_name?: string | null;
  description?: string | null;
  imported?: boolean | null;
};

export class SchemesClient {
  constructor(private readonly api: APIRequestContext) {}

  async list(q: SchemesQuery = {}): Promise<Scheme[]> {
    const { url, params } = this.#buildUrl('/schemes', q);
    const res = await this.api.get(url, { params });
    await this.#expectStatus(res, 'list schemes', [200, 204]);
    if (res.status() === 204) return [];
    const body = await res.json();
    return this.#rowsFrom(body) as Scheme[];
  }

  async listByIds(ids: Array<number | string>): Promise<Scheme[]> {
    return this.list({ ids });
  }

  async get(id: number | string): Promise<Scheme> {
    const res = await this.api.get(`/schemes/${id}`);
    await this.#expectStatus(res, 'get scheme', [200]);
    return res.json();
  }

  async create(payload: CreateScheme): Promise<Scheme> {
    const res = await this.api.post('/schemes', { data: payload });
    await this.#expectStatus(res, 'create scheme', [200, 201]);
    return res.json();
  }

  async update(id: number | string, payload: UpdateScheme): Promise<Scheme> {
    const res = await this.api.put(`/schemes/${id}`, { data: payload });
    await this.#expectStatus(res, 'update scheme', [200]);
    return res.json();
  }

  async delete(id: number | string): Promise<void> {
    const res = await this.api.delete(`/schemes/${id}`);
    await this.#expectStatus(res, 'delete scheme', [204]);
  }

  async history(id: number | string, q: { page?: number; limit?: number } = {}): Promise<any[]> {
    const res = await this.api.get(`/schemes/${id}/history`, { params: q });
    await this.#expectStatus(res, 'scheme history', [200, 204]);
    if (res.status() === 204) return [];
    const body = await res.json();
    return this.#rowsFrom(body);
  }

  // ---------- internals ----------

  #buildUrl(base: string, q: SchemesQuery) {
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
    const keys = ['items', 'data', 'results', 'records', 'rows', 'list', 'schemes'];
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
}

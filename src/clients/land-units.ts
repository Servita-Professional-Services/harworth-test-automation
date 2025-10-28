import type { APIRequestContext, APIResponse } from '@playwright/test';

export type LandUnit = {
  id: number;
  display_name: string;
  divestment_strategy_id: number;
  land_use_id: number;
  land_unit_category_id?: number | null;
  measure: number;
  unit_of_measure: string;
  parent_id?: number | null;
  parent_type?: string | null;
  [k: string]: unknown;
};

export type LandUnitListParams = {
  page?: number;
  limit?: number;
  id?: number;
  display_name?: string;
  divestment_strategy_id?: number;
  land_use_id?: number;
  land_unit_category_id?: number;
  parent_id?: number;
  parent_type?: string;
  ids?: number[];
};

export class LandUnitsClient {
  constructor(public readonly api: APIRequestContext) {}

  async list(params: LandUnitListParams = {}): Promise<LandUnit[]> {
    const r = await this.api.get('/land-units', { params: this.clean(params) });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async listByIds(ids: number[]): Promise<LandUnit[]> {
    if (ids.length === 1) {
      const single = await this.get(ids[0]);
      return [single];
    }

    const r = await this.api.get('/land-units', {
      params: { ids: JSON.stringify(ids) },
    });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async get(id: number): Promise<LandUnit> {
    const r = await this.api.get(`/land-units/${id}`);
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async create(payload: Partial<LandUnit>): Promise<LandUnit> {
    const r = await this.api.post('/land-units', { data: payload });
    await this.ensureOk(r, [200, 201]);
    return r.json();
  }

  async update(id: number, payload: Partial<LandUnit>): Promise<LandUnit> {
    const r = await this.api.put(`/land-units/${id}`, { data: payload });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async delete(id: number): Promise<void> {
    const r = await this.api.delete(`/land-units/${id}`);
    if (![200, 204].includes(r.status())) {
      throw new Error(`DELETE /land-units/${id} failed: ${r.status()}`);
    }
  }

  async history(id: number, params: Record<string, any> = {}): Promise<any[]> {
    const r = await this.api.get(`/land-units/${id}/history`, { params: this.clean(params) });
    await this.ensureOk(r, [200, 204]);
    return r.status() === 204 ? [] : r.json();
  }

  private async ensureOk(res: APIResponse, ok: number[]) {
    if (!ok.includes(res.status())) {
      throw new Error(`Unexpected status ${res.status()}: ${await res.text()}`);
    }
  }

  private clean(obj: Record<string, any>) {
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      out[k] = Array.isArray(v) ? JSON.stringify(v) : v;
    }
    return out;
  }
}

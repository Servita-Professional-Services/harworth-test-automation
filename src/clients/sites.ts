import type { APIRequestContext, APIResponse } from '@playwright/test';

export type CreateSite = {
  display_name: string;
  financial_code?: string;
  scheme_id?: number;
  land_use_id?: number;
  location_id?: number;
  status_id?: number;
  lead_contact_id?: string;
  address?: string;
  post_code?: string;
  comment?: string;
};
export type UpdateSite = Partial<CreateSite>;

export type SiteModel = {
  id: number | string;
  displayName?: string;
  financialCode?: string;
  schemeId?: number;
  landUseId?: number;
  locationId?: number;
  statusId?: number;
  leadContactId?: string;
  address?: string;
  postCode?: string;
  comment?: string;
  raw?: any;
};

export class SitesClient {
  constructor(private readonly api: APIRequestContext) {}

  async list(phase?: string): Promise<SiteModel[]> {
    const res = await this.api.get('/sites', { params: phase ? { phase } : undefined });
    await this.ensureOk(res, 'list sites', [200]);
    const json = await res.json();
    return Array.isArray(json) ? json.map(normalizeSite) : [];
  }

  async getById(id: number | string): Promise<SiteModel> {
    const res = await this.api.get(`/sites/${id}`);
    await this.ensureOk(res, 'get site by id', [200]);
    return normalizeSite(await res.json());
  }

  async create(payload: CreateSite): Promise<SiteModel> {
    const res = await this.api.post('/sites', { data: payload });
    await this.ensureOk(res, 'create site', [201, 200]);
    return normalizeSite(await res.json());
  }

  async update(id: number | string, payload: UpdateSite): Promise<SiteModel> {
    const res = await this.api.put(`/sites/${id}`, { data: payload });
    await this.ensureOk(res, 'update site', [200]);
    return normalizeSite(await res.json());
  }

  async delete(id: number | string): Promise<void> {
    const res = await this.api.delete(`/sites/${id}`);
    await this.ensureOk(res, 'delete site', [204]); // No Content
  }

  private async ensureOk(res: APIResponse, action: string, okStatuses: number[]) {
    if (okStatuses.includes(res.status())) return;
    const body = await res.text().catch(() => '');
    throw new Error(`${action} failed: ${res.status()} — ${body}`);
  }
}

function normalizeSite(r: any): SiteModel {
  const pick = (obj: any, key: string) => (obj ? obj[key] : undefined);
  const nestedId = (obj: any, key: string) => (obj && obj[key] && (obj[key].id ?? obj[key].Id));

  return {
    id: pick(r, 'id') ?? pick(r, 'siteId') ?? pick(r, 'site_id'),
    displayName: pick(r, 'display_name') ?? pick(r, 'displayName') ?? pick(r, 'name'),
    financialCode: pick(r, 'financial_code') ?? pick(r, 'financialCode'),
    schemeId: pick(r, 'scheme_id') ?? pick(r, 'schemeId') ?? nestedId(r, 'scheme'),
    landUseId: pick(r, 'land_use_id') ?? pick(r, 'landUseId') ?? nestedId(r, 'land_use'),
    locationId: pick(r, 'location_id') ?? pick(r, 'locationId') ?? nestedId(r, 'location'),
    statusId: pick(r, 'status_id') ?? pick(r, 'statusId') ?? nestedId(r, 'status'),
    leadContactId: pick(r, 'lead_contact_id') ?? pick(r, 'leadContactId') ?? nestedId(r, 'lead_contact'),
    address: pick(r, 'address'),
    postCode: pick(r, 'post_code') ?? pick(r, 'postCode'),
    comment: pick(r, 'comment'),
    raw: r,
  };
}

import type { APIRequestContext, APIResponse } from '@playwright/test';

export type OpportunityMetadataUpdate = {
  opportunity_source_id?: number | null;
  off_market?: boolean | null;
  date_identified?: string | null;
  vendors_agent_id?: number | null;
  harworth_agent_id?: number | null;
  gross_acres?: number | null;
  net_acres?: number | null;
  existing_use_id?: number | null;
  green_belt?: boolean | null;
  planning_status_id?: number | null;
  proposed_use_id?: number | null;
  data_centre_potential?: 'yes' | 'no' | 'unknown' | null;
  planning_timeframe_id?: number | null;
  employment_sqft?: number | null;
  employment_density?: number | null;
  housing_plots?: number | null;
  housing_density?: number | null;
};

export class OpportunityMetadataClient {
  constructor(public readonly api: APIRequestContext) {}

  async get(siteId: number | string): Promise<Record<string, unknown>> {
    const r = await this.api.get(`/sites/${Number(siteId)}/opportunity-metadata`);
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async update(siteId: number | string, payload: OpportunityMetadataUpdate) {
    const r = await this.api.put(`/sites/${Number(siteId)}/opportunity-metadata`, { data: payload });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async delete(siteId: number | string): Promise<void> {
    const r = await this.api.delete(`/sites/${Number(siteId)}/opportunity-metadata`);
    await this.ensureOk(r, [200]);
  }

  private async ensureOk(res: APIResponse, ok: number[]) {
    if (!ok.includes(res.status())) {
      throw new Error(`Unexpected status ${res.status()}: ${await res.text()}`);
    }
  }
}
import type { APIRequestContext, APIResponse } from '@playwright/test';

type LookupItem = { id: number; name?: string; display_name?: string; [k: string]: unknown };

export class LookupsClient {
  constructor(private readonly api: APIRequestContext) {}

  async landUses(): Promise<LookupItem[]> {
    const r = await this.api.get('/lookups/land-uses');
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async landUsesByIds(ids: number[]): Promise<LookupItem[]> {
    const r = await this.api.get('/lookups/land-uses', { params: { ids: `[${ids.join(',')}]` } });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async statuses(): Promise<LookupItem[]> {
    const r = await this.api.get('/lookups/statuses');
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async statusesByIds(ids: number[]): Promise<LookupItem[]> {
    const r = await this.api.get('/lookups/statuses', { params: { ids: `[${ids.join(',')}]` } });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  private async ensureOk(res: APIResponse, okStatuses: number[]) {
    if (okStatuses.includes(res.status())) return;
    throw new Error(`Lookups failed: ${res.status()} — ${await res.text().catch(() => '')}`);
  }
}

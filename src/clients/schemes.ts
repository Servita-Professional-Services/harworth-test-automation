import type { APIRequestContext, APIResponse } from '@playwright/test';

export type Scheme = {
  id: number | string;
  display_name: string;
  description: string;
  imported?: boolean;
};

export type CreateScheme = {
  display_name: string;
  description: string;
};

export type UpdateScheme = Partial<CreateScheme>;

export class SchemesClient {
  constructor(private readonly api: APIRequestContext) {}

  async list(): Promise<Scheme[]> {
    const res = await this.api.get('/schemes');
    await this.ensureOk(res, 'list schemes', [200]);
    return res.json();
  }

  async create(payload: CreateScheme): Promise<Scheme> {
    const res = await this.api.post('/schemes', { data: payload });
    await this.ensureOk(res, 'create scheme', [201, 200]);
    return res.json();
  }

  async update(id: number | string, payload: UpdateScheme): Promise<Scheme> {
    const res = await this.api.put(`/schemes/${id}`, { data: payload });
    await this.ensureOk(res, 'update scheme', [200]);
    return res.json();
  }

  async delete(id: number | string): Promise<void> {
    const res = await this.api.delete(`/schemes/${id}`);
    await this.ensureOk(res, 'delete scheme', [204]);
  }

  private async ensureOk(res: APIResponse, action: string, okStatuses: number[]) {
    if (okStatuses.includes(res.status())) return;
    const body = await res.text().catch(() => '');
    throw new Error(`${action} failed: ${res.status()} — ${body}`);
  }
}

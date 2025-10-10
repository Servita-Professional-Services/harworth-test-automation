import type { APIRequestContext, APIResponse } from '@playwright/test';

export type UserLite = { id: string; email?: string; name?: string; [k: string]: unknown };

export class UsersClient {
  constructor(private readonly api: APIRequestContext) {}

  async accessByEmail(email: string): Promise<UserLite[]> {
    const r = await this.api.get('/users/access', { params: { email } });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  async accessByName(name: string): Promise<UserLite[]> {
    const r = await this.api.get('/users/access', { params: { name } });
    await this.ensureOk(r, [200]);
    return r.json();
  }

  private async ensureOk(res: APIResponse, okStatuses: number[]) {
    if (okStatuses.includes(res.status())) return;
    throw new Error(`Users failed: ${res.status()} — ${await res.text().catch(() => '')}`);
  }
}

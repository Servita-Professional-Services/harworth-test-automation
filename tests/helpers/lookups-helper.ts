import type { APIRequestContext } from '@playwright/test';

export async function getSchemeStatusId(api: APIRequestContext): Promise<number> {
  const res = await api.get('/lookups', {
    params: { lookup_type: 'scheme_status' },
  });

  if (res.status() !== 200) {
    throw new Error(`Failed to fetch scheme statuses: ${res.status()}`);
  }

  const rows = (await res.json()) as Array<{ id: number }>;
  if (!rows.length) throw new Error('No scheme statuses returned');

  return rows[Math.floor(Math.random() * rows.length)].id;
}
import type { APIRequestContext } from '@playwright/test';

export async function getSchemeStatusId(api: APIRequestContext): Promise<number> {
    const res = await api.get('/lookups/statuses');
  
    if (res.status() !== 200) {
      throw new Error(`Failed to fetch statuses from /lookups/statuses: ${res.status()}`);
    }
  
    const body = await res.json() as any;
  
    const rows: any[] =
      Array.isArray(body) ? body :
      Array.isArray(body?.items) ? body.items :
      Array.isArray(body?.data) ? body.data :
      [];
  
    if (!rows.length) {
      throw new Error('No statuses returned from /lookups/statuses');
    }
  
    const schemeStatuses = rows.filter(
      r =>
        r?.type === 'scheme' ||
        r?.entity === 'scheme' ||
        r?.context === 'scheme' ||
        r?.category === 'scheme'
    );
  
    const usable = schemeStatuses.length ? schemeStatuses : rows;
  
    const picked = usable[Math.floor(Math.random() * usable.length)];
    const id = picked?.id;
  
    if (id === undefined || id === null) {
      throw new Error('Status row missing id field');
    }
  
    return Number(id);
  }
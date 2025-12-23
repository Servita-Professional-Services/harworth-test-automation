import type { APIRequestContext, APIResponse, expect as ExpectType } from '@playwright/test';
import { readJsonSafe, readTextSafe, pollForSingleRowOrThrow, type Id } from './api';
import type { AdminSchemesImportPayload } from './test-data/admin-schemes';

export type AdminSchemesResponse = {
  summary?: {
    totalRecords?: number;
    successfulSchemes?: number;
    successfulSites?: number;
    skippedRecords?: number;
    contactsResolved?: number;
    contactsUnresolved?: number;
    errors?: string[];
    unfoundUsernames?: string[]; 
  };
  processedData?: unknown[];
  cacheStatistics?: {
    totalLookups?: number;
    cacheHits?: number;
    cacheMisses?: number;
    uniqueNames?: number;
    graphApiCalls?: number;
    graphApiCallsSaved?: number;
    cacheEfficiency?: number;
  };
};

function isTransientBulkImport400(bodyText: string): boolean {
  return (
    bodyText.includes('Bulk import operation failed') ||
    bodyText.includes('Bulk import failed: Error: Bulk import operation failed')
  );
}

async function sleep(ms: number) {
  await new Promise(r => setTimeout(r, ms));
}

export async function postAdminSchemesWithRetryOrThrow(
  api: APIRequestContext,
  payload: AdminSchemesImportPayload,
  opts: { attempts?: number; backoffMs?: number[] } = {},
): Promise<{ res: APIResponse; bodyText: string; body?: AdminSchemesResponse }> {
  const attempts = opts.attempts ?? 3;
  const backoffMs = opts.backoffMs ?? [500, 1500, 3000];

  let lastRes: APIResponse | undefined;
  let lastBodyText = '';

  for (let i = 0; i < attempts; i++) {
    const res = await api.post('/admin/schemes', { data: payload as any });
    lastRes = res;

    const status = res.status();
    lastBodyText = await readTextSafe(res);

    if ([200, 201, 204].includes(status)) {
      const body = await readJsonSafe<AdminSchemesResponse>(res);
      return { res, bodyText: lastBodyText, body };
    }

    if (status === 400 && isTransientBulkImport400(lastBodyText) && i < attempts - 1) {
      await sleep(backoffMs[Math.min(i, backoffMs.length - 1)]);
      continue;
    }

    throw new Error(
      `Unexpected status from POST /admin/schemes: ${status}\n` +
        `Request body: ${JSON.stringify(payload, null, 2)}\n` +
        `Response body: ${lastBodyText}`,
    );
  }

  throw new Error(
    `Unexpected status from POST /admin/schemes: ${lastRes?.status() ?? 'unknown'}\n` +
      `Request body: ${JSON.stringify(payload, null, 2)}\n` +
      `Response body: ${lastBodyText}`,
  );
}

export function expectAdminSchemesResponseShape(expect: typeof ExpectType, body: AdminSchemesResponse | undefined) {
  expect(body).toBeTruthy();
  expect(body?.summary).toBeTruthy();
  expect(typeof body?.summary?.totalRecords).toBe('number');
  expect(Array.isArray(body?.summary?.errors)).toBe(true);
  if (body?.summary?.unfoundUsernames !== undefined) {
    expect(Array.isArray(body.summary.unfoundUsernames)).toBe(true);
  }
  expect(body?.cacheStatistics).toBeTruthy();
}

export function getSiteDisplayName(site: any): string | undefined {
  return site?.display_name ?? site?.displayName;
}

export function getSchemeIdFromSite(site: any): Id | undefined {
  return site?.scheme?.id ?? site?.scheme_id ?? site?.schemeId ?? undefined;
}

export async function getSingleSiteByFinancialCodeOrThrow(
    expect: typeof ExpectType,
    sites: { list: (q: any) => Promise<any[]> },
    financialCode: string,
  ): Promise<any> {
    return pollForSingleRowOrThrow(
      expect,
      async () => {
        const [sitePhase, oppPhase] = await Promise.allSettled([
          sites.list({ financial_code: financialCode, phase: 'site', page: 1, limit: 50 }),
          sites.list({ financial_code: financialCode, phase: 'opportunity', page: 1, limit: 50 }),
        ]);
  
        const a = sitePhase.status === 'fulfilled' ? sitePhase.value : [];
        const b = oppPhase.status === 'fulfilled' ? oppPhase.value : [];
  
        return [...a, ...b];
      },
      { message: `Expected exactly 1 site with financial_code='${financialCode}'` },
    );
  }

export async function listSitesByFinancialCodeAllPhases(
  sites: { list: (q: any) => Promise<any[]> },
  financialCode: string,
): Promise<any[]> {
  const [sitePhase, oppPhase] = await Promise.all([
    sites.list({ financial_code: financialCode, phase: 'site', page: 1, limit: 50 }).catch(() => []),
    sites.list({ financial_code: financialCode, phase: 'opportunity', page: 1, limit: 50 }).catch(() => []),
  ]);
  const merged = [...(sitePhase ?? []), ...(oppPhase ?? [])];
  const byId = new Map<string, any>();
  for (const r of merged) {
    if (r?.id == null) continue;
    byId.set(String(r.id), r);
  }
  return [...byId.values()];
}
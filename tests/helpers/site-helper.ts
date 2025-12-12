import type { expect as ExpectType } from '@playwright/test';
import type { Id } from './api';

export function getSiteDisplayName(site: unknown): string | undefined {
  const s = site as any;
  return s?.display_name ?? s?.displayName;
}

export function getSchemeIdFromSite(site: unknown): Id | undefined {
  const s = site as any;
  return s?.scheme?.id ?? s?.scheme_id ?? undefined;
}

export async function getSingleSiteByFinancialCodeOrThrow(
  expect: typeof ExpectType,
  sites: { list: (q: any) => Promise<any[]> },
  financialCode: string,
): Promise<any> {
  const fetch = () =>
    sites.list({
      financial_code: financialCode,
      page: 1,
      limit: 50,
    });

  await expect
    .poll(fetch, {
      timeout: 15_000,
      intervals: [250, 500, 1000],
      message: `Expected exactly 1 site with financial_code='${financialCode}'`,
    })
    .toHaveLength(1);

  const finalRows = await fetch();
  if (!finalRows?.length) throw new Error(`No site returned for financial_code='${financialCode}'`);
  return finalRows[0];
}
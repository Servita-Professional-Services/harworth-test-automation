import { test, expect } from '../fixtures/api-fixtures';
import { makeAdminImportRow } from '../helpers/test-data/admin-schemes';
import { expectIdsContain } from '../helpers/assertions';
import {
  postAdminSchemesWithRetryOrThrow,
  expectAdminSchemesResponseShape,
  getSingleSiteByFinancialCodeOrThrow,
  getSiteDisplayName,
  getSchemeIdFromSite,
} from '../helpers/admin-schemes-helper';

test.describe('@api Admin Schemes import', () => {
  test('Imports a scheme + site and exposes them via list endpoints', async ({ api, sites, schemes }) => {
    const row = await makeAdminImportRow(api);

    let createdSiteId: number | string | undefined;
    let createdSchemeId: number | string | undefined;

    try {
      const { body } = await postAdminSchemesWithRetryOrThrow(api, [row]);

      expectAdminSchemesResponseShape(expect, body);
      expect(body?.summary?.totalRecords).toBe(1);
      expect(body?.summary?.errors).toEqual([]);

      const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, row.Financial_Code);
      createdSiteId = site.id;

      expect(getSiteDisplayName(site)).toBe(row.Site);

      const schemeId = getSchemeIdFromSite(site);
      expect(schemeId, 'Expected scheme id on site (site.scheme.id or site.scheme_id)').toBeDefined();
      createdSchemeId = schemeId!;

      const schemeRows = await schemes.listByIds([createdSchemeId]);
      expectIdsContain(schemeRows, createdSchemeId);

      const schemeName = schemeRows[0].display_name ?? (schemeRows[0] as any).displayName;
      expect(schemeName).toBe(row.Scheme);
    } finally {
      await Promise.allSettled([
        createdSiteId != null ? sites.delete(createdSiteId) : Promise.resolve(),
        createdSchemeId != null ? schemes.delete(createdSchemeId) : Promise.resolve(),
      ]);
    }
  });

  test('Supports bulk import of multiple schemes + sites', async ({ api, sites, schemes }) => {
    const rows = [await makeAdminImportRow(api), await makeAdminImportRow(api), await makeAdminImportRow(api)];

    const createdSiteIds: Array<number | string> = [];
    const createdSchemeIds: Array<number | string> = [];

    try {
      const { body } = await postAdminSchemesWithRetryOrThrow(api, rows);

      expectAdminSchemesResponseShape(expect, body);
      expect(body?.summary?.totalRecords).toBe(rows.length);
      expect(body?.summary?.errors).toEqual([]);

      for (const row of rows) {
        const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, row.Financial_Code);
        createdSiteIds.push(site.id);

        expect(getSiteDisplayName(site)).toBe(row.Site);

        const schemeId = getSchemeIdFromSite(site);
        expect(schemeId, 'Expected scheme id on site (site.scheme.id or site.scheme_id)').toBeDefined();
        createdSchemeIds.push(schemeId!);

        const schemeRows = await schemes.listByIds([schemeId!]);
        expectIdsContain(schemeRows, schemeId!);

        const schemeName = schemeRows[0].display_name ?? (schemeRows[0] as any).displayName;
        expect(schemeName).toBe(row.Scheme);
      }
    } finally {
      const uniqueSchemeIds = [...new Set(createdSchemeIds)];

      await Promise.allSettled([
        ...createdSiteIds.map(id => sites.delete(id)),
        ...uniqueSchemeIds.map(id => schemes.delete(id)),
      ]);
    }
  });

  test('Re-importing the same data does not create duplicate sites', async ({ api, sites, schemes }) => {
    const row = await makeAdminImportRow(api);

    let createdSiteId: number | string | undefined;
    let createdSchemeId: number | string | undefined;

    try {
      const first = await postAdminSchemesWithRetryOrThrow(api, [row]);
      if (first.body) {
        expectAdminSchemesResponseShape(expect, first.body);
        expect(first.body.summary?.errors).toEqual([]);
      }

      const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, row.Financial_Code);
      createdSiteId = site.id;

      const schemeId = getSchemeIdFromSite(site);
      expect(schemeId, 'Expected scheme id on site').toBeDefined();
      createdSchemeId = schemeId!;

      const second = await postAdminSchemesWithRetryOrThrow(api, [row]);
      if (second.body) {
        expectAdminSchemesResponseShape(expect, second.body);
        expect(second.body.summary?.errors).toEqual([]);
        expect(second.body.summary?.totalRecords).toBe(1);
      }

      const afterRows = await sites.list({
        financial_code: row.Financial_Code,
        page: 1,
        limit: 50,
      });
      expect(afterRows).toHaveLength(1);
    } finally {
      await Promise.allSettled([
        createdSiteId != null ? sites.delete(createdSiteId) : Promise.resolve(),
        createdSchemeId != null ? schemes.delete(createdSchemeId) : Promise.resolve(),
      ]);
    }
  });

  test('Rejects payloads that are not an array', async ({ api }) => {
    const res = await api.post('/admin/schemes', { data: { hello: 'world' } });
    expect(res.status()).toBe(400);
  });

  test('Rejects rows with missing required fields', async ({ api }) => {
    const res = await api.post('/admin/schemes', { data: [{}] });
    expect(res.status()).toBe(400);
  });

  test('Rejects an empty array payload', async ({ api }) => {
    const res = await api.post('/admin/schemes', { data: [] });
    expect(res.status()).toBe(400);
  });

  test('Reports contact names not found in Azure in unfoundUsernames', async ({ api, sites, schemes }) => {
    const row = await makeAdminImportRow(api);

    const bad1 = `e2e-not-a-user-${Date.now()}-a`;
    const bad2 = `e2e-not-a-user-${Date.now()}-b`;
    const bad3 = `e2e-not-a-user-${Date.now()}-c`;

    (row as any)['DM / AM / Playbook Owner'] = [bad1];
    (row as any)['Functional Lead'] = [bad2];
    (row as any)['FBP contact'] = [bad3];

    let createdSiteId: number | string | undefined;
    let createdSchemeId: number | string | undefined;

    try {
      const { body } = await postAdminSchemesWithRetryOrThrow(api, [row]);

      expectAdminSchemesResponseShape(expect, body);
      expect(body?.summary?.totalRecords).toBe(1);
      expect(body?.summary?.errors).toEqual([]);
      expect(body?.summary?.unfoundUsernames ?? []).toEqual(
        expect.arrayContaining([bad1, bad2, bad3]),
      );
      expect((body?.summary?.contactsUnresolved ?? 0)).toBeGreaterThanOrEqual(1);

      const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, row.Financial_Code);
      createdSiteId = site.id;

      const schemeId = getSchemeIdFromSite(site);
      if (schemeId != null) createdSchemeId = schemeId;

      if (createdSchemeId != null) {
        const schemeRows = await schemes.listByIds([createdSchemeId]);
        expectIdsContain(schemeRows, createdSchemeId);
      }
    } finally {
      await Promise.allSettled([
        createdSiteId != null ? sites.delete(createdSiteId) : Promise.resolve(),
        createdSchemeId != null ? schemes.delete(createdSchemeId) : Promise.resolve(),
      ]);
    }
  });
});
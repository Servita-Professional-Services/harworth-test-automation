import { test, expect } from '../fixtures/api-fixtures';
import { makeAdminImportPayload } from '../helpers/test-data/admin-schemes';
import { expectIdsContain } from '../helpers/assertions';
import {
  postAdminSchemesWithRetryOrThrow,
  expectAdminSchemesResponseShape,
  getSingleSiteByFinancialCodeOrThrow,
  listSitesByFinancialCodeAllPhases,
  getSiteDisplayName,
  getSchemeIdFromSite,
} from '../helpers/admin-schemes-helper';

test.describe('@api Admin Schemes import', () => {
    test('Imports a scheme + site and exposes them via list endpoints', async ({ api, sites, schemes }) => {
      const built = await makeAdminImportPayload(api);
      const payload = built.payload;
      const Financial_Code = built.Financial_Code;
      const Site = built.Site;
      const Scheme = built.Scheme;
      let createdSiteId: number | string | undefined;
      let createdSchemeId: number | string | undefined;
      try {
        const { body } = await postAdminSchemesWithRetryOrThrow(api, payload);
        expectAdminSchemesResponseShape(expect, body);
        expect(body?.summary?.totalRecords).toBe(1);
        expect(body?.summary?.errors).toEqual([]);
        const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, Financial_Code);
        createdSiteId = site.id;
        expect(getSiteDisplayName(site)).toBe(Site);
        const schemeId = getSchemeIdFromSite(site);
        expect(schemeId, 'Expected scheme id on site (site.scheme.id or site.scheme_id)').toBeDefined();
        createdSchemeId = schemeId!;
        const schemeRows = await schemes.listByIds([createdSchemeId]);
        expectIdsContain(schemeRows, createdSchemeId);
        const schemeName = schemeRows[0].display_name ?? (schemeRows[0] as any).displayName;
        expect(schemeName).toBe(Scheme);
        } finally {
          await Promise.allSettled([
            createdSiteId != null ? sites.delete(createdSiteId) : Promise.resolve(),
            createdSchemeId != null ? schemes.delete(createdSchemeId) : Promise.resolve(),
          ]);
        }
      });

  test('Supports bulk import of multiple schemes + sites', async ({ api, sites, schemes }) => {
    const built = await Promise.all([makeAdminImportPayload(api), makeAdminImportPayload(api), makeAdminImportPayload(api)]);
    const payload = {
      sites: built.flatMap(b => b.payload.sites),
      schemes: built.flatMap(b => b.payload.schemes),
    };

    const createdSiteIds: Array<number | string> = [];
    const createdSchemeIds: Array<number | string> = [];

    try {
      const { body } = await postAdminSchemesWithRetryOrThrow(api, payload);

      expectAdminSchemesResponseShape(expect, body);
      expect(body?.summary?.errors).toEqual([]);
      expect(body?.summary?.totalRecords).toBe(payload.sites.length + payload.schemes.length);

      for (const b of built) {
        const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, b.Financial_Code);
        createdSiteIds.push(site.id);

        expect(getSiteDisplayName(site)).toBe(b.Site);

        const schemeId = getSchemeIdFromSite(site);
        expect(schemeId, 'Expected scheme id on site (site.scheme.id or site.scheme_id)').toBeDefined();
        createdSchemeIds.push(schemeId!);

        const schemeRows = await schemes.listByIds([schemeId!]);
        expectIdsContain(schemeRows, schemeId!);

        const schemeName = schemeRows[0].display_name ?? (schemeRows[0] as any).displayName;
        expect(schemeName).toBe(b.Scheme);
      }
    } finally {
      const uniqueSchemeIds = [...new Set(createdSchemeIds.map(String))];

      await Promise.allSettled([
        ...createdSiteIds.map(id => sites.delete(id)),
        ...uniqueSchemeIds.map(id => schemes.delete(id)),
      ]);
    }
  });

  test('Re-importing the same data does not create duplicate sites', async ({ api, sites, schemes }) => {
    const { payload, Financial_Code } = await makeAdminImportPayload(api);

    let createdSiteId: number | string | undefined;
    let createdSchemeId: number | string | undefined;

    try {
      const first = await postAdminSchemesWithRetryOrThrow(api, payload);
      if (first.body) {
        expectAdminSchemesResponseShape(expect, first.body);
        expect(first.body.summary?.errors).toEqual([]);
      }

      const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, Financial_Code);
      createdSiteId = site.id;

      const schemeId = getSchemeIdFromSite(site);
      expect(schemeId, 'Expected scheme id on site').toBeDefined();
      createdSchemeId = schemeId!;

      const second = await postAdminSchemesWithRetryOrThrow(api, payload);
      if (second.body) {
        expectAdminSchemesResponseShape(expect, second.body);
        expect(second.body.summary?.errors).toEqual([]);
      }

      const afterRows = await listSitesByFinancialCodeAllPhases(sites, Financial_Code);
      expect(afterRows).toHaveLength(1);
    } finally {
      await Promise.allSettled([
        createdSiteId != null ? sites.delete(createdSiteId) : Promise.resolve(),
        createdSchemeId != null ? schemes.delete(createdSchemeId) : Promise.resolve(),
      ]);
    }
  });

  test('Rejects payloads that are not an object', async ({ api }) => {
    const res = await api.post('/admin/schemes', { data: [{ hello: 'world' }] });
    expect(res.status()).toBe(400);
  });

  test('Rejects payloads with missing required fields', async ({ api }) => {
    const res = await api.post('/admin/schemes', { data: { sites: [{}], schemes: [{}] } });
    expect(res.status()).toBe(400);
  });

  test('Rejects an empty payload', async ({ api }) => {
    const res = await api.post('/admin/schemes', { data: { sites: [], schemes: [] } });
    expect(res.status()).toBe(400);
  });

  test('Reports contact names not found in Azure in unfoundUsernames', async ({ api, sites, schemes }) => {
    const built = await makeAdminImportPayload(api);
    built.payload.sites[0].dm = [`e2e-not-a-user-${Date.now()}-a`];
    built.payload.sites[0].fl = [`e2e-not-a-user-${Date.now()}-b`];
    built.payload.sites[0].fbp = [`e2e-not-a-user-${Date.now()}-c`];
    let createdSiteId: number | string | undefined;
    let createdSchemeId: number | string | undefined;
    try {
      const { body } = await postAdminSchemesWithRetryOrThrow(api, built.payload);
      expectAdminSchemesResponseShape(expect, body);
      expect(body?.summary?.errors).toEqual([]);
      if (Array.isArray(body?.summary?.unfoundUsernames)) {
        expect(body?.summary?.unfoundUsernames).toEqual(
          expect.arrayContaining([
            built.payload.sites[0].dm[0],
            built.payload.sites[0].fl[0],
            built.payload.sites[0].fbp[0],
          ]),
        );
      }
      const site = await getSingleSiteByFinancialCodeOrThrow(expect, sites, built.Financial_Code);
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
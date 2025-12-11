import { test, expect } from '../fixtures/api-fixtures';
import { makeAdminImportRow } from '../helpers/test-data/admin-schemes';
import { expectIdsContain, expectIdsNotContain } from '../helpers/assertions';

// ---------------------------
// Admin Schemes — import
// ---------------------------
test.describe('@api Admin Schemes import', () => {
  test('Imports a scheme + site and exposes them via list endpoints', async ({
    api,
    sites,
    schemes,
  }) => {
    const row = await makeAdminImportRow(api);

    let createdSiteId: number | string | undefined;
    let createdSchemeId: number | string | undefined;

    try {
      const res = await api.post('/admin/schemes', { data: [row] });
      const status = res.status();
      const bodyText = await res.text();

      if (![200, 201, 204].includes(status)) {
        throw new Error(
          `Unexpected status from POST /admin/schemes: ${status}\n` +
            `Request body: ${JSON.stringify([row], null, 2)}\n` +
            `Response body: ${bodyText}`,
        );
      }

      expect([200, 201, 204]).toContain(status);

      const siteRows = await sites.list({
        financial_code: row.Financial_Code,
        page: 1,
        limit: 50,
      });

      expect(Array.isArray(siteRows)).toBe(true);
      expect(siteRows.length).toBe(1);

      const site = siteRows[0];
      createdSiteId = site.id;

      const siteName = site.display_name ?? (site as any).displayName;
      expect(siteName).toBe(row.Site);

      // Support both snake_case and camelCase from API
      const schemeId = site.scheme_id ?? (site as any).schemeId;
      expect(
        schemeId,
        'scheme_id/schemeId should be present on site returned from list endpoint',
      ).toBeDefined();

      createdSchemeId = schemeId!;

      if (createdSchemeId === undefined || createdSchemeId === null) {
        throw new Error('scheme_id / schemeId not returned from site record');
      }
      
      const schemeRows = await schemes.listByIds([createdSchemeId]);
      expectIdsContain(schemeRows, createdSchemeId);

      const schemeName =
        schemeRows[0].display_name ?? (schemeRows[0] as any).displayName;
      expect(schemeName).toBe(row.Scheme);
    } finally {
      if (createdSiteId !== undefined && createdSiteId !== null) {
        await sites.delete(createdSiteId).catch(() => undefined);
      }
      if (createdSchemeId !== undefined && createdSchemeId !== null) {
        await schemes.delete(createdSchemeId).catch(() => undefined);
      }
    }
  });

  test('Supports bulk import of multiple schemes + sites', async ({
    api,
    sites,
    schemes,
  }) => {
    const rows = [
      await makeAdminImportRow(api),
      await makeAdminImportRow(api),
      await makeAdminImportRow(api),
    ];

    const createdSiteIds: Array<number | string> = [];
    const createdSchemeIds: Array<number | string> = [];

    try {
      const res = await api.post('/admin/schemes', { data: rows });
      const status = res.status();
      const bodyText = await res.text();

      if (![200, 201, 204].includes(status)) {
        throw new Error(
          `Unexpected status from POST /admin/schemes: ${status}\n` +
            `Request body: ${JSON.stringify(rows, null, 2)}\n` +
            `Response body: ${bodyText}`,
        );
      }

      expect([200, 201, 204]).toContain(status);

      for (const row of rows) {
        const siteRows = await sites.list({
          financial_code: row.Financial_Code,
          page: 1,
          limit: 50,
        });

        expect(Array.isArray(siteRows)).toBe(true);
        expect(siteRows.length).toBe(1);

        const site = siteRows[0];
        createdSiteIds.push(site.id);

        const siteName = site.display_name ?? (site as any).displayName;
        expect(siteName).toBe(row.Site);

        const schemeId: number | string | undefined =
          site.scheme_id ?? (site as any).schemeId;

        expect(
          schemeId,
          'scheme_id/schemeId should be present on site returned from list endpoint',
        ).toBeDefined();

        if (schemeId !== undefined && schemeId !== null) {
          createdSchemeIds.push(schemeId);
        }

        const schemeRows = await schemes.listByIds([schemeId!]);
        expectIdsContain(schemeRows, schemeId!);

        const schemeName =
          schemeRows[0].display_name ?? (schemeRows[0] as any).displayName;
        expect(schemeName).toBe(row.Scheme);
      }
    } finally {
      for (const siteId of createdSiteIds) {
        await sites.delete(siteId).catch(() => undefined);
      }

      const uniqueSchemeIds = [...new Set(createdSchemeIds)];
      for (const schemeId of uniqueSchemeIds) {
        await schemes.delete(schemeId).catch(() => undefined);
      }
    }
  });

  test('Re-importing the same data does not create duplicate sites', async ({
    api,
    sites,
  }) => {
    const row = await makeAdminImportRow(api);
    let createdSchemeId: number | string | undefined;

    try {
      const firstRes = await api.post('/admin/schemes', { data: [row] });
      const firstStatus = firstRes.status();
      const firstBodyText = await firstRes.text();

      if (![200, 201, 204].includes(firstStatus)) {
        throw new Error(
          `Unexpected status from first POST /admin/schemes: ${firstStatus}\n` +
            `Request body: ${JSON.stringify([row], null, 2)}\n` +
            `Response body: ${firstBodyText}`,
        );
      }

      expect([200, 201, 204]).toContain(firstStatus);

      const afterFirst = await sites.list({
        financial_code: row.Financial_Code,
        page: 1,
        limit: 50,
      });

      expect(Array.isArray(afterFirst)).toBe(true);
      expect(afterFirst.length).toBe(1);

      const firstSite = afterFirst[0];
      createdSchemeId =
        firstSite.scheme_id ?? (firstSite as any).schemeId ?? undefined;

      // Second import of the same data
      const secondRes = await api.post('/admin/schemes', { data: [row] });
      const secondStatus = secondRes.status();
      const secondBodyText = await secondRes.text();

      if (![200, 201, 204].includes(secondStatus)) {
        throw new Error(
          `Unexpected status from second POST /admin/schemes: ${secondStatus}\n` +
            `Request body: ${JSON.stringify([row], null, 2)}\n` +
            `Response body: ${secondBodyText}`,
        );
      }

      expect([200, 201, 204]).toContain(secondStatus);

      const afterSecond = await sites.list({
        financial_code: row.Financial_Code,
        page: 1,
        limit: 50,
      });

      expect(Array.isArray(afterSecond)).toBe(true);
      expect(afterSecond.length).toBe(1);
    } finally {
      if (createdSchemeId !== undefined && createdSchemeId !== null) {
        await api
          .delete(`/admin/schemes/${createdSchemeId}`)
          .catch(() => undefined);
      }
    }
  });

  test('Rejects missing required fields', async ({ api }) => {
    const row = await makeAdminImportRow(api);

    // Remove required fields (Scheme + Site) to trigger validation failure
    const invalidRow: any = {
      ...row,
      Scheme: undefined,
      Site: undefined,
    };

    const res = await api.post('/admin/schemes', { data: [invalidRow] });
    const status = res.status();
    const bodyText = await res.text();

    expect(status).toBe(400);

    // Best-effort assertion on error content, without coupling to exact wording
    expect(bodyText).toContain('Bad Request');
  });

  test('Rejects completely invalid payload shape', async ({ api }) => {
    const invalidPayload = [
      {
        foo: 'bar',
        baz: 123,
      },
    ];

    const res = await api.post('/admin/schemes', { data: invalidPayload });
    const status = res.status();
    const bodyText = await res.text();

    expect(status).toBe(400);
    expect(bodyText).toContain('Bad Request');
  });
});
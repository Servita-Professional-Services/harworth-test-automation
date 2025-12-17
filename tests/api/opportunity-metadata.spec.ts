import { test, expect, request } from '../fixtures/api-fixtures';
import { INVALID_ID_CASES } from '../helpers/assertions';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import { makeSiteCreatePayload } from '../helpers/test-data/sites';
import { makeOpportunityMetadataNullPayload } from '../helpers/test-data/opportunity-metadata';

// ---------------------------
// Contract (GET)
// ---------------------------
test.describe('@api Opportunity Metadata — contract', () => {
  test('GET /sites/:id/opportunity-metadata returns 200 and valid object', async ({ api, sites, schemes }) => {
    const schemePayload = await makeSchemePayload(api);

    let scheme: any;
    let site: any;

    try {
      scheme = await schemes.create(schemePayload);
      site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const res = await api.get(`/sites/${site.id}/opportunity-metadata`);
      const status = res.status();
      expect(status).toBe(200);

      const body = await res.json().catch(() => ({}));
      expect(typeof body).toBe('object');
      expect(body).not.toBeNull();
      expect(Object.keys(body).length).toBeGreaterThan(0);
    } finally {
      await Promise.allSettled([
        site?.id != null ? sites.delete(site.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });
});

// ---------------------------
// Update validation
// ---------------------------
test.describe('@api Opportunity Metadata — update validation', () => {
  test('PUT rejects invalid field values with 400', async ({ api, sites, schemes }) => {
    const schemePayload = await makeSchemePayload(api);

    let scheme: any;
    let site: any;

    try {
      scheme = await schemes.create(schemePayload);
      site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const invalidCases = [
        { name: 'opportunity_source_id not positive', body: { opportunity_source_id: 0 } },
        { name: 'data_centre_potential invalid enum', body: { data_centre_potential: 'maybe' } },
        { name: 'housing_plots non-integer', body: { housing_plots: 1.5 } },
        { name: 'employment_sqft negative', body: { employment_sqft: -10 } },
        { name: 'date_identified not ISO', body: { date_identified: '13/01/2025' } },
      ] as const;

      for (const c of invalidCases) {
        const res = await api.put(`/sites/${site.id}/opportunity-metadata`, { data: c.body });
        expect(res.status(), c.name).toBe(400);
      }
    } finally {
      await Promise.allSettled([
        site?.id != null ? sites.delete(site.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });

  test('PUT accepts nulls for all optional fields', async ({ api, sites, schemes }) => {
    const schemePayload = await makeSchemePayload(api);

    let scheme: any;
    let site: any;

    try {
      scheme = await schemes.create(schemePayload);
      site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const res = await api.put(`/sites/${site.id}/opportunity-metadata`, {
        data: makeOpportunityMetadataNullPayload(),
      });

      if ([403, 404, 501].includes(res.status())) test.skip(true, `Feature not available (status ${res.status()}).`);
      expect(res.status()).toBe(200);

      const after = await api.get(`/sites/${site.id}/opportunity-metadata`);
      expect(after.status()).toBe(200);

      const body = await after.json();
      expect((body?.opportunity_source_id ?? null)).toBeNull();
      expect((body?.data_centre_potential ?? null)).toBeNull();
    } finally {
      await Promise.allSettled([
        site?.id != null ? sites.delete(site.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });

  test('PUT accepts valid lookup IDs and updates fields successfully', async ({ api, lookups, sites, schemes }) => {
    const schemePayload = await makeSchemePayload(api);

    let scheme: any;
    let site: any;

    try {
      scheme = await schemes.create(schemePayload);
      site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const baseRes = await api.put(`/sites/${site.id}/opportunity-metadata`, {
        data: { off_market: true, green_belt: false, data_centre_potential: 'no' },
      });

      if ([403, 404, 501].includes(baseRes.status()))
        test.skip(true, `Feature not available (status ${baseRes.status()}).`);
      expect(baseRes.status()).toBe(200);

      const lookupSets: Array<{ name: string; items: any[]; field: string }> = [
        { name: 'opportunity-source', items: await lookups.get('opportunity-source'), field: 'opportunity_source_id' },
        { name: 'existing-use', items: await lookups.get('existing-use'), field: 'existing_use_id' },
        { name: 'planning-status', items: await lookups.get('planning-status'), field: 'planning_status_id' },
        { name: 'proposed-use', items: await lookups.get('proposed-use'), field: 'proposed_use_id' },
        { name: 'planning-timeframe', items: await lookups.get('planning-timeframe'), field: 'planning_timeframe_id' },
        { name: 'deal-structure', items: await lookups.get('deal-structure'), field: 'deal_structure_id' },
      ];

      for (const { name, items, field } of lookupSets) {
        if (!items.length) {
          test.skip(true, `No lookup data available for ${name}`);
          continue;
        }

        const payload = { [field]: Number(items[0].id) };
        const res = await api.put(`/sites/${site.id}/opportunity-metadata`, { data: payload });
        expect([200, 204]).toContain(res.status());
      }
    } finally {
      await Promise.allSettled([
        // keep this behaviour but ensure it never blocks deletes
        site?.id != null
          ? api.put(`/sites/${site.id}/opportunity-metadata`, { data: makeOpportunityMetadataNullPayload() })
          : Promise.resolve(),
        site?.id != null ? sites.delete(site.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });
});

// ---------------------------
// Param validation
// ---------------------------
test.describe('@api Opportunity Metadata — parameter validation', () => {
  for (const bad of INVALID_ID_CASES) {
    test(`GET rejects invalid site id (${String(bad)})`, async ({ api }) => {
      const res = await api.get(`/sites/${String(bad)}/opportunity-metadata`);
      expect(res.status()).toBe(400);
    });

    test(`PUT rejects invalid site id (${String(bad)})`, async ({ api }) => {
      const res = await api.put(`/sites/${String(bad)}/opportunity-metadata`, { data: {} });
      expect(res.status()).toBe(400);
    });
  }
});

// ---------------------------
// Auth (azure_ad)
// ---------------------------
test.describe('@api Opportunity Metadata — authentication', () => {
  test('GET unauthenticated returns 401', async () => {
    const baseURL = process.env.QA_API_BASE_URL!;
    const apiNoAuth = await request.newContext({ baseURL, extraHTTPHeaders: { 'Content-Type': 'application/json' } });
    try {
      const res = await apiNoAuth.get('/sites/1/opportunity-metadata');
      expect([401].includes(res.status())).toBe(true);
    } finally {
      await apiNoAuth.dispose();
    }
  });

  test('PUT unauthenticated returns 401 or 403', async () => {
    const baseURL = process.env.QA_API_BASE_URL!;
    const apiNoAuth = await request.newContext({ baseURL, extraHTTPHeaders: { 'Content-Type': 'application/json' } });
    try {
      const res = await apiNoAuth.put('/sites/1/opportunity-metadata', { data: {} });
      expect([401, 403].includes(res.status())).toBe(true);
    } finally {
      await apiNoAuth.dispose();
    }
  });
});
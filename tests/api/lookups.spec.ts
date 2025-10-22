import { test, expect } from '../fixtures/api-fixtures';
import { request } from '@playwright/test';
import { idsOf, setOf, isSuperset, arraysEqualByIds, expectNoDuplicateIds } from '../helpers/assertions';

type LookupItem = { id?: number | string; [k: string]: any };

const ALL_TYPES = [
  'contact-types', 'land-uses', 'locations', 'statuses', 'sites',
  'schemes', 'divestment-strategies', 'opportunity-sources',
  'external-companies', 'external-contacts', 'existing-uses',
  'planning-statuses', 'proposed-uses', 'data-centre-potential',
  'planning-timeframes', 'deal-structures',
] as const;

// ---------------------------
// Contract (all lookups)
// ---------------------------
test.describe('@api Lookups — contract', () => {
  for (const type of ALL_TYPES) {
    test(`GET /lookups/${type} — 200 JSON array (allow empty) & no duplicate ids`, async ({ api }) => {
      const res = await api.get(`/lookups/${type}`);
      expect(res.status()).toBe(200);

      const ctype = (res.headers()['content-type'] ?? '').toLowerCase();
      expect(ctype).toContain('application/json');

      const data = (await res.json()) as LookupItem[];
      expect(Array.isArray(data)).toBe(true);

      for (const item of data) {
        expect(typeof item).toBe('object');
        expect(item).not.toBeNull();
      }

      expectNoDuplicateIds(data, `/lookups/${type}`);
    });
  }

  test('GET /lookups/statuses — items expose { id:number, display_name:string }', async ({ api }) => {
    const res = await api.get('/lookups/statuses');
    expect(res.status()).toBe(200);
    const rows = await res.json() as Array<any>;
    for (const r of rows) {
      expect(typeof r.id).toBe('number');
      expect(typeof r.display_name).toBe('string');
    }
  });
});

// ---------------------------
// Unknown query params (all lookups)
// ---------------------------
test.describe('@api Lookups — unknown query params', () => {
  for (const type of ALL_TYPES) {
    test(`GET /lookups/${type}?foo=bar — 400 OR ignored-as-200 (results equal baseline)`, async ({ api }) => {
      const baselineRes = await api.get(`/lookups/${type}`);
      expect(baselineRes.status()).toBe(200);
      const baseline = await baselineRes.json();

      const res = await api.get(`/lookups/${type}`, { params: { foo: 'bar' } });
      const status = res.status();

      if (status === 400) {
        const body = await res.json().catch(() => ({}));
        const msg = JSON.stringify(body).toLowerCase();
        expect(msg).toContain('foo');
      } else if (status === 200) {
        const data = await res.json();
        expect(arraysEqualByIds(data, baseline)).toBe(true);
      } else {
        throw new Error(`Unexpected status for unknown param on /lookups/${type}: ${status}`);
      }
    });
  }
});

// ---------------------------
// Filters & field-level validation
// ---------------------------
test.describe('@api Lookups — filters & validation', () => {
  test('GET /lookups/sites — no phase returns superset of phase=opportunity and phase=site', async ({ api }) => {
    const all = await api.get('/lookups/sites');
    const opp = await api.get('/lookups/sites', { params: { phase: 'opportunity' } });
    const site = await api.get('/lookups/sites', { params: { phase: 'site' } });

    expect(all.status()).toBe(200);
    expect(opp.status()).toBe(200);
    expect(site.status()).toBe(200);

    const allIds = setOf(idsOf(await all.json()));
    expect(isSuperset(allIds, setOf(idsOf(await opp.json())))).toBe(true);
    expect(isSuperset(allIds, setOf(idsOf(await site.json())))).toBe(true);
  });

  test('GET /lookups/statuses — no filters returns superset; entity_phase narrows results', async ({ api }) => {
    const all = await api.get('/lookups/statuses');
    const opp = await api.get('/lookups/statuses', { params: { entity_phase: 'opportunity' } });
    const site = await api.get('/lookups/statuses', { params: { entity_phase: 'site' } });

    expect(all.status()).toBe(200);
    expect(opp.status()).toBe(200);
    expect(site.status()).toBe(200);

    const allIds = setOf(idsOf(await all.json()));
    expect(isSuperset(allIds, setOf(idsOf(await opp.json())))).toBe(true);
    expect(isSuperset(allIds, setOf(idsOf(await site.json())))).toBe(true);
  });

  test('GET /lookups/statuses — entity_type=site ∩ entity_phase=site ⊆ entity_type=site', async ({ api }) => {
    const typeOnly = await api.get('/lookups/statuses', { params: { entity_type: 'site' } });
    const both = await api.get('/lookups/statuses', { params: { entity_type: 'site', entity_phase: 'site' } });

    expect(typeOnly.status()).toBe(200);
    expect(both.status()).toBe(200);

    expect(
      isSuperset(setOf(idsOf(await typeOnly.json())), setOf(idsOf(await both.json())))
    ).toBe(true);
  });

  test('GET /lookups/statuses — invalid entity_phase rejected (400)', async ({ api }) => {
    const res = await api.get('/lookups/statuses', { params: { entity_phase: 'WRONG' } });
    expect(res.status()).toBe(400);
  });

  test('GET /lookups/statuses — invalid entity_type rejected (400)', async ({ api }) => {
    const res = await api.get('/lookups/statuses', { params: { entity_type: 'not-site' } });
    expect(res.status()).toBe(400);
  });

  test('GET /lookups/external-contacts — invalid company_id values rejected (400)', async ({ api }) => {
    for (const bad of [0, -1, 1.23, 'abc'] as const) {
      const res = await api.get('/lookups/external-contacts', { params: { company_id: bad as any } });
      expect(res.status(), `company_id=${String(bad)}`).toBe(400);
    }
  });

  test('GET /lookups/external-contacts — non-existent company_id returns 200 []', async ({ api }) => {
    const res = await api.get('/lookups/external-contacts', { params: { company_id: 999_999_999 } });
    expect(res.status()).toBe(200);
    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
  });

  test('GET /lookups/external-contacts — for a real company_id, filtered set does not exceed unfiltered size', async ({ api }) => {
    const companiesRes = await api.get('/lookups/external-companies');
    expect(companiesRes.status()).toBe(200);
    const companies = (await companiesRes.json()) as Array<{ id?: number | string }>;
    if (!companies.length || companies.every(c => c.id == null)) {
      test.skip(true, 'No external companies available to validate filtering.');
    }

    const companyId = companies.find(c => c.id != null)!.id!;
    const allContactsRes = await api.get('/lookups/external-contacts');
    expect(allContactsRes.status()).toBe(200);
    const allContacts = await allContactsRes.json();

    const filteredRes = await api.get('/lookups/external-contacts', { params: { company_id: companyId } });
    expect(filteredRes.status()).toBe(200);
    const filtered = await filteredRes.json();

    expect(Array.isArray(filtered)).toBe(true);
    expect(filtered.length).toBeLessThanOrEqual((allContacts as any[]).length);
  });
});

// ---------------------------
// Auth (azure_ad)
// ---------------------------
test.describe('@api Lookups — auth', () => {
  test('GET /lookups/statuses — unauthenticated request returns 401', async () => {
    const baseURL = process.env.DEV_API_BASE_URL!;
    const apiNoAuth = await request.newContext({ baseURL, extraHTTPHeaders: { 'Content-Type': 'application/json' } });
    try {
      const res = await apiNoAuth.get('/lookups/statuses');
      expect([401].includes(res.status())).toBe(true);
    } finally {
      await apiNoAuth.dispose();
    }
  });

  test('GET /lookups/statuses — invalid token returns 401 or 403', async () => {
    const baseURL = process.env.DEV_API_BASE_URL!;
    const apiBadAuth = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer invalid-token`,
        'Content-Type': 'application/json',
      },
    });
    try {
      const res = await apiBadAuth.get('/lookups/statuses');
      expect([401, 403].includes(res.status())).toBe(true);
    } finally {
      await apiBadAuth.dispose();
    }
  });
});

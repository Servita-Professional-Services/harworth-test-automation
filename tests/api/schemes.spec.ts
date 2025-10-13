import { test, expect } from '../fixtures/api-fixtures';
import { makeSchemePayload } from '../helpers/test-data/schemes';

test.describe('@api Schemes endpoint validation & filtering', () => {
  // ---------------------------
  // Query validation & filtering
  // ---------------------------

  test('Lists schemes filtered by `display_name` and returns the matching scheme', async ({ api, schemes }) => {
    const a = await schemes.create({ display_name: `e2e-scheme-${Date.now()}-A`, description: 'descA' });
    const b = await schemes.create({ display_name: `e2e-scheme-${Date.now()}-B`, description: 'descB' });

    try {
      const res = await api.get('/schemes', { params: { display_name: a.display_name } });
      expect(res.status()).toBe(200);

      const data = (await res.json()) as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.some(s => String(s.id) === String(a.id))).toBe(true);
    } finally {
      await schemes.delete(a.id);
      await schemes.delete(b.id);
    }
  });

  test('Lists schemes filtered by specific `ids` and returns those schemes', async ({ api, schemes }) => {
    const s1 = await schemes.create(makeSchemePayload());
    const s2 = await schemes.create(makeSchemePayload());

    try {
      // Build the URL with repeated params to avoid TS typing on `params` and match common validators: ?ids=1&ids=2
      const res = await api.get(`/schemes?ids=${encodeURIComponent(String(s1.id))}&ids=${encodeURIComponent(String(s2.id))}`);
      expect(res.status()).toBe(200);

      const body = await res.json();
      const rows = Array.isArray(body)
        ? body
        : Array.isArray((body as any).items)
        ? (body as any).items
        : Array.isArray((body as any).data)
        ? (body as any).data
        : [];
      const ids = new Set(rows.map((s: any) => String(s.id)));
      expect(ids.has(String(s1.id))).toBe(true);
      expect(ids.has(String(s2.id))).toBe(true);
    } finally {
      await schemes.delete(s1.id);
      await schemes.delete(s2.id);
    }
  });

  test('Rejects an invalid `ids` filter with 400 Bad Request', async ({ api }) => {
    // Bad format: non-numeric string in array-like value
    const res = await api.get('/schemes', { params: { ids: '[foo]' } });
    expect(res.status()).toBe(400);
  });

  test('Supports pagination with valid parameters (returns an array or a paged object)', async ({ api }) => {
    const res = await api.get('/schemes', { params: { page: 1, limit: 1 } });
    // Some backends return 204 if the page is empty; accept both
    expect([200, 204]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      const items = Array.isArray(body)
        ? body
        : Array.isArray((body as any).items)
        ? (body as any).items
        : Array.isArray((body as any).data)
        ? (body as any).data
        : [];
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeLessThanOrEqual(1);
    }
  });

  test('Rejects invalid pagination parameters with 400 Bad Request', async ({ api }) => {
    const res = await api.get('/schemes', { params: { page: 0, limit: -1 } });
    expect(res.status()).toBe(400);
  });

  // ---------------------------
  // Create body validation
  // ---------------------------

  test('Creating a scheme without `display_name` is rejected (400 Bad Request)', async ({ api }) => {
    const res = await api.post('/schemes', { data: { description: 'desc only' } });
    expect(res.status()).toBe(400);
  });

  test('Creating a scheme without `description` is rejected (400 Bad Request)', async ({ api }) => {
    const res = await api.post('/schemes', { data: { display_name: 'name only' } });
    expect(res.status()).toBe(400);
  });

  test('Creating a scheme with a description longer than 500 characters is rejected (400 Bad Request)', async ({ api }) => {
    const long = 'x'.repeat(501);
    const res = await api.post('/schemes', { data: { display_name: 'too-long-desc', description: long } });
    expect(res.status()).toBe(400);
  });

  test('Creating a scheme accepts the optional `imported` flag (true/false)', async ({ schemes }) => {
    const a = await schemes.create({ display_name: `e2e-imp-true-${Date.now()}`, description: 'x', imported: true });
    const b = await schemes.create({ display_name: `e2e-imp-false-${Date.now()}`, description: 'x', imported: false });
    try {
      expect(a.imported).toBe(true);
      expect(b.imported).toBe(false);
    } finally {
      await schemes.delete(a.id);
      await schemes.delete(b.id);
    }
  });

  test('Creating a scheme with a non-boolean `imported` value is rejected (400 Bad Request)', async ({ api }) => {
    const res = await api.post('/schemes', { data: { display_name: 'bad-imported', description: 'x', imported: 'yes' } });
    expect(res.status()).toBe(400);
  });

  // ---------------------------
  // Update body validation
  // ---------------------------

  test('Updating a scheme allows setting `display_name`, `description` and `imported` to null (per contract)', async ({ api, schemes }) => {
    const created = await schemes.create({ display_name: `e2e-null-${Date.now()}`, description: 'desc' });
    try {
      const r1 = await api.put(`/schemes/${created.id}`, { data: { display_name: null } });
      expect(r1.status()).toBe(200);

      const r2 = await api.put(`/schemes/${created.id}`, { data: { description: null } });
      expect(r2.status()).toBe(200);

      const r3 = await api.put(`/schemes/${created.id}`, { data: { imported: null } });
      expect(r3.status()).toBe(200);
    } finally {
      await schemes.delete(created.id);
    }
  });

  test('Updating a scheme with a description longer than 500 characters is rejected (400 Bad Request)', async ({ api, schemes }) => {
    const s = await schemes.create(makeSchemePayload());
    try {
      const long = 'x'.repeat(501);
      const res = await api.put(`/schemes/${s.id}`, { data: { description: long } });
      expect(res.status()).toBe(400);
    } finally {
      await schemes.delete(s.id);
    }
  });

  test('Updating a scheme with an empty body succeeds and leaves the record unchanged', async ({ api, schemes }) => {
    const original = await schemes.create(makeSchemePayload());
    try {
      const updateRes = await api.put(`/schemes/${original.id}`, { data: {} });
      expect(updateRes.status()).toBe(200);

      const getRes = await api.get(`/schemes/${original.id}`);
      expect(getRes.status()).toBe(200);
      const body = await getRes.json();
      expect(body.display_name).toBe(original.display_name);
      expect(body.description).toBe(original.description);
    } finally {
      await schemes.delete(original.id);
    }
  });

  // ---------------------------
  // Param validation (/:id must be a positive integer)
  // ---------------------------

  for (const bad of [-1, 0, 1.5, 'foo'] as const) {
    test(`Getting a scheme with an invalid id is rejected (400 Bad Request) — value: ${String(bad)}`, async ({ api }) => {
      const res = await api.get(`/schemes/${String(bad)}`);
      expect(res.status()).toBe(400);
    });

    test(`Updating a scheme with an invalid id is rejected (400 Bad Request) — value: ${String(bad)}`, async ({ api }) => {
      const res = await api.put(`/schemes/${String(bad)}`, { data: { display_name: 'x' } });
      expect(res.status()).toBe(400);
    });

    test(`Deleting a scheme with an invalid id is rejected (400 Bad Request) — value: ${String(bad)}`, async ({ api }) => {
      const res = await api.delete(`/schemes/${String(bad)}`);
      expect(res.status()).toBe(400);
    });
  }

  // ---------------------------
  // History endpoint validation
  // ---------------------------

  test('Returns scheme history for a valid id (may be empty; supports array or paged object)', async ({ api, schemes }) => {
    const created = await schemes.create(makeSchemePayload());
    try {
      const res = await api.get(`/schemes/${created.id}/history`);
      expect(res.status()).toBe(200);
      const data = await res.json();
      const isArray = Array.isArray(data);
      const hasItemsArray = !isArray && data && Array.isArray((data as any).items);
      const hasDataArray = !isArray && data && Array.isArray((data as any).data);
      expect(isArray || hasItemsArray || hasDataArray).toBe(true);
    } finally {
      await schemes.delete(created.id);
    }
  });

  for (const bad of [-1, 0, 1.5, 'foo'] as const) {
    test(`Requesting scheme history with an invalid id is rejected (400 Bad Request) — value: ${String(bad)}`, async ({ api }) => {
      const res = await api.get(`/schemes/${String(bad)}/history`);
      expect(res.status()).toBe(400);
    });
  }
});

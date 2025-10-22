// tests/api/sites.spec.ts
import { test, expect } from '../fixtures/api-fixtures';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import { makeSiteCreatePayload } from '../helpers/test-data/sites';
import {
  expectIdsContain,
  expectAtMostN,
  INVALID_ID_CASES,
} from '../helpers/assertions';

// ---------------------------
// Query validation & filtering (sitesQueryValidation)
// ---------------------------
test.describe('@api Sites validation & filtering', () => {
  test('Filters by display_name returns matching site', async ({ sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    try {
      const nameA = `e2e-site-${Date.now()}-A`;
      const nameB = `e2e-site-${Date.now()}-B`;
      const s1 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), display_name: nameA }));
      const s2 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), display_name: nameB }));
      try {
        const rows = await sites.list({ display_name: nameA, phase: 'opportunity', page: 1, limit: 50 });
        expectIdsContain(rows, s1.id);
      } finally {
        await sites.delete(s1.id);
        await sites.delete(s2.id);
      }
    } finally {
      await schemes.delete(scheme.id);
    }
  });

  test('Filters by scheme_id returns sites in that scheme', async ({ sites, schemes }) => {
    const parent = await schemes.create(makeSchemePayload());
    const other = await schemes.create(makeSchemePayload());
    let s1: any, s2: any;
    try {
      s1 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(parent.id) }));
      s2 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(other.id) }));

      const rows = await sites.list({ scheme_id: Number(parent.id), phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, s1.id);
    } finally {
      if (s1) await sites.delete(s1.id);
      if (s2) await sites.delete(s2.id);
      await schemes.delete(parent.id);
      await schemes.delete(other.id);
    }
  });

  test('Filters by financial_code returns matching site', async ({ sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    let created: any;
    try {
      const finCode = `FIN_${Date.now()}`;
      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), financial_code: finCode }));

      const rows = await sites.list({ financial_code: finCode, phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, created.id);
    } finally {
      if (created) await sites.delete(created.id);
      await schemes.delete(scheme.id);
    }
  });

  test('Filters by land_use_id returns the created site', async ({ sites, schemes, lookups }) => {
    const scheme = await schemes.create(makeSchemePayload());
    let created: any;
    try {
      const landUses = await lookups.landUses();
      const land_use_id = landUses[0]?.id != null ? Number(landUses[0].id) : undefined;

      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), land_use_id }));

      const rows = await sites.list({ land_use_id, phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, created.id);
    } finally {
      if (created) await sites.delete(created.id);
      await schemes.delete(scheme.id);
    }
  });

  test('Filters by ids returns selected sites', async ({ sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    let a: any, b: any;
    try {
      a = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
      b = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const rows = await sites.listByIds([a.id, b.id], { scheme_id: Number(scheme.id), phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, a.id, b.id);
    } finally {
      if (a) await sites.delete(a.id);
      if (b) await sites.delete(b.id);
      await schemes.delete(scheme.id);
    }
  });

  test('Rejects invalid ids filter (400)', async ({ api }) => {
    const res = await api.get('/sites', { params: { ids: '[foo]' } });
    expect(res.status()).toBe(400);
  });

  test('Accepts valid phase values (opportunity/site)', async ({ sites }) => {
    for (const phase of ['opportunity', 'site'] as const) {
      const rows = await sites.list({ phase, page: 1, limit: 5 });
      expect(Array.isArray(rows)).toBe(true);
    }
  });

  test('Rejects invalid phase value (400)', async ({ api }) => {
    const res = await api.get('/sites', { params: { phase: 'foobar', page: 1, limit: 5 } });
    expect(res.status()).toBe(400);
  });

  test('Paginates with valid params', async ({ sites }) => {
    const rows = await sites.list({ page: 1, limit: 1, phase: 'opportunity' });
    expect(Array.isArray(rows)).toBe(true);
    expectAtMostN(rows, 1);
  });

  const invalidPaginations = [
    { name: 'page=0', params: { page: 0, limit: 1 } },
    { name: 'limit=-1', params: { page: 1, limit: -1 } },
    { name: 'page not numeric', params: { page: 'x', limit: 1 } as Record<string, string | number> },
    { name: 'limit not numeric', params: { page: 1, limit: 'x' } as Record<string, string | number> },
  ] as const;

  for (const { name, params } of invalidPaginations) {
    test(`Rejects invalid pagination (400) — ${name}`, async ({ api }) => {
      const res = await api.get('/sites', { params });
      expect(res.status()).toBe(400);
    });
  }
});

// ---------------------------
// Create body validation (siteCreateBodyValidation)
// ---------------------------
test.describe('@api Sites create validation', () => {
  const invalidCreates = [
    { name: 'missing display_name', body: { description: 'x' } },
    { name: 'description > 500', body: { display_name: 'x', description: 'x'.repeat(501) } },
    { name: 'comment > 200', body: { display_name: 'x', comment: 'x'.repeat(201) } },
    { name: 'imported not boolean', body: { display_name: 'x', imported: 'yes' } },
    { name: 'land_use_id not positive int', body: { display_name: 'x', land_use_id: -1 } },
    { name: 'status_id not positive int', body: { display_name: 'x', status_id: 0 } },
    { name: 'scheme_id not positive int', body: { display_name: 'x', scheme_id: 1.5 } },
    { name: 'lead_contact_id wrong type', body: { display_name: 'x', lead_contact_id: 123 } },
  ] as const;

  for (const { name, body } of invalidCreates) {
    test(`Create rejected (400): ${name}`, async ({ api }) => {
      const res = await api.post('/sites', { data: body as any });
      expect(res.status()).toBe(400);
    });
  }

  test('Create without imported defaults imported=false', async ({ schemes, sites }) => {
    const scheme = await schemes.create(makeSchemePayload());
    let created: any;
    try {
      const payload = makeSiteCreatePayload({ scheme_id: Number(scheme.id) });
      delete (payload as any).imported;
      created = await sites.create(payload);
      const imported = (created as any)?.raw?.imported ?? (created as any)?.imported ?? false;
      expect(imported).toBe(false);
    } finally {
      if (created) await sites.delete(created.id);
      await schemes.delete(scheme.id);
    }
  });
});

// ---------------------------
// Update body validation (siteUpdateBodyValidation)
// ---------------------------
test.describe('@api Sites update validation', () => {
  const nullableFields = [
    'display_name',
    'description',
    'financial_code',
    'imported',
    'land_use_id',
    'location_id',
    'scheme_id',
    'address',
    'post_code',
    'status_id',
  ] as const;

  for (const field of nullableFields) {
    test(`Update allows ${field}=null (per contract)`, async ({ sites, schemes }) => {
      const scheme = await schemes.create(makeSchemePayload());
      const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
      try {
        const updated = await sites.update(created.id, { [field]: null } as any);
        expect(String(updated.id)).toBe(String(created.id));
      } finally {
        await sites.delete(created.id);
        await schemes.delete(scheme.id);
      }
    });
  }

  const invalidUpdates = [
    { name: 'description > 500', body: { description: 'x'.repeat(501) } },
    { name: 'land_use_id not positive int', body: { land_use_id: -1 } },
    { name: 'status_id not positive int', body: { status_id: 0 } },
    { name: 'scheme_id not positive int', body: { scheme_id: 1.5 } },
  ] as const;

  for (const { name, body } of invalidUpdates) {
    test(`Update rejected (400): ${name}`, async ({ api, sites, schemes }) => {
      const scheme = await schemes.create(makeSchemePayload());
      const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
      try {
        const res = await api.put(`/sites/${created.id}`, { data: body as any });
        expect(res.status()).toBe(400);
      } finally {
        await sites.delete(created.id);
        await schemes.delete(scheme.id);
      }
    });
  }

  test('Update with empty body leaves record unchanged', async ({ api, sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    try {
      const updateRes = await api.put(`/sites/${created.id}`, { data: {} });
      expect(updateRes.status()).toBe(200);

      const got = await sites.get(created.id);
      const originalName = (created as any).displayName ?? (created as any).display_name;
      const currentName = (got as any).displayName ?? (got as any).display_name;
      expect(currentName).toBe(originalName);
    } finally {
      await sites.delete(created.id);
      await schemes.delete(scheme.id);
    }
  });
});

// ---------------------------
// Param validation for site id (get/update/delete/history)
// ---------------------------
test.describe('@api Sites param validation', () => {
  for (const bad of INVALID_ID_CASES) {
    test(`GET /sites invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.get(`/sites/${String(bad)}`);
      expect(res.status()).toBe(400);
    });

    test(`PUT /sites invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.put(`/sites/${String(bad)}`, { data: { display_name: 'x' } });
      expect(res.status()).toBe(400);
    });

    test(`DELETE /sites invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.delete(`/sites/${String(bad)}`);
      expect(res.status()).toBe(400);
    });
  }
});

// ---------------------------
// History endpoint (params + pagination)
// ---------------------------
test.describe('@api Sites history validation', () => {
  test('History returns data for valid id (may be empty)', async ({ sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    try {
      const hist = await sites.history(created.id);
      expect(Array.isArray(hist)).toBe(true);
    } finally {
      await sites.delete(created.id);
      await schemes.delete(scheme.id);
    }
  });

  for (const bad of INVALID_ID_CASES) {
    test(`GET /sites/:id/history invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.get(`/sites/${String(bad)}/history`);
      expect(res.status()).toBe(400);
    });
  }

  test('History paginates with valid params; rejects invalid (400)', async ({ sites, schemes, api }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    try {
      const ok = await api.get(`/sites/${created.id}/history`, { params: { page: 1, limit: 1 } });
      expect([200, 204]).toContain(ok.status());

      const bad = await api.get(`/sites/${created.id}/history`, { params: { page: 0, limit: -1 } });
      expect(bad.status()).toBe(400);
    } finally {
      await sites.delete(created.id);
      await schemes.delete(scheme.id);
    }
  });
});

// ---------------------------
// Site contacts validation (body + params)
// ---------------------------
test.describe('@api Sites contacts validation', () => {
  const invalidSiteContactBodies = [
    { name: 'missing user_id', body: { contact_type_id: 1 } },
    { name: 'missing contact_type_id', body: { user_id: 'abc' } },
    { name: 'contact_type_id not positive int', body: { user_id: 'abc', contact_type_id: 0 } },
    { name: 'user_id wrong type', body: { user_id: 123, contact_type_id: 1 } },
  ] as const;

  for (const { name, body } of invalidSiteContactBodies) {
    test(`Contact create rejected (400): ${name}`, async ({ sites, schemes, api }) => {
      const scheme = await schemes.create(makeSchemePayload());
      const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
      try {
        const res = await api.post(`/sites/${created.id}/contacts`, { data: body as any });
        expect(res.status()).toBe(400);
      } finally {
        await sites.delete(created.id);
        await schemes.delete(scheme.id);
      }
    });
  }

  const invalidContactParams = [
    { id: -1, contactId: 1, name: 'id negative' },
    { id: 0, contactId: 1, name: 'id zero' },
    { id: 1.5, contactId: 1, name: 'id non-integer' },
    { id: 'foo', contactId: 1, name: 'id non-numeric' },
    { id: 1, contactId: -1, name: 'contactId negative' },
    { id: 1, contactId: 0, name: 'contactId zero' },
    { id: 1, contactId: 1.5, name: 'contactId non-integer' },
    { id: 1, contactId: 'bar', name: 'contactId non-numeric' },
  ] as const;

  for (const c of invalidContactParams) {
    test(`Contact delete rejected (400): ${c.name}`, async ({ api }) => {
      const res = await api.delete(`/sites/${String(c.id)}/contacts/${String(c.contactId)}`);
      expect(res.status()).toBe(400);
    });
  }
});

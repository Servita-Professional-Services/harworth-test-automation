import { test, expect } from '../fixtures/api-fixtures';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import { makeSiteCreatePayload } from '../helpers/test-data/sites';
import {
  expectIdsContain,
  expectAtMostN,
  INVALID_ID_CASES,
} from '../helpers/assertions';

type Id = number | string;

// ---------------------------
// Query validation & filtering (sitesQueryValidation)
// ---------------------------
test.describe('@api Sites validation & filtering', () => {
  test('Filters by display_name returns matching site', async ({ sites, schemes, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let s1: { id: Id } | undefined;
    let s2: { id: Id } | undefined;

    try {
      const nameA = `e2e-site-${Date.now()}-A`;
      const nameB = `e2e-site-${Date.now()}-B`;

      s1 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), display_name: nameA }));
      s2 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), display_name: nameB }));

      const rows = await sites.list({ display_name: nameA, phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, s1.id);
    } finally {
      await Promise.allSettled([
        s1?.id != null ? sites.delete(s1.id) : Promise.resolve(),
        s2?.id != null ? sites.delete(s2.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });

  test('Filters by scheme_id returns sites in that scheme', async ({ sites, schemes, api }) => {
    const parentPayload = await makeSchemePayload(api);
    const otherPayload = await makeSchemePayload(api);

    const parent = await schemes.create(parentPayload);
    const other = await schemes.create(otherPayload);

    let s1: { id: Id } | undefined;
    let s2: { id: Id } | undefined;

    try {
      s1 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(parent.id) }));
      s2 = await sites.create(makeSiteCreatePayload({ scheme_id: Number(other.id) }));

      const rows = await sites.list({ scheme_id: Number(parent.id), phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, s1.id);
    } finally {
      await Promise.allSettled([
        s1?.id != null ? sites.delete(s1.id) : Promise.resolve(),
        s2?.id != null ? sites.delete(s2.id) : Promise.resolve(),
        parent?.id != null ? schemes.delete(parent.id) : Promise.resolve(),
        other?.id != null ? schemes.delete(other.id) : Promise.resolve(),
      ]);
    }
  });

  test('Filters by financial_code returns matching site', async ({ sites, schemes, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let created: { id: Id } | undefined;

    try {
      const finCode = `FIN_${Date.now()}`;
      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), financial_code: finCode }));

      const rows = await sites.list({ financial_code: finCode, phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, created.id);
    } finally {
      await Promise.allSettled([
        created?.id != null ? sites.delete(created.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });

  test('Filters by land_use_id returns the created site', async ({ sites, schemes, lookups, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let created: { id: Id } | undefined;

    try {
      const sector = await lookups.sector();
      const sector_id = sector[0]?.id != null ? Number(sector[0].id) : undefined;

      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id), sector_id }));

      const rows = await sites.list({ sector_id, phase: 'opportunity', page: 1, limit: 50 });
      expectIdsContain(rows, created.id);
    } finally {
      await Promise.allSettled([
        created?.id != null ? sites.delete(created.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });

  test('Filters by ids returns selected sites', async ({ sites, schemes, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let a: { id: Id } | undefined;
    let b: { id: Id } | undefined;

    try {
      a = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
      b = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const rows = await sites.listByIds(
        [a.id, b.id],
        { scheme_id: Number(scheme.id), phase: 'opportunity', page: 1, limit: 50 },
      );
      expectIdsContain(rows, a.id, b.id);
    } finally {
      await Promise.allSettled([
        a?.id != null ? sites.delete(a.id) : Promise.resolve(),
        b?.id != null ? sites.delete(b.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
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

  test('Create without imported defaults imported=false', async ({ schemes, sites, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let created: { id: Id } | undefined;

    try {
      const payload = makeSiteCreatePayload({ scheme_id: Number(scheme.id) });
      delete (payload as any).imported;

      created = await sites.create(payload);

      const imported = (created as any)?.raw?.imported ?? (created as any)?.imported ?? false;
      expect(imported).toBe(false);
    } finally {
      await Promise.allSettled([
        created?.id != null ? sites.delete(created.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });
});

// ---------------------------
// Update body validation (siteUpdateBodyValidation)
// ---------------------------
test.describe('@api Sites update validation', () => {
  const nullableFields = [
    'description',
    'financial_code',
    'sector_id',
    'location_id',
    'scheme_id',
    'address',
    'post_code',
    'status_id',
  ] as const;

  for (const field of nullableFields) {
    test(`Update allows ${field}=null`, async ({ sites, schemes, api }) => {
      const schemePayload = await makeSchemePayload(api);
      const scheme = await schemes.create(schemePayload);

      let created: { id: Id } | undefined;

      try {
        created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
        const updated = await sites.update(created.id, { [field]: null } as any);
        expect(String(updated.id)).toBe(String(created.id));
      } finally {
        await Promise.allSettled([
          created?.id != null ? sites.delete(created.id) : Promise.resolve(),
          scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
        ]);
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
      const schemePayload = await makeSchemePayload(api);
      const scheme = await schemes.create(schemePayload);

      let created: { id: Id } | undefined;

      try {
        created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
        const res = await api.put(`/sites/${created.id}`, { data: body as any });
        expect(res.status()).toBe(400);
      } finally {
        await Promise.allSettled([
          created?.id != null ? sites.delete(created.id) : Promise.resolve(),
          scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
        ]);
      }
    });
  }

  test('Update with empty body leaves record unchanged', async ({ api, sites, schemes }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let created: any;

    try {
      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const updateRes = await api.put(`/sites/${created.id}`, { data: {} });
      expect(updateRes.status()).toBe(200);

      const got = await sites.get(created.id);
      const originalName = (created as any).displayName ?? (created as any).display_name;
      const currentName = (got as any).displayName ?? (got as any).display_name;
      expect(currentName).toBe(originalName);
    } finally {
      await Promise.allSettled([
        created?.id != null ? sites.delete(created.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
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
  test('History returns data for valid id (may be empty)', async ({ sites, schemes, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let created: { id: Id } | undefined;

    try {
      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
      const hist = await sites.history(created.id);
      expect(Array.isArray(hist)).toBe(true);
    } finally {
      await Promise.allSettled([
        created?.id != null ? sites.delete(created.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
    }
  });

  for (const bad of INVALID_ID_CASES) {
    test(`GET /sites/:id/history invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.get(`/sites/${String(bad)}/history`);
      expect(res.status()).toBe(400);
    });
  }

  test('History paginates with valid params; rejects invalid (400)', async ({ sites, schemes, api }) => {
    const schemePayload = await makeSchemePayload(api);
    const scheme = await schemes.create(schemePayload);

    let created: { id: Id } | undefined;

    try {
      created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));

      const ok = await api.get(`/sites/${created.id}/history`, { params: { page: 1, limit: 1 } });
      expect([200, 204]).toContain(ok.status());

      const bad = await api.get(`/sites/${created.id}/history`, { params: { page: 0, limit: -1 } });
      expect(bad.status()).toBe(400);
    } finally {
      await Promise.allSettled([
        created?.id != null ? sites.delete(created.id) : Promise.resolve(),
        scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
      ]);
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
      const schemePayload = await makeSchemePayload(api);
      const scheme = await schemes.create(schemePayload);

      let created: { id: Id } | undefined;

      try {
        created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
        const res = await api.post(`/sites/${created.id}/contacts`, { data: body as any });
        expect(res.status()).toBe(400);
      } finally {
        await Promise.allSettled([
          created?.id != null ? sites.delete(created.id) : Promise.resolve(),
          scheme?.id != null ? schemes.delete(scheme.id) : Promise.resolve(),
        ]);
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
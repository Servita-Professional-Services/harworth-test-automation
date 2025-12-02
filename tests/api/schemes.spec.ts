import { test, expect } from '../fixtures/api-fixtures';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import {
  expectIdsContain,
  expectIdsNotContain,
  expectAtMostN,
  INVALID_ID_CASES,
} from '../helpers/assertions';

// ---------------------------
// Query validation & filtering (schemesQueryValidation)
// ---------------------------
test.describe('@api Schemes validation & filtering', () => {
  test('List includes a newly created scheme', async ({ schemes, api }) => {
    const payload = await makeSchemePayload(api);
    let created: any;
    try {
      created = await schemes.create(payload);
      const rows = await schemes.list();
      expect(Array.isArray(rows)).toBe(true);
      expectIdsContain(rows, created.id);
    } finally {
      if (created) await schemes.delete(created.id);
    }
  });

  test('Filters by display_name returns matching scheme', async ({ schemes, api }) => {
    const base = `e2e-${Date.now()}`;

    const payloadA = await makeSchemePayload(api);
    const payloadB = await makeSchemePayload(api);

    const a = await schemes.create({
      ...payloadA,
      display_name: `${base}-A`,
      description: 'desc A',
    });

    const b = await schemes.create({
      ...payloadB,
      display_name: `${base}-B`,
      description: 'desc B',
    });

    try {
      const rows = await schemes.list({
        display_name: a.display_name ?? (a as any).displayName,
      });
      expectIdsContain(rows, a.id);
      expectIdsNotContain(rows, b.id);
    } finally {
      await schemes.delete(a.id);
      await schemes.delete(b.id);
    }
  });

  test('Filters by ids returns selected schemes', async ({ schemes, api }) => {
    const s1 = await schemes.create(await makeSchemePayload(api));
    const s2 = await schemes.create(await makeSchemePayload(api));

    try {
      const rows = await schemes.listByIds([s1.id, s2.id]);
      expectIdsContain(rows, s1.id, s2.id);
    } finally {
      await schemes.delete(s1.id);
      await schemes.delete(s2.id);
    }
  });

  test('Supports pagination with valid parameters', async ({ schemes }) => {
    const rows = await schemes.list({ page: 1, limit: 1 });
    expect(Array.isArray(rows)).toBe(true);
    expectAtMostN(rows, 1);
  });

  const invalidPaginations = [
    { name: 'page=0', params: { page: 0, limit: 1 } },
    { name: 'limit=-1', params: { page: 1, limit: -1 } },
    {
      name: 'page not numeric',
      params: { page: 'x', limit: 1 } as Record<string, string | number>,
    },
    {
      name: 'limit not numeric',
      params: { page: 1, limit: 'x' } as Record<string, string | number>,
    },
  ] as const;

  for (const { name, params } of invalidPaginations) {
    test(`Rejects invalid pagination (400) — ${name}`, async ({ api }) => {
      const res = await api.get('/schemes', { params });
      expect(res.status()).toBe(400);
    });
  }

  test('Rejects invalid ids filter (400)', async ({ api }) => {
    const res = await api.get('/schemes', { params: { ids: '[foo]' } });
    expect(res.status()).toBe(400);
  });
});

// ---------------------------
// Create validations (schemeCreateBodyValidation)
// ---------------------------
test.describe('@api Schemes create validations', () => {
  const invalidCreates = [
    {
      name: 'missing display_name',
      body: { description: 'd', status_id: 76 },
    },
    {
      name: 'missing description',
      body: { display_name: 'x', status_id: 76 },
    },
    {
      name: 'description > 500',
      body: {
        display_name: 'x',
        description: 'x'.repeat(501),
        status_id: 76,
      },
    },
    {
      name: 'imported not boolean',
      body: {
        display_name: 'x',
        description: 'd',
        imported: 'yes',
        status_id: 76,
      },
    },
  ] as const;

  for (const { name, body } of invalidCreates) {
    test(`Create rejected (400): ${name}`, async ({ api }) => {
      const res = await api.post('/schemes', { data: body as any });
      expect(res.status()).toBe(400);
    });
  }

  test('Creates a scheme successfully (201/200)', async ({ schemes, api }) => {
    const payload = await makeSchemePayload(api);
    let created: any;
    try {
      created = await schemes.create(payload);
      expect(created.id).toBeDefined();
      expect(created.display_name ?? (created as any).displayName).toBe(
        payload.display_name,
      );
      expect(created.description).toBe(payload.description);

      const all = await schemes.listByIds([created.id]);
      expectIdsContain(all, created.id);
    } finally {
      if (created) await schemes.delete(created.id);
    }
  });
});

// ---------------------------
// Update validations (schemeUpdateBodyValidation)
// ---------------------------
test.describe('@api Schemes update validations', () => {
  test('Updates a scheme and returns the updated object', async ({
    schemes,
    api,
  }) => {
    const original = await schemes.create(await makeSchemePayload(api));
    try {
      const updated = await schemes.update(original.id, {
        display_name: `${
          original.display_name ?? (original as any).displayName
        }-updated`,
        description: 'desc-updated',
      });
      expect(String(updated.id)).toBe(String(original.id));
      expect(updated.description).toBe('desc-updated');
    } finally {
      await schemes.delete(original.id);
    }
  });

  for (const field of ['display_name', 'description', 'imported'] as const) {
    test(`Rejects ${field}=null on update (400)`, async ({ api, schemes }) => {
      const s = await schemes.create(await makeSchemePayload(api));
      try {
        const res = await api.put(`/schemes/${s.id}`, {
          data: { [field]: null } as any,
        });
        expect(res.status()).toBe(400);
      } finally {
        await schemes.delete(s.id);
      }
    });
  }

  const invalidUpdates = [
    { name: 'description > 500', body: { description: 'x'.repeat(501) } },
  ] as const;

  for (const { name, body } of invalidUpdates) {
    test(`Update rejected (400): ${name}`, async ({ api, schemes }) => {
      const s = await schemes.create(await makeSchemePayload(api));
      try {
        const res = await api.put(`/schemes/${s.id}`, { data: body as any });
        expect(res.status()).toBe(400);
      } finally {
        await schemes.delete(s.id);
      }
    });
  }
});

// ---------------------------
// Delete and param validations (get/update/delete/history)
// ---------------------------
test.describe('@api Schemes delete & params', () => {
  test('Deletes a scheme (204) and removes it from list', async ({
    schemes,
    api,
  }) => {
    const s = await schemes.create(await makeSchemePayload(api));
    await schemes.delete(s.id);
    const rows = await schemes.listByIds([s.id]);
    expectIdsNotContain(rows, s.id);
  });

  for (const bad of INVALID_ID_CASES) {
    test(`GET /schemes invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.get(`/schemes/${String(bad)}`);
      expect(res.status()).toBe(400);
    });

    test(`PUT /schemes invalid id (400) — ${String(bad)}`, async ({ api }) => {
      const res = await api.put(`/schemes/${String(bad)}`, {
        data: { display_name: 'x' },
      });
      expect(res.status()).toBe(400);
    });

    test(`DELETE /schemes invalid id (400) — ${String(bad)}`, async ({
      api,
    }) => {
      const res = await api.delete(`/schemes/${String(bad)}`);
      expect(res.status()).toBe(400);
    });
  }
});

// ---------------------------
// History endpoint (params + pagination)
// ---------------------------
test.describe('@api Schemes history validation', () => {
  test('History returns data for valid id (may be empty)', async ({
    schemes,
    api,
  }) => {
    const s = await schemes.create(await makeSchemePayload(api));
    try {
      const hist = await schemes.history(s.id);
      expect(Array.isArray(hist)).toBe(true);
    } finally {
      await schemes.delete(s.id);
    }
  });

  for (const bad of INVALID_ID_CASES) {
    test(`GET /schemes/:id/history invalid id (400) — ${String(bad)}`, async ({
      api,
    }) => {
      const res = await api.get(`/schemes/${String(bad)}/history`);
      expect(res.status()).toBe(400);
    });
  }

  test('History paginates with valid params; rejects invalid (400)', async ({
    schemes,
    api,
  }) => {
    const s = await schemes.create(await makeSchemePayload(api));
    try {
      const ok = await api.get(`/schemes/${s.id}/history`, {
        params: { page: 1, limit: 1 },
      });
      expect([200, 204]).toContain(ok.status());

      const bad = await api.get(`/schemes/${s.id}/history`, {
        params: { page: 0, limit: -1 },
      });
      expect(bad.status()).toBe(400);
    } finally {
      await schemes.delete(s.id);
    }
  });
});

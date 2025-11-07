import { test, expect } from '../fixtures/api-fixtures';
import {
  expectAtMostN,
  INVALID_ID_CASES,
  expectDeleted,
} from '../helpers/assertions';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import { makeSiteCreatePayload } from '../helpers/test-data/sites';
import { makeLandUnitPayload } from '../helpers/test-data/land-units';

test.describe('@api Land Units — query validation & filtering', () => {
  test('GET /land-units returns 200 with array of land units', async ({ landUnits }) => {
    const rows = await landUnits.list();
    expect(Array.isArray(rows)).toBe(true);
  });

  for (const bad of INVALID_ID_CASES) {
    test(`GET /land-units rejects invalid id (${bad}) with 400`, async ({ api }) => {
      const res = await api.get('/land-units', { params: { id: bad } });
      expect(res.status()).toBe(400);
    });
  }

  test('GET /land-units rejects invalid pagination parameters (400)', async ({ api }) => {
    for (const params of [
      { page: 0, limit: 1 },
      { page: 1, limit: -1 },
      { page: 'x', limit: 1 },
    ]) {
      const res = await api.get('/land-units', { params });
      expect(res.status()).toBe(400);
    }
  });

  test('GET /land-units accepts valid pagination (page=1, limit=1)', async ({ landUnits }) => {
    const rows = await landUnits.list({ page: 1, limit: 1 });
    expectAtMostN(rows, 1);
  });

  test('GET /land-units rejects invalid parent_type value (400)', async ({ api }) => {
    const res = await api.get('/land-units', { params: { parent_type: 'invalid' } });
    expect(res.status()).toBe(400);
  });

  test('GET /land-units rejects unknown query param (400)', async ({ api }) => {
    const res = await api.get('/land-units', { params: { foo: 'bar' } });
    expect(res.status()).toBe(400);
  });
});

test.describe('@api Land Units — create validation', () => {
  const invalidCreates = [
    { name: 'missing display_name', body: { divestment_strategy_id: 1, land_use_id: 1, measure: 1, unit_of_measure: 'plots' } },
    { name: 'missing divestment_strategy_id', body: { display_name: 'A', land_use_id: 1, measure: 1, unit_of_measure: 'plots' } },
    { name: 'missing land_use_id', body: { display_name: 'A', divestment_strategy_id: 1, measure: 1, unit_of_measure: 'plots' } },
    { name: 'missing measure', body: { display_name: 'A', divestment_strategy_id: 1, land_use_id: 1, unit_of_measure: 'plots' } },
    { name: 'missing unit_of_measure', body: { display_name: 'A', divestment_strategy_id: 1, land_use_id: 1, measure: 1 } },
    { name: 'invalid unit_of_measure', body: { display_name: 'A', divestment_strategy_id: 1, land_use_id: 1, measure: 1, unit_of_measure: 'invalid' } },
    { name: 'parent_id without parent_type', body: { display_name: 'A', divestment_strategy_id: 1, land_use_id: 1, measure: 1, unit_of_measure: 'plots', parent_id: 1 } },
    { name: 'parent_type without parent_id', body: { display_name: 'A', divestment_strategy_id: 1, land_use_id: 1, measure: 1, unit_of_measure: 'plots', parent_type: 'site' } },
  ] as const;

  for (const { name, body } of invalidCreates) {
    test(`POST /land-units rejects invalid body: ${name}`, async ({ api }) => {
      const res = await api.post('/land-units', { data: body as any });
      expect(res.status()).toBe(400);
    });
  }

  test('@api POST /land-units creates a land unit successfully with valid data', async ({ landUnits, lookups, sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    const divStrategies = await lookups.divestmentStrategies();
    const landUses = await lookups.landUses();

    const payload = makeLandUnitPayload({ divStrategies, landUses, site });
    let created: any;
    try {
      created = await landUnits.create(payload);
      expect(created.id).toBeDefined();

      const got = await landUnits.get(created.id);
      expect(String(got.id)).toBe(String(created.id));
    } finally {
      if (created) await landUnits.delete(created.id);
      await sites.delete(site.id);
      await schemes.delete(scheme.id);
    }
  });
});

test.describe('@api Land Units — update validation', () => {
  test('PUT /land-units rejects invalid unit_of_measure (400)', async ({ landUnits, lookups, sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    const divStrategies = await lookups.divestmentStrategies();
    const landUses = await lookups.landUses();
    const payload = makeLandUnitPayload({ divStrategies, landUses, site });
    const created = await landUnits.create(payload);

    const invalidUpdate = { unit_of_measure: 'invalid' };
    const res = await landUnits.api.put(`/land-units/${created.id}`, { data: invalidUpdate });
    expect(res.status()).toBe(400);

    await landUnits.delete(created.id);
    await sites.delete(site.id);
    await schemes.delete(scheme.id);
  });

  test('PUT /land-units updates successfully with valid data', async ({ landUnits, lookups, sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    const divStrategies = await lookups.divestmentStrategies();
    const landUses = await lookups.landUses();
    const payload = makeLandUnitPayload({ divStrategies, landUses, site });
    const created = await landUnits.create(payload);

    const updated = await landUnits.update(created.id, { measure: 999 });
    expect(updated.measure).toBe(999);

    await landUnits.delete(created.id);
    await sites.delete(site.id);
    await schemes.delete(scheme.id);
  });
});

test.describe('@api Land Units — delete & history', () => {
  test('DELETE /land-units deletes a created land unit successfully', async ({ landUnits, lookups, sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    const divStrategies = await lookups.divestmentStrategies();
    const landUses = await lookups.landUses();
    const payload = makeLandUnitPayload({ divStrategies, landUses, site });
    const created = await landUnits.create(payload);

    await landUnits.delete(created.id);
    await expectDeleted((ids) => landUnits.listByIds(ids), created.id);
    await sites.delete(site.id);
    await schemes.delete(scheme.id);
  });

  test('GET /land-units/:id/history returns empty array for valid ID (no history yet)', async ({ landUnits, lookups, sites, schemes }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    const divStrategies = await lookups.divestmentStrategies();
    const landUses = await lookups.landUses();
    const payload = makeLandUnitPayload({ divStrategies, landUses, site });
    const created = await landUnits.create(payload);

    const history = await landUnits.history(created.id);
    expect(Array.isArray(history)).toBe(true);

    await landUnits.delete(created.id);
    await sites.delete(site.id);
    await schemes.delete(scheme.id);
  });
});

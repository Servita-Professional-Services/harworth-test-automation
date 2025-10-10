import { test, expect } from '../fixtures/api-fixtures';
import { makeSchemePayload } from '../helpers/test-data/schemes'; 
import { makeSiteCreatePayload, makeSiteUpdatePayload } from '../helpers/test-data/sites'; 

const idsEqual = (a: unknown, b: unknown) =>
  a != null && b != null && String(a) === String(b);

test.describe('@api Sites endpoint CRUD tests', () => {
  test('GET /sites returns 200 and an array', async ({ sites }) => {
    const list = await test.step('List sites (phase=opportunity)', async () => sites.list('opportunity'));
    expect(Array.isArray(list)).toBe(true);
  });

  test('POST /sites creates a site; verify via GET', async ({ schemes, sites, lookups, users }) => {
    let schemeId: number | string | undefined;
    let siteId: number | string | undefined;

    try {
      // Create parent scheme (FK)
      const scheme = await test.step('Create scheme for site FK', async () => schemes.create(makeSchemePayload()));
      schemeId = scheme.id;

      // Resolve reference data from lookups 
      const landUses = await lookups.landUses();
      const statuses = await lookups.statuses();

      const land_use_id = landUses[0]?.id;
      const status_id = statuses[0]?.id;

      // Resolve lead contact via users/access if email provided
      let lead_contact_id: string | undefined;
      const email = process.env.DEV_PORTAL_LOGIN_EMAIL;
      if (email) {
        const found = await users.accessByEmail(email);
        lead_contact_id = found?.[0]?.id;
      }

      const payload = makeSiteCreatePayload({
        scheme_id: Number(schemeId),
        land_use_id,
        status_id,
        lead_contact_id,
      });

      // Create
      const created = await test.step('Create site', async () => sites.create(payload));
      siteId = created.id;

      // Assert immediate fields if present, then verify relations via GET
      if (created.displayName) {
        expect(created.displayName).toBe(payload.display_name);
      }

      const fetched = await test.step('Fetch created site by id', async () => sites.getById(siteId!));

      if (payload.scheme_id !== undefined) {
        expect(idsEqual(fetched.schemeId, payload.scheme_id)).toBe(true);
      }
      if (payload.land_use_id !== undefined) {
        expect(idsEqual(fetched.landUseId, payload.land_use_id)).toBe(true);
      }
      if (payload.status_id !== undefined) {
        expect(idsEqual(fetched.statusId, payload.status_id)).toBe(true);
      }
      if (payload.lead_contact_id !== undefined) {
        expect(idsEqual(fetched.leadContactId, payload.lead_contact_id)).toBe(true);
      }
    } finally {
      if (siteId != null) await test.step('Delete site', async () => sites.delete(siteId!));
      if (schemeId != null) await test.step('Delete scheme', async () => schemes.delete(schemeId!));
    }
  });

  test('PUT /sites/{id} updates a site; verify via response + GET', async ({ schemes, sites, lookups }) => {
    let schemeId: number | string | undefined;
    let siteId: number | string | undefined;

    try {
      // Parent scheme
      schemeId = (await schemes.create(makeSchemePayload())).id;

      // Create site
      const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(schemeId) }));
      siteId = created.id;

      // Pick a (possibly different) status for the update
      const statuses = await lookups.statuses();
      const newStatusId = statuses[1]?.id ?? statuses[0]?.id;

      const updatePayload = makeSiteUpdatePayload({
        scheme_id: Number(schemeId), // keep same unless moving site between schemes
        status_id: newStatusId,
      });

      // Update
      const updated = await test.step('Update site', async () => sites.update(siteId!, updatePayload));

      // Assert fields the update response returns (normalized)
      if (updatePayload.display_name) expect(updated.displayName).toBe(updatePayload.display_name);
      if (updatePayload.post_code) expect(updated.postCode).toBe(updatePayload.post_code);

      // Assert relational fields via GET for safety
      const fetched = await test.step('Fetch updated site by id', async () => sites.getById(siteId!));
      if (updatePayload.status_id !== undefined) {
        expect(idsEqual(fetched.statusId, updatePayload.status_id)).toBe(true);
      }
      if (updatePayload.scheme_id !== undefined) {
        expect(idsEqual(fetched.schemeId, updatePayload.scheme_id)).toBe(true);
      }
    } finally {
      if (siteId != null) await test.step('Delete site', async () => sites.delete(siteId!));
      if (schemeId != null) await test.step('Delete scheme', async () => schemes.delete(schemeId!));
    }
  });

  test('GET /sites/{id} returns a site by ID', async ({ schemes, sites }) => {
    let schemeId: number | string | undefined;
    let siteId: number | string | undefined;

    try {
      schemeId = (await schemes.create(makeSchemePayload())).id;
      const created = await sites.create(makeSiteCreatePayload({ scheme_id: Number(schemeId) }));
      siteId = created.id;

      const fetched = await test.step('Fetch site by id', async () => sites.getById(siteId!));
      expect(fetched.id).toBe(siteId);
      if (created.displayName) expect(fetched.displayName).toBe(created.displayName);
    } finally {
      if (siteId != null) await test.step('Delete site', async () => sites.delete(siteId!));
      if (schemeId != null) await test.step('Delete scheme', async () => schemes.delete(schemeId!));
    }
  });

  test('DELETE /sites/{id} returns 204 (creates its own site first)', async ({ schemes, sites }) => {
    const scheme = await schemes.create(makeSchemePayload());
    const site = await sites.create(makeSiteCreatePayload({ scheme_id: Number(scheme.id) }));
    await test.step('Delete site', async () => sites.delete(site.id));
    await test.step('Delete scheme', async () => schemes.delete(scheme.id));
  });
});

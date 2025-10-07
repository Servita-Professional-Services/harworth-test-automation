import { test, expect } from '../fixtures/api-fixtures';
import { makeSchemePayload } from '../helpers/test-data/schemes';

test.describe('@api Schemes endpoint CRUD tests', () => {
  test('GET /schemes returns 200 and a non-empty array', async ({ schemes }) => {
    const list = await test.step('List schemes', async () => schemes.list());
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  test('POST /schemes creates a scheme', async ({ schemes }) => {
    const payload = makeSchemePayload();
    let createdId: number | string | undefined;

    try {
      const created = await test.step('Create scheme', async () => schemes.create(payload));
      createdId = created.id;

      expect(created.display_name).toBe(payload.display_name);
      expect(created.description).toBe(payload.description);
      expect(created.id).toBeDefined();

      const all = await schemes.list();
      expect(all.some(s => String(s.id) === String(createdId))).toBe(true);
    } finally {
      if (createdId != null) {
        await test.step('Cleanup created scheme', async () => schemes.delete(createdId!));
      }
    }
  });

  test('PUT /schemes/{id} updates a scheme and returns the updated object', async ({ schemes }) => {
    const original = makeSchemePayload();
    let id: number | string | undefined;

    try {
      id = (await schemes.create(original)).id;

      const updatedPayload = {
        display_name: `${original.display_name}-updated`,
        description: `${original.description}-updated`,
      };

      const updated = await test.step('Update scheme', async () =>
        schemes.update(id!, updatedPayload)
      );

      expect(updated.id).toBe(id);
      expect(updated.display_name).toBe(updatedPayload.display_name);
      expect(updated.description).toBe(updatedPayload.description);
    } finally {
      if (id != null) {
        await test.step('Cleanup updated scheme', async () => schemes.delete(id!));
      }
    }
  });

  test('DELETE /schemes/{id} returns 204 and removes the scheme', async ({ schemes }) => {
    const created = await schemes.create(makeSchemePayload());
    const id = created.id;

    await test.step('Delete scheme (expect 204)', async () => schemes.delete(id));

    const all = await schemes.list();
    expect(all.some(s => String(s.id) === String(id))).toBe(false);
  });
});

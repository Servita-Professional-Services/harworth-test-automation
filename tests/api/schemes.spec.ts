// tests/api/schemes.spec.ts
import { test, expect } from "../ui/fixtures/api-fixtures"; 

test.describe('@api Schemes endpoint', () => {
  test('GET /schemes returns 200 and a non-empty array', async ({ api }) => {
    const response = await test.step('Request schemes', async () => {
      return api.get('/schemes');
    });

    await test.step('Validate status', async () => {
      expect(response.status(), 'expected HTTP 200').toBe(200);
    });

    await test.step('Validate payload shape', async () => {
      const data = await response.json();
      expect(Array.isArray(data), 'response should be an array').toBe(true);
      expect((data as unknown[]).length, 'array should not be empty').toBeGreaterThan(0);
    });
  });

});

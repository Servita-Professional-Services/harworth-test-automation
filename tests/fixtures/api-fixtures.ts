import { test as base, expect, request, APIRequestContext } from '@playwright/test';
import { SitesClient } from '../../src/clients/sites'; 
import { SchemesClient } from '../../src/clients/schemes'; 

type Lookups = {
  landUses: () => Promise<Array<{ id: number }>>;
  statuses: () => Promise<Array<{ id: number }>>;
};

type ApiFixtures = {
  api: APIRequestContext;
  sites: SitesClient;
  schemes: SchemesClient;
  lookups: Lookups;
};

const API_BASE_URL = process.env.DEV_API_BASE_URL as string;
const API_TOKEN = process.env.DEV_API_AUTH_TOKEN as string;

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    const api = await request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    await use(api);
    await api.dispose();
  },

  schemes: async ({ api }, use) => {
    await use(new SchemesClient(api));
  },

  sites: async ({ api }, use) => {
    await use(new SitesClient(api));
  },

  lookups: async ({ api }, use) => {
    const lookups: Lookups = {
      landUses: async () => {
        const res = await api.get('/lookups/land-uses');
        expect(res.status(), 'GET /lookups/land-uses').toBe(200);
        return (await res.json()) as Array<{ id: number }>;
      },
      statuses: async () => {
        const res = await api.get('/lookups/statuses');
        expect(res.status(), 'GET /lookups/statuses').toBe(200);
        return (await res.json()) as Array<{ id: number }>;
      },
    };
    await use(lookups);
  },
});

export { expect };

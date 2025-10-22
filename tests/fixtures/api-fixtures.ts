import { test as base, expect, request, APIRequestContext } from '@playwright/test';
import { SitesClient } from '../../src/clients/sites';
import { SchemesClient } from '../../src/clients/schemes';
import { LookupsClient } from '../../src/clients/lookups';
export { request } from '@playwright/test'; 

type ApiFixtures = {
  api: APIRequestContext;
  sites: SitesClient;
  schemes: SchemesClient;
  lookups: LookupsClient;
};

const API_BASE_URL = process.env.DEV_API_BASE_URL as string;
const API_TOKEN = process.env.DEV_API_AUTH_TOKEN as string;

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    if (!API_BASE_URL) {
      throw new Error('DEV_API_BASE_URL is not set');
    }
    if (!API_TOKEN) {
      throw new Error('DEV_API_AUTH_TOKEN is not set');
    }

    const api = await request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    try {
      await use(api);
    } finally {
      await api.dispose();
    }
  },

  schemes: async ({ api }, use) => {
    await use(new SchemesClient(api));
  },

  sites: async ({ api }, use) => {
    await use(new SitesClient(api));
  },

  lookups: async ({ api }, use) => {
    await use(new LookupsClient(api));
  },
});

export { expect };

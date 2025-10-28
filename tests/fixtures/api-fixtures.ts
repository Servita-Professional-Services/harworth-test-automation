import { test as base, expect, request, APIRequestContext } from '@playwright/test';
import { SitesClient } from '../../src/clients/sites';
import { SchemesClient } from '../../src/clients/schemes';
import { LookupsClient } from '../../src/clients/lookups';
import { LandUnitsClient } from '../../src/clients/land-units';

type ApiFixtures = {
  api: APIRequestContext;
  sites: SitesClient;
  schemes: SchemesClient;
  lookups: LookupsClient;
  landUnits: LandUnitsClient;
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

  schemes: async ({ api }, use) => use(new SchemesClient(api)),

  sites: async ({ api }, use) => use(new SitesClient(api)),

  lookups: async ({ api }, use) => use(new LookupsClient(api)),

  landUnits: async ({ api }, use) => use(new LandUnitsClient(api)),
});

export { expect, request };

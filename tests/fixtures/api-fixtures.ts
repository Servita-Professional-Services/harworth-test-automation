import { test as base, request, APIRequestContext } from '@playwright/test';
import { SchemesClient } from '../../src/clients/schemes'; 
import { SitesClient } from '../../src/clients/sites'; 
import { LookupsClient } from '../../src/clients/lookups'; 
import { UsersClient } from '../../src/clients/users'; 

type Fixtures = {
  api: APIRequestContext;
  schemes: SchemesClient;
  sites: SitesClient;
  lookups: LookupsClient;
  users: UsersClient;
};

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const baseURL = process.env.DEV_API_BASE_URL;
    const token = process.env.DEV_API_AUTH_TOKEN;
    if (!baseURL) throw new Error('DEV_API_BASE_URL is not set');
    if (!token) throw new Error('DEV_API_AUTH_TOKEN is not set');

    const api = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
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

  users: async ({ api }, use) => {
    await use(new UsersClient(api));
  },
});

export const expect = base.expect;

import { test as base, request, APIRequestContext } from '@playwright/test';
import { SchemesClient } from '../../src/clients/schemes';

type Fixtures = {
  api: APIRequestContext;
  schemes: SchemesClient;
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
});

export const expect = base.expect;

import { test as base, request, type APIRequestContext } from '@playwright/test';
import { SitesClient } from '../../src/clients/sites';
import { SchemesClient } from '../../src/clients/schemes';
import { LookupsClient } from '../../src/clients/lookups';
import { OpportunityMetadataClient } from '../../src/clients/opportunity-metadata';
import { LandUnitsClient } from '../../src/clients/land-units';

type ApiFixtures = {
  api: APIRequestContext;
  sites: SitesClient;
  schemes: SchemesClient;
  lookups: LookupsClient;
  landUnits: LandUnitsClient;
  opportunityMetadata: OpportunityMetadataClient;
};

const API_BASE_URL = process.env.QA_API_BASE_URL as string;
const API_TOKEN = process.env.QA_API_AUTH_TOKEN as string;

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
    await use(new LookupsClient(api));
  },

  landUnits: async ({ api }, use) => {
    await use(new LandUnitsClient(api));
  },

  opportunityMetadata: async ({ api }, use) => {
    await use(new OpportunityMetadataClient(api));
  },
});

export const expect = test.expect;
export { request };
import type { APIRequestContext } from '@playwright/test';
import { generateRandomString } from '../generate-random-string';

export interface SiteDataForProcessing {
  display_name: string;
  financial_code?: string | null;
  description?: string | null;
  post_code?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  sector: string | null;
  deal_structures: string[];
  division: string | null;
  sub_division: string | null;
  scheme_name: string;
  imported: boolean;
  dm: string[];
  pm: string[];
  planner: string[];
  fbp: string[];
  al: string[];
  fl: string[];
  legal: string[];
}

export interface SchemeDataForProcessing {
  display_name: string;
  description: string;
  status: string | null;
}

export type AdminSchemesImportPayload = {
  sites: SiteDataForProcessing[];
  schemes: SchemeDataForProcessing[];
};

export const makeAdminImportSchemeRow = (slug: string): SchemeDataForProcessing => {
  const schemeName = `e2e ${slug} (South Yorkshire)`;
  return {
    display_name: schemeName,
    description: `e2e description ${slug}`,
    status: 'Live',
  };
};

export const makeAdminImportSiteRow = (slug: string, schemeName: string): SiteDataForProcessing => {
  return {
    display_name: `e2e-site-${slug}`,
    financial_code: slug,
    description: `e2e description ${slug}`,
    post_code: 'S60 5TR',
    latitude: '53.3903',
    longitude: '-1.375424',
    sector: 'I&L',
    deal_structures: ['Freehold'],
    division: 'ENC',
    sub_division: null,
    scheme_name: schemeName,
    imported: true,
    dm: ['James Watson'],
    pm: [],
    planner: [],
    fbp: ['Catherine Givans'],
    al: [],
    fl: ['Greg Moorhouse'],
    legal: [],
  };
};

export const makeAdminImportPayload = async (_api: APIRequestContext) => {
  const slug = `e2e-admin-import-${generateRandomString(8)}`;

  const schemeRow = makeAdminImportSchemeRow(slug);
  const siteRow = makeAdminImportSiteRow(slug, schemeRow.display_name);

  const payload: AdminSchemesImportPayload = {
    schemes: [schemeRow],
    sites: [siteRow],
  };

  return {
    payload,
    slug,
    schemeRow,
    siteRow,
    Scheme: schemeRow.display_name,
    Site: siteRow.display_name,
    Financial_Code: siteRow.financial_code!,
  };
};
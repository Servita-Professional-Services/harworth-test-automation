import type { APIRequestContext } from '@playwright/test';
import { generateRandomString } from '../generate-random-string';

export interface AdminImportRow {
  Scheme: string;
  Site: string;
  Financial_Code: string;
  Description: string;
  Postcode: string;
  Lat: string;
  Long: string;
  'DM / AM / Playbook Owner': string[];
  PM: null;
  Planning: null;
  'Functional Lead': string[];
  'FBP contact': string[];
  'Acquisitons lead': null;
  Division: string;
  'Resi/I&L/Hybrid': string;
  'Ownership type': string;
}

export const makeAdminImportRow = async (
  _api: APIRequestContext,
): Promise<AdminImportRow> => {
    const slug = `e2e-admin-import-${generateRandomString(8)}`;
  return {
    Scheme: `e2e ${slug} (South Yorkshire)`,
    Site: `e2e-site-${slug}`,
    Financial_Code: slug,
    Description: `e2e description ${slug}`,
    Postcode: 'S60 5TR',
    Lat: '53.3903',
    Long: '-1.375424',
    'DM / AM / Playbook Owner': ['James Watson'],
    PM: null,
    Planning: null,
    'Functional Lead': ['Greg Moorhouse'],
    'FBP contact': ['Catherine Givans'],
    'Acquisitons lead': null,
    Division: 'Core Investment Portfolio',
    'Resi/I&L/Hybrid': 'I&L - IP',
    'Ownership type': 'Freehold',
  };
};
import { generateUniqueName, generateRandomString } from '../generate-random-string'; 
import type { CreateSite, UpdateSite } from '../../../src/clients/sites'; 

type CreateSiteInput = Partial<CreateSite>;

export const makeSiteCreatePayload = (opts: CreateSiteInput = {}): CreateSite => {
  const payload: CreateSite = {
    display_name: opts.display_name ?? generateUniqueName('e2e-site'),
    financial_code:
      opts.financial_code ??
      `FIN_${generateRandomString(4).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
    status_id: opts.status_id ?? '3',
    address: opts.address ?? '123 Test Street',
    post_code: opts.post_code ?? 'LS79 7TP',
    comment: opts.comment ?? 'E2E test site',
  };

  if (opts.scheme_id !== undefined) payload.scheme_id = opts.scheme_id;
  if (opts.sector_id !== undefined) payload.sector_id = opts.sector_id;
  if (opts.location_id !== undefined) payload.location_id = opts.location_id;
  if (opts.status_id !== undefined) payload.status_id = opts.status_id;
  if (opts.lead_contact_id !== undefined) payload.lead_contact_id = opts.lead_contact_id;

  return payload;
};

export const makeSiteUpdatePayload = (overrides: UpdateSite = {}): UpdateSite => {
  const base: UpdateSite = {
    display_name: generateUniqueName('e2e-site-updated'),
    post_code: 'LS79 9ZZ',
  };
  return { ...base, ...overrides };
};

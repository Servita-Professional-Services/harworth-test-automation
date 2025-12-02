import { generateUniqueName } from '../generate-random-string';
import { getSchemeStatusId } from '../api';
import type { APIRequestContext } from '@playwright/test';

export const makeSchemePayload = async (api: APIRequestContext) => {
  const status_id = await getSchemeStatusId(api);

  return {
    display_name: generateUniqueName('e2e-scheme'),
    description: generateUniqueName('e2e-desc'),
    status_id,
  };
};

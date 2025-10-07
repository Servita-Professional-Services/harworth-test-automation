import { generateUniqueName } from "../generate-random-string"; 

export const makeSchemePayload = () => ({
  display_name: generateUniqueName('e2e-scheme'),
  description: generateUniqueName('e2e-desc'),
});

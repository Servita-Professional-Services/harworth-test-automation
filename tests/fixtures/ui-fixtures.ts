import { test as base } from '@playwright/test';
import { PortalWelcome } from '../../src/pages/welcome'; 
import { PortalLogin } from '../../src/pages/login'; 
type Fixtures = {
  portalWelcome: PortalWelcome;
  portalLogin: PortalLogin; 
};

export const test = base.extend<Fixtures>({
  portalWelcome: async ({ page }, use) => {
    await use(new PortalWelcome(page));
  },

  portalLogin: async ({ page, context }, use) => {
    await use(new PortalLogin(page));
  },
});

export const expect = test.expect;

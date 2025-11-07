import { test as base } from '@playwright/test';
import { PortalWelcome } from '../../src/pages/welcome';
import { PortalLogin } from '../../src/pages/login';
import { PortalNavbar } from '../../src/pages/navbar';

type Fixtures = {
  portalWelcome: PortalWelcome;
  portalNavbar: PortalNavbar;

  makePortalLogin: (p: import('@playwright/test').Page) => PortalLogin;
};

export const test = base.extend<Fixtures>({
  portalWelcome: async ({ page }, use) => {
    await use(new PortalWelcome(page));
  },

  portalNavbar: async ({ page }, use) => {
    await use(new PortalNavbar(page));
  },

  makePortalLogin: async ({}, use) => {
    await use((p) => new PortalLogin(p));
  },
});

export const expect = test.expect;

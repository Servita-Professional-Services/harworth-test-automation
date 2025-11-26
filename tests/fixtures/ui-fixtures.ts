import { test as base } from './api-fixtures';
import { PortalWelcome } from '../../src/pages/welcome';
import { PortalLogin } from '../../src/pages/login';
import { PortalNavbar } from '../../src/pages/navbar';
import { PortalSchemeDirectory } from '../../src/pages/scheme-directory';
import { PortalSites } from '../../src/pages/sites';

type UiFixtures = {
  portalWelcome: PortalWelcome;
  portalNavbar: PortalNavbar;
  portalSchemeDirectory: PortalSchemeDirectory;
  portalSites: PortalSites;

  makePortalLogin: (p: import('@playwright/test').Page) => PortalLogin;
};

export const test = base.extend<UiFixtures>({
  portalWelcome: async ({ page }, use) => {
    await use(new PortalWelcome(page));
  },

  portalNavbar: async ({ page }, use) => {
    await use(new PortalNavbar(page));
  },

  portalSchemeDirectory: async ({ page }, use) => {
    await use(new PortalSchemeDirectory(page));
  },

  portalSites: async ({ page }, use) => {
    await use(new PortalSites(page));
  },

  makePortalLogin: async ({}, use) => {
    await use((p) => new PortalLogin(p));
  },
});

export const expect = test.expect;

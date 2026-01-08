import { test as base } from './api-fixtures';
import { PortalWelcome } from '../../src/pages/welcome';
import { PortalLogin } from '../../src/pages/login';
import { PortalNavbar } from '../../src/pages/navbar';
import { PortalSchemeDirectory } from '../../src/pages/scheme-directory';
import { PortalSites } from '../../src/pages/sites';
import { PortalAcquisitionTracker } from '../../src/pages/acquisition-tracker';

type UiFixtures = {
  portalWelcome: PortalWelcome;
  portalNavbar: PortalNavbar;
  portalSchemeDirectory: PortalSchemeDirectory;
  portalSites: PortalSites;
  portalAcquisitionTracker: PortalAcquisitionTracker;

  makePortalLogin: (p: import('@playwright/test').Page) => PortalLogin;
  loginToPortal: () => Promise<void>;
  cleanupOpportunityById: (siteId: number) => Promise<void>;
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

  portalAcquisitionTracker: async ({ page }, use) => {
    await use(new PortalAcquisitionTracker(page));
  },

  makePortalLogin: async ({}, use) => {
    await use((p) => new PortalLogin(p));
  },

  loginToPortal: async ({ context, portalWelcome, makePortalLogin }, use) => {
    const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
    const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

    await use(async () => {
      await portalWelcome.open();
      const loginPage = await portalWelcome.clickSignInAndGetLoginPage(context);
      const portalLogin = makePortalLogin(loginPage);

      await portalLogin.assertLoaded();
      await portalLogin.login(email, password);
    });
  },

  cleanupOpportunityById: async ({ opportunityMetadata }, use) => {
    await use(async (siteId: number) => {
      await opportunityMetadata.delete(siteId);
    });
  },
});

export const expect = test.expect;
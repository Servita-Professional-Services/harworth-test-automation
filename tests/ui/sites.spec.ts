import { test, expect } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import { cleanupWithReport } from '../helpers/cleanup-helper';

const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

const siteName = generateUniqueName();
let createdSchemeId: number | string | undefined;
let createdSiteId: number | string | undefined;
let schemeName: string;

test('@ui Create Site under Scheme', async (
  {
    context,
    portalWelcome,
    portalNavbar,
    portalSchemeDirectory,
    portalSites,
    makePortalLogin,
    schemes,
    sites,
    api,
  },
  testInfo,
) => {
  try {
    await test.step('Create scheme via API', async () => {
      const payload = await makeSchemePayload(api);
      schemeName = payload.display_name;
      const created = await schemes.create(payload);
      createdSchemeId = created.id;
      expect(createdSchemeId).toBeDefined();
    });

    await test.step('Open Welcome page', async () => {
      await portalWelcome.open();
    });

    const loginPage = await test.step('Open login popup', async () =>
      portalWelcome.clickSignInAndGetLoginPage(context)
    );

    const portalLogin = makePortalLogin(loginPage);

    await test.step('Login to Portal', async () => {
      await portalLogin.assertLoaded();
      await portalLogin.login(email!, password!);
    });

    await test.step('Navigate to Scheme Directory', async () => {
      await portalNavbar.navigateTo('scheme-directory');
    });

    await test.step('Select scheme created via API', async () => {
      await portalSchemeDirectory.selectSchemeByName(schemeName);
      await portalSchemeDirectory.openScheme(schemeName);
    });

    await test.step('Create Site via UI', async () => {
      await portalSites.createSite({
        name: siteName,
        description: 'Test description',
      });
      await portalSites.assertSiteVisible(siteName);
      createdSiteId = await sites.getIdByDisplayName(siteName);
      expect(createdSiteId).toBeDefined();
    });

    await test.step('Assert site is created/visible', async () => {
      await portalSites.assertSiteVisible(siteName);
    });
  } finally {
    await test.step(`Cleanup: delete site ${createdSiteId} and scheme ${createdSchemeId} via API`, async () => {
      await cleanupWithReport(testInfo, [
        {
          name: createdSiteId != null
            ? `Delete site ${createdSiteId} via API`
            : `Delete site (skipped - id unknown)`,
          run: async () => {
            if (createdSiteId == null) return;

            await sites.delete(createdSiteId);
            const rows = await sites.listByIds([createdSiteId]);
            expect(rows, `Site '${siteName}' should be deleted`).toHaveLength(0);
          },
        },
        {
          name: createdSchemeId != null
            ? `Delete scheme ${createdSchemeId} via API`
            : `Delete scheme (skipped - id unknown)`,
          run: async () => {
            if (createdSchemeId == null) return;

            await schemes.delete(createdSchemeId);
            const rows = await schemes.listByIds([createdSchemeId]);
            expect(rows, `Scheme '${schemeName}' should be deleted`).toHaveLength(0);
          },
        },
      ]);
    });
  }
});
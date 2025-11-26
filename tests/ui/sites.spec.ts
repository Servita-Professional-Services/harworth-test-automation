import { test, expect } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';

const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

const schemeName = generateUniqueName();
const siteName = generateUniqueName(); 

let createdSchemeId: number | string;
let createdSiteId: number | string;

test('@ui @sam Create Site under Scheme', async ({
  context,
  portalWelcome,
  portalNavbar,
  portalSchemeDirectory,
  portalSites,
  makePortalLogin,
  schemes,
  sites,
}) => {
  try {
    await test.step('Create scheme via API', async () => {
      const created = await schemes.create({
        display_name: schemeName,
        description: 'Created for UI site test',
      });

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
      const createdSiteId = await sites.getIdByDisplayName(siteName);      
      expect(createdSiteId).toBeDefined();
    });

    await test.step('Assert site is created/visible', async () => {
      await portalSites.assertSiteVisible(siteName);
    });

  } finally {
    if (createdSiteId != null) {
      await test.step(`Cleanup: delete site ${createdSiteId} via API`, async () => {
        await sites.delete(createdSiteId);
        const rows = await sites.listByIds([createdSiteId]);
        expect(rows, `Site '${siteName}' should be deleted`).toHaveLength(0);
      });
    }

    if (createdSchemeId != null) {
      await test.step(`Cleanup: delete scheme ${createdSchemeId} via API`, async () => {
        await schemes.delete(createdSchemeId);
        const rows = await schemes.listByIds([createdSchemeId]);
        expect(rows, `Scheme '${schemeName}' should be deleted`).toHaveLength(0);
      });
    }
  }
});

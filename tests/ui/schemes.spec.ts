import { test, expect } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';

const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;
const schemeName = generateUniqueName();
const schemeDescription = 'Testing';
let createdSchemeId: string | number;

test('@ui Create and Update Scheme via Portal', async ({
  context,
  portalWelcome,
  portalNavbar,
  portalSchemeDirectory,
  makePortalLogin,
  schemes,
}) => {
  try {
    await test.step('Open Welcome page', async () => {
      await portalWelcome.open();
    });

    const loginPage = await test.step('Open login popup', async () => {
      return portalWelcome.clickSignInAndGetLoginPage(context);
    });

    const portalLogin = makePortalLogin(loginPage);

    await test.step('Login to Portal', async () => {
      await portalLogin.assertLoaded();
      await portalLogin.login(email!, password!);
    });

    await test.step('Navigate to Scheme Directory', async () => {
      await portalNavbar.navigateTo('scheme-directory');
    });

    await test.step('Verify Scheme cannot be created if mandatory fields are empty', async () => {
      await portalSchemeDirectory.openNewSchemeForm();
      await portalSchemeDirectory.submitSchemeForm();
      await portalSchemeDirectory.assertMandatoryFieldErrorsVisible();
    });

    await test.step('Create Scheme via UI', async () => {
      await portalSchemeDirectory.createScheme(schemeName, schemeDescription);
      createdSchemeId = await schemes.getIdByDisplayName(schemeName);
    });

    await test.step('Edit scheme description and verify new value is saved', async () => {
      const editedDescription = schemeDescription + ' Edited';
      await portalSchemeDirectory.editSchemeDescription(editedDescription);
      await portalSchemeDirectory.assertSchemeDescription(editedDescription);
    });

  } finally {
    if (createdSchemeId != null) {
      await test.step(
        `Cleanup: Delete scheme ${createdSchemeId} via API`,
        async () => {
          await schemes.delete(createdSchemeId);
          const rows = await schemes.listByIds([createdSchemeId]);
          expect(
            rows,
            `Scheme '${schemeName}' (id=${createdSchemeId}) should be deleted in cleanup`,
          ).toHaveLength(0);
        },
      );
    }
  }
});

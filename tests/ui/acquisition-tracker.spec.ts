import { test, expect } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';

const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

test('@ui Create and Update Opportunity in Acquisition Tracker via Portal', async ({
  context,
  portalWelcome,
  portalNavbar,
  makePortalLogin,
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

    await test.step('Navigate to Acquisition Tracker', async () => {
      await portalNavbar.navigateTo('acquisition-tracker');
    });


  } finally {

  }
});

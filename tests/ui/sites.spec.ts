import { test, expect } from '../fixtures/ui-fixtures';

const email = process.env.DEV_PORTAL_LOGIN_EMAIL as string;
const password = process.env.DEV_PORTAL_LOGIN_PASSWORD as string;

test('@ui @sam Create and Update Site via Portal', async ({ context, portalWelcome, portalNavbar, makePortalLogin }) => {
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

});

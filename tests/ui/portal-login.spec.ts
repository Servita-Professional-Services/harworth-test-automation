import { test, expect } from '../fixtures/ui-fixtures'; 
import { PortalLogin } from '../../src/pages/login';

const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

test('@ui Portal login', async ({ page, context, portalWelcome }) => {
  await portalWelcome.open();

  const loginPage = await portalWelcome.clickSignInAndGetLoginPage(context);

  const portalLogin = new PortalLogin(loginPage);
  await portalLogin.assertLoaded();

  await portalLogin.login(email!, password!);

  if (loginPage !== page) {
    await loginPage.waitForEvent('close', { timeout: 10_000 }).catch(() => {});
  }

});

import { test } from '../fixtures/ui-fixtures'; 

const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

test('@ui Portal login', async ({ context, portalWelcome, makePortalLogin }) => {
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

});

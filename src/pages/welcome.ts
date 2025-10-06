import { Page, BrowserContext } from '@playwright/test';

export class PortalWelcome {
  constructor(private readonly page: Page) {}

  private get signInButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  async open() {
    await this.page.goto('/');
  }

  async clickSignIn() {
    await this.signInButton.click();
  }
  
  async clickSignInAndGetLoginPage(context: BrowserContext, timeoutMs = 3000): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup', { timeout: timeoutMs }).catch(() => null);

    await this.clickSignIn();
    const popup = await popupPromise;

    return popup ?? this.page;
  }
}

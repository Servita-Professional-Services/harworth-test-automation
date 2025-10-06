import { Page } from '@playwright/test';

export class PortalLogin {
  constructor(private readonly page: Page) {}

  private get emailField() {
    return this.page.locator('//input[@type="email"]');
  }
  private get passwordField() {
    return this.page.locator('//input[@type="password"]');
  }
  private get signInButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }
  private get nextButton() {
    return this.page.getByRole('button', { name: 'Next' });
  }

  async assertLoaded() {
    await this.emailField.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string) {
    await this.emailField.fill(email);
    await this.nextButton.click();
    await this.passwordField.fill(password);
    await this.signInButton.click();
  }
}

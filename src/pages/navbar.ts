import { Page } from '@playwright/test';

export class PortalNavbar {
  constructor(private readonly page: Page) {}

  private navItem(route: string) {
    return this.page.locator(`a[href='${route}']`);
  }

  async navigateTo(destination: 'reporting' | 'scheme-directory' | 'acquisition-tracker') {
    const route =
      destination === 'scheme-directory'
        ? '/opportunity-directory'
        : `/${destination}`;

    const link = this.navItem(route);
    await link.click();
    await this.page.waitForURL(`**${route}`);
  }
}

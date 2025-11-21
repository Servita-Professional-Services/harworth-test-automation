import { Page, expect } from '@playwright/test';

export class PortalNavbar {
  constructor(private readonly page: Page) {}

  private byHref(route: string) {
    return this.page.locator(`a[href="${route}"]`);
  }

  async navigateTo(destination: 'reporting' | 'scheme-directory' | 'acquisition-tracker') {
    const routeMap = {
      reporting: '/reporting',
      'scheme-directory': '/scheme-directory',
      'acquisition-tracker': '/opportunity-directory',
    } as const;

    const route = routeMap[destination];
    const link = this.byHref(route);

    await expect(link).toBeVisible({ timeout: 10_000 });
    await link.click();
    await this.page.waitForURL(`**${route}`);
  }
}

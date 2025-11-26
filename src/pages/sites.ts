import { expect, Page, Locator } from '@playwright/test';

export type CreateSiteParams = {
  name: string;
  description?: string;
  financialCode?: string;
  landUse?: string;
  location?: string;
};

export class PortalSites {
  constructor(private readonly page: Page) {}

  private get addSiteButton() {
    return this.page.getByRole('button', { name: 'Add Site' });
  }
  private get siteNameInput() {
    return this.page.getByTestId('site-display-name-input');
  }
  private get siteDescriptionInput() {
    return this.page.getByTestId('site-description-textarea');
  }
  private get siteFinancialCodeInput() {
    return this.page.getByTestId('site-financial-code-input');
  }
  private get siteLandUseDropdown() {
    return this.page.getByTestId('site-land-use-select');
  }
  private get siteLocationDropdown() {
    return this.page.getByTestId('site-location-select');
  }
  private get saveSiteButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }
  private siteHeader(name: string) {
    return this.page.getByRole('heading', { name });
  }

  private async openAddSiteForm() {
    await this.addSiteButton.click();
  }

  private async selectRandomFromSelect(select: Locator) {
    const options = select.locator('option');
    const count = await options.count();
    expect(count, 'Expected options in <select>').toBeGreaterThanOrEqual(1);
    const index = Math.floor(Math.random() * (count - 1)) + 1;
    await select.selectOption({ index });
  }

  private async selectLandUse(landUse?: string) {
    if (landUse) {
      await this.siteLandUseDropdown.selectOption({ label: landUse });
      return;
    }
    await this.selectRandomFromSelect(this.siteLandUseDropdown);
  }

  private async selectLocation(location?: string) {
    if (location) {
      await this.siteLocationDropdown.selectOption({ label: location });
      return;
    }
    await this.selectRandomFromSelect(this.siteLocationDropdown);
  }

  private async fillSiteForm(params: CreateSiteParams) {
    const description = params.description ?? 'Site for E2E';
    const financialCode = params.financialCode ?? 'FC-123';

    await this.siteNameInput.fill(params.name);
    await this.siteDescriptionInput.fill(description);
    await this.siteFinancialCodeInput.fill(financialCode);

    await this.selectLandUse(params.landUse);
    await this.selectLocation(params.location);
  }

  private async submitSiteForm() {
    await this.saveSiteButton.click();
  }

  async createSite(params: CreateSiteParams) {
    await this.openAddSiteForm();
    await this.fillSiteForm(params);
    await this.submitSiteForm();
  }

  async assertSiteVisible(name: string) {
    await expect(this.siteHeader(name)).toBeVisible();
  }
}

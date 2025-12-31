import { expect, Page, Locator } from '@playwright/test';

export type CreateSiteParams = {
  name: string;
  description?: string;
  financialCode?: string;
  sector?: string;
  location?: string;
  division?: string;
  subDivision?: string;
  status?: string;
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
  private get siteSectorDropdown() {
    return this.page.getByTestId('site-sector-select');
  }
  private get siteLocationDropdown() {
    return this.page.getByTestId('site-location-select');
  }
  private get siteDivisionDropdown() {
    return this.page.getByTestId('site-division-select');
  }
  private get siteSubDivisionDropdown() {
    return this.page.getByTestId('site-sub-division-select');
  }
  private get siteStatusDropdown() {
    return this.page.getByTestId('site-status-select');
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

  private async selectSector(sector?: string) {
    if (sector) {
      await this.siteSectorDropdown.selectOption({ label: sector });
      return;
    }
    await this.selectRandomFromSelect(this.siteSectorDropdown);
  }

  private async selectLocation(location?: string) {
    if (location) {
      await this.siteLocationDropdown.selectOption({ label: location });
      return;
    }
    await this.selectRandomFromSelect(this.siteLocationDropdown);
  }

  private async selectDivision(division?: string) {
    if (division) {
      await this.siteDivisionDropdown.selectOption({ label: division });
      return;
    }
    await this.selectRandomFromSelect(this.siteDivisionDropdown);
  }

  private async selectSubDivision(subDivision?: string) {
    if (subDivision) {
      await this.siteSubDivisionDropdown.selectOption({ label: subDivision });
      return;
    }
    await this.selectRandomFromSelect(this.siteSubDivisionDropdown);
  }

  private async selectStatus(status?: string) {
    if (status) {
      await this.siteStatusDropdown.selectOption({ label: status });
      return;
    }
    await this.selectRandomFromSelect(this.siteStatusDropdown);
  }

  private async fillSiteForm(params: CreateSiteParams) {
    const description = params.description ?? 'Site for E2E';
    const financialCode = params.financialCode ?? 'FC-123';

    await this.siteNameInput.fill(params.name);
    await this.siteDescriptionInput.fill(description);
    await this.siteFinancialCodeInput.fill(financialCode);

    await this.selectSector(params.sector);
    await this.selectLocation(params.location);
    await this.selectDivision(params.division);
    await this.selectSubDivision(params.subDivision);
    await this.selectStatus(params.status);
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

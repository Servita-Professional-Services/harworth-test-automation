import { expect, Page } from '@playwright/test';

export class PortalSchemeDirectory {
  constructor(private readonly page: Page) {}

  private get newSchemeButton() {
    return this.page.getByRole('button', { name: 'New Scheme' });
  }
  private get schemeNameInput() {
    return this.page.getByTestId('scheme-display-name-input');
  }
  private get schemeDescriptionInput() {
    return this.page.getByTestId('scheme-description-textarea');
  }
  private get saveSchemeButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }
  private get emptyNameErrorMessage() {
    return this.page.getByText('Display name is required');
  }
  private get emptyDescriptionErrorMessage() {
    return this.page.getByText('Description is required');
  }

  async openNewSchemeForm() {
    await this.newSchemeButton.click();
  }

  async fillSchemeForm(name: string, description: string) {
    await this.schemeNameInput.fill(name);
    await this.schemeDescriptionInput.fill(description);
  }

  async submitSchemeForm() {
    await this.saveSchemeButton.click();
  }

  async createScheme(name: string, description: string) {
    const isFormAlreadyOpen = await this.schemeNameInput.isVisible({ timeout: 500 });
    if (!isFormAlreadyOpen) {
      await this.openNewSchemeForm();
    }
    await this.fillSchemeForm(name, description);
    await this.submitSchemeForm();
  }
  

  async assertMandatoryFieldErrorsVisible() {
    await expect(this.emptyNameErrorMessage).toBeVisible();
    await expect(this.emptyDescriptionErrorMessage).toBeVisible();
  }
}

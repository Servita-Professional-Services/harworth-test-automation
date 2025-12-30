import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { selectRandomOption } from '../../tests/helpers/ui';

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
  private get emptyStatusErrorMessage() {
    return this.page.getByText('Status is required');
  }
  private get editSchemeDescriptionButton() {
    return this.page.getByRole('button', { name: 'Edit scheme description' });
  }
  private get schemeDescriptionValue() {
    return this.page.locator('div.font-medium:has-text("Description") + div').first();
  }
  private get descriptionDialog() {
    return this.page.getByRole('dialog');
  }
  private get schemeFilterTrigger() {
    return this.page.getByTestId('typeahead-trigger-scheme-filter');
  }
  private get schemeFilterInput() {
    return this.page.getByTestId('typeahead-input-scheme-filter');
  }
  private get statusDropdown() {
    return this.page.getByTestId('scheme-status-select');
  }
  private schemeOption(name: string) {
    return this.page.getByRole('option', { name });
  }
  private schemeLink(name: string) {
    return this.page.getByRole('link', { name });
  }
  private get addSiteButton() {
    return this.page.getByRole('button', { name: 'Add Site' });
  }

  // ---------------------------
  // Dialog-scoped locators
  // ---------------------------

  private get dialogDescriptionTextarea() {
    return this.descriptionDialog.getByTestId('scheme-description-textarea');
  }
  private get dialogSaveButton() {
    return this.descriptionDialog.getByRole('button', { name: 'Save' });
  }

  // ---------------------------
  // Generic helpers (page-scoped)
  // ---------------------------

  async waitForNotVisible(target: Locator, timeoutMs = 10_000) {
    await target.waitFor({ state: 'hidden', timeout: timeoutMs });
  }

  // ---------------------------
  // Actions
  // ---------------------------

  async openNewSchemeForm() {
    await this.newSchemeButton.click();
    await expect(this.schemeNameInput).toBeVisible();
  }

  async fillSchemeForm(name: string, description: string) {
    await this.schemeNameInput.fill(name);
    await this.schemeDescriptionInput.fill(description);
    await selectRandomOption(this.statusDropdown);
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
    await expect(this.addSiteButton).toBeVisible();
  }

  async editSchemeDescription(description: string) {
    await this.editSchemeDescriptionButton.click();
    await expect(this.descriptionDialog).toBeVisible();
    const textarea = this.dialogDescriptionTextarea;
    const save = this.dialogSaveButton;
    await textarea.click();
    await textarea.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await textarea.type(description);
    await textarea.press('Tab');
    await expect(textarea).toHaveValue(description);
    await save.click();
    await expect(this.descriptionDialog).toBeHidden({ timeout: 10_000 });
  }

  // ---------------------------
  // Assertions / Reads
  // ---------------------------

  async assertMandatoryFieldErrorsVisible() {
    await expect(this.emptyNameErrorMessage).toBeVisible();
    await expect(this.emptyDescriptionErrorMessage).toBeVisible();
    await expect(this.emptyStatusErrorMessage).toBeVisible();
  }

  async readSchemeDescription() {
    return (await this.schemeDescriptionValue.textContent())?.trim() ?? '';
  }

  async assertSchemeDescription(expected: string) {
    await expect(this.schemeDescriptionValue).toHaveText(expected);
  }

  // ---------------------------
  // Filtering / Navigation
  // ---------------------------

  async selectSchemeByName(name: string) {
    await this.schemeFilterTrigger.click();
    await this.schemeFilterInput.click();
    await this.schemeFilterInput.fill(name);
    await this.schemeOption(name).click();
    await expect(this.schemeFilterTrigger).toContainText(name);
  }

  async openScheme(name: string) {
    await this.schemeLink(name).click();
  }
}
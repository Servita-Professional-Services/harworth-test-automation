import { expect, type Locator, type Page } from '@playwright/test';
import { selectRandomOption } from '../../tests/helpers/ui';

type MandatoryOpportunityArgs = {
  displayName: string;
};

export class PortalAcquisitionTracker {
  constructor(private readonly page: Page) {}

  // ---------------------------
  // Locators
  // ---------------------------

  private get newOpportunityButton() {
    return this.page.getByRole('button', { name: 'New Opportunity' });
  }
  private get opportunityNameInput() {
    return this.page.getByTestId('opportunity-display-name-input');
  }
  private get opportunityStatusDropdown() {
    return this.page.getByTestId('opportunity-status-select');
  }
  private get opportunityLandAssemblyDropdown() {
    return this.page.getByTestId('async-typeahead-trigger-scheme_id');
  }
  private get opportunityLandAssemblyInput() {
    return this.page.getByTestId('async-typeahead-input-scheme_id');
  }
  private get opportunityAddressInput() {
    return this.page.getByTestId('opportunity-address-input');
  }
  private get opportunityPostcodeInput() {
    return this.page.getByTestId('opportunity-post-code-input');
  }
  private get opportunityLocationDropdown() {
    return this.page.getByTestId('async-typeahead-trigger-location_id');
  }
  private get opportunityLocationInput() {
    return this.page.getByTestId('async-typeahead-input-location_id');
  }
  private get opportunityLeadContactDropdown() {
    return this.page.getByTestId('async-typeahead-trigger-lead_contact_id');
  }
  private get opportunityLeadContactInput() {
    return this.page.getByTestId('async-typeahead-input-lead_contact_id');
  }
  private get opportunityCommentInput() {
    return this.page.getByTestId('opportunity-comment-textarea');
  }
  private get opportunitySaveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }
  private get displayNameErrorMessage() {
    return this.page.getByText('Display name is required');
  }
  private get statusErrorMessage() {
    return this.page.getByText('Status is required');
  }

  // ---------------------------
  // Helpers
  // ---------------------------

  private async triggerTypeaheadAndPickRandom(opts: {
    label: string;
    trigger: Locator;
    input: Locator;
    allowEmpty?: boolean; 
  }): Promise<string | null> {
    const { label, trigger, input, allowEmpty = false } = opts;

    await trigger.click();
    await expect(input, `${label}: typeahead input should be visible`).toBeVisible({ timeout: 10_000 });
    await input.click();
    await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await input.press('Backspace');
    await input.type('a', { delay: 20 });
    await this.page.waitForTimeout(250);

    const options = this.page.locator('[data-testid^="async-typeahead-option-"]');
    const count = await options.count();

    if (count === 0 && allowEmpty) {
      await testStepNote(`${label}: no results returned (skipped)`);
      await this.opportunityNameInput.click();
      return null;
    }

    if (count === 0) {
      throw new Error(`${label}: no typeahead results returned`);
    }

    const idx = Math.floor(Math.random() * count);
    const option = options.nth(idx);
    const chosenText = (await option.textContent())?.trim() ?? `option-${idx}`;

    await testStepNote(`${label}: chose "${chosenText}"`);
    await option.click();
    return chosenText;
  }

  async readOpportunityIdFromUrl(): Promise<number> {
    await expect
      .poll(() => {
        const m = this.page.url().match(/\/opportunity-directory\/(\d+)/);
        return m ? Number(m[1]) : null;
      }, { timeout: 15_000 })
      .not.toBeNull();

    const m = this.page.url().match(/\/opportunity-directory\/(\d+)/);
    return Number(m![1]);
  }

  // ---------------------------
  // Actions
  // ---------------------------

  async openNewOpportunityForm() {
    await this.newOpportunityButton.click();
    await expect(this.opportunityNameInput).toBeVisible({ timeout: 10_000 });
  }

  async submitNewOpportunityForm() {
    await this.opportunitySaveButton.click();
  }

  async submitEmptyOpportunityFormAndAssertErrors() {
    await this.submitNewOpportunityForm();
    await expect(this.displayNameErrorMessage).toBeVisible();
    await expect(this.statusErrorMessage).toBeVisible();
  }

  async fillMandatoryFields(args: MandatoryOpportunityArgs) {
    await this.opportunityNameInput.fill(args.displayName);
    await selectRandomOption(this.opportunityStatusDropdown);
  }

  async fillOptionalFieldsWithTypeaheads() {
    await this.opportunityAddressInput.fill('1 Test Street');
    await this.opportunityPostcodeInput.fill('M1 1AA');
    await this.opportunityCommentInput.fill('Automated test comment');

    await this.triggerTypeaheadAndPickRandom({
      label: 'Land Assembly',
      trigger: this.opportunityLandAssemblyDropdown,
      input: this.opportunityLandAssemblyInput,
    });

    await this.triggerTypeaheadAndPickRandom({
      label: 'Location',
      trigger: this.opportunityLocationDropdown,
      input: this.opportunityLocationInput,
    });

    await this.triggerTypeaheadAndPickRandom({
      label: 'Lead Contact',
      trigger: this.opportunityLeadContactDropdown,
      input: this.opportunityLeadContactInput,
      allowEmpty: true,
    });
  }

  // ---------------------------
  // Assertions
  // ---------------------------

  async assertOpportunityDetailsPageLoaded(displayName: string) {
    await expect(this.page.getByRole('heading', { name: displayName })).toBeVisible({ timeout: 15_000 });
  }
}

async function testStepNote(note: string) {
  console.log(note);
}
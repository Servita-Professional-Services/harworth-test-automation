import { expect, type Locator, type Page } from '@playwright/test';
import { selectRandomOption } from '../../tests/helpers/ui';

export type NewOpportunityFormArgs = {
  displayName: string; 
  statusValue?: string;
  landAssemblyName?: string;
  address?: string;
  postcode?: string;
  locationName?: string;
  leadContactName?: string;
  comment?: string;
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

  private get opportunityHeading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  // ---------------------------
  // Generic UI helpers
  // ---------------------------

  private async pickFromAsyncTypeahead(opts: {
    trigger: Locator;
    input: Locator;
    value: string;
  }) {
    const { trigger, input, value } = opts;

    await trigger.click();
    await expect(input).toBeVisible();
    await input.click();
    await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await input.press('Backspace');
    await input.type(value, { delay: 30 });
    const option = this.page.getByRole('option', { name: value }).first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
  }

  // ---------------------------
  // Actions
  // ---------------------------

  async openNewOpportunityForm() {
    await this.newOpportunityButton.click();
    await expect(this.opportunityNameInput).toBeVisible();
  }

  async submitNewOpportunityForm() {
    await this.opportunitySaveButton.click();
  }

  async assertMandatoryErrorsVisible() {
    await expect(this.displayNameErrorMessage).toBeVisible();
    await expect(this.statusErrorMessage).toBeVisible();
  }

  async fillNewOpportunityForm(args: NewOpportunityFormArgs) {
    const {
      displayName,
      statusValue,
      landAssemblyName,
      address,
      postcode,
      locationName,
      leadContactName,
      comment,
    } = args;

    await this.opportunityNameInput.click();
    await this.opportunityNameInput.fill(displayName);
    if (statusValue) {
      await this.opportunityStatusDropdown.selectOption({ label: statusValue }).catch(async () => {
        await selectRandomOption(this.opportunityStatusDropdown);
      });
    } else {
      await selectRandomOption(this.opportunityStatusDropdown);
    }

    if (landAssemblyName) {
      await this.pickFromAsyncTypeahead({
        trigger: this.opportunityLandAssemblyDropdown,
        input: this.opportunityLandAssemblyInput,
        value: landAssemblyName,
      });
    }

    if (address) {
      await this.opportunityAddressInput.fill(address);
    }

    if (postcode) {
      await this.opportunityPostcodeInput.fill(postcode);
    }

    if (locationName) {
      await this.pickFromAsyncTypeahead({
        trigger: this.opportunityLocationDropdown,
        input: this.opportunityLocationInput,
        value: locationName,
      });
    }

    if (leadContactName) {
      await this.pickFromAsyncTypeahead({
        trigger: this.opportunityLeadContactDropdown,
        input: this.opportunityLeadContactInput,
        value: leadContactName,
      });
    }

    if (comment) {
      await this.opportunityCommentInput.fill(comment);
    }
  }

  async createOpportunity(args: NewOpportunityFormArgs) {
    await this.openNewOpportunityForm();
    await this.fillNewOpportunityForm(args);
    await this.submitNewOpportunityForm();
    await this.assertOnOpportunityDetailsPage(args.displayName);
  }

  // ---------------------------
  // Reads / Assertions
  // ---------------------------

  async assertOnOpportunityDetailsPage(expectedDisplayName: string) {
    await expect(this.opportunityHeading.first()).toContainText(expectedDisplayName, { timeout: 15_000 });
  }

  async readCurrentOpportunityId(): Promise<number> {
    const url = this.page.url();
    const m = url.match(/\/opportunity-directory\/(\d+)(\?|$)/);
    if (m) return Number(m[1]);

    const headingText = (await this.opportunityHeading.first().textContent())?.trim() ?? '';
    const idMatch = headingText.match(/(\d+)\s*$/);
    if (!idMatch) {
      throw new Error(`Could not parse opportunity id from URL or heading. url='${url}', heading='${headingText}'`);
    }
    return Number(idMatch[1]);
  }
}
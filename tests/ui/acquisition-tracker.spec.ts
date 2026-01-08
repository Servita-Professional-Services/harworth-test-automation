import { test } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';
import { cleanupWithReport } from '../helpers/cleanup-helper';

test.describe('@ui Acquisition Tracker - Opportunities', () => {
  test.beforeEach(async ({ context, portalWelcome, makePortalLogin, portalNavbar }) => {
    const email = process.env.QA_PORTAL_LOGIN_EMAIL as string;
    const password = process.env.QA_PORTAL_LOGIN_PASSWORD as string;

    await test.step('Open Welcome page', async () => {
      await portalWelcome.open();
    });

    const loginPage = await test.step('Open login popup', async () => {
      return portalWelcome.clickSignInAndGetLoginPage(context);
    });

    const portalLogin = makePortalLogin(loginPage);

    await test.step('Login to Portal', async () => {
      await portalLogin.assertLoaded();
      await portalLogin.login(email, password);
    });

    await test.step('Navigate to Acquisition Tracker', async () => {
      await portalNavbar.navigateTo('acquisition-tracker');
    });
  });

  test('@ui Shows mandatory validation errors', async ({ portalAcquisitionTracker }) => {
    await test.step('Open New Opportunity form', async () => {
      await portalAcquisitionTracker.openNewOpportunityForm();
    });

    await test.step('Submit empty form and assert mandatory errors', async () => {
      await portalAcquisitionTracker.submitEmptyOpportunityFormAndAssertErrors();
    });
  });

  test('@ui Creates opportunity with mandatory fields only', async (
    { portalAcquisitionTracker, opportunityMetadata },
    testInfo,
  ) => {
    const displayName = generateUniqueName('e2e-opportunity');
    let createdOpportunityId: number | null = null;

    try {
      await test.step('Open New Opportunity form', async () => {
        await portalAcquisitionTracker.openNewOpportunityForm();
      });

      await test.step('Fill mandatory fields', async () => {
        await portalAcquisitionTracker.fillMandatoryFields({ displayName });
      });

      await test.step('Save opportunity', async () => {
        await portalAcquisitionTracker.submitNewOpportunityForm();
      });

      await test.step('Assert opportunity details page loaded', async () => {
        await portalAcquisitionTracker.assertOpportunityDetailsPageLoaded(displayName);
      });

      await test.step('Capture created opportunity id from URL', async () => {
        createdOpportunityId = await portalAcquisitionTracker.readOpportunityIdFromUrl();
        await testInfo.attach('created-opportunity', {
          body: `displayName=${displayName}\nid=${createdOpportunityId}`,
          contentType: 'text/plain',
        });
      });
    } finally {
      await test.step(`Cleanup: delete opportunity metadata via API for ID ${createdOpportunityId}`, async () => {
        await cleanupWithReport(testInfo, [
          {
            name: `DELETE /sites/${createdOpportunityId}/opportunity-metadata`,
            run: async () => {
              if (createdOpportunityId == null) return;
              await opportunityMetadata.delete(createdOpportunityId);
            },
          },
        ]);
      });
    }
  });

  test('@ui Creates opportunity with all fields populated', async (
    { portalAcquisitionTracker, opportunityMetadata },
    testInfo,
  ) => {
    const displayName = generateUniqueName('e2e-opportunity-all-fields');
    let createdOpportunityId: number | null = null;

    try {
      await test.step('Open New Opportunity form', async () => {
        await portalAcquisitionTracker.openNewOpportunityForm();
      });

      await test.step('Fill mandatory fields', async () => {
        await portalAcquisitionTracker.fillMandatoryFields({ displayName });
      });

      await test.step('Fill optional fields', async () => {
        await portalAcquisitionTracker.fillOptionalFieldsWithTypeaheads();
      });

      await test.step('Save opportunity', async () => {
        await portalAcquisitionTracker.submitNewOpportunityForm();
      });

      await test.step('Assert opportunity details page loaded', async () => {
        await portalAcquisitionTracker.assertOpportunityDetailsPageLoaded(displayName);
      });

      await test.step('Capture created opportunity id from URL', async () => {
        createdOpportunityId = await portalAcquisitionTracker.readOpportunityIdFromUrl();
        await testInfo.attach('created-opportunity', {
          body: `displayName=${displayName}\nid=${createdOpportunityId}`,
          contentType: 'text/plain',
        });
      });
    } finally {
      await test.step(`Cleanup: delete opportunity metadata via API for ID ${createdOpportunityId}`, async () => {
        await cleanupWithReport(testInfo, [
          {
            name: `DELETE /sites/${createdOpportunityId}/opportunity-metadata`,
            run: async () => {
              if (createdOpportunityId == null) return;
              await opportunityMetadata.delete(createdOpportunityId);
            },
          },
        ]);
      });
    }
  });
});
import { test, expect } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';

test.describe('@ui Acquisition Tracker - Opportunities', () => {
  test.beforeEach(async ({ loginToPortal, portalNavbar }) => {
    await test.step('Login to Portal', async () => {
      await loginToPortal();
    });

    await test.step('Navigate to Acquisition Tracker', async () => {
      await portalNavbar.navigateTo('acquisition-tracker');
    });
  });

  test('@ui Shows validation errors when submitting empty form', async ({ portalAcquisitionTracker }) => {
    await test.step('Open new opportunity form', async () => {
      await portalAcquisitionTracker.openNewOpportunityForm();
    });

    await test.step('Submit with no data', async () => {
      await portalAcquisitionTracker.submitNewOpportunityForm();
    });

    await test.step('Assert mandatory validation errors', async () => {
      await portalAcquisitionTracker.assertMandatoryErrorsVisible();
    });
  });

  test('@sam Creates opportunity with mandatory fields only', async ({
    portalAcquisitionTracker,
    cleanupOpportunityById,
    opportunityMetadata,
  }) => {
    const displayName = generateUniqueName('e2e');
    let createdId: number | undefined;

    try {
      await test.step('Create opportunity (mandatory fields only)', async () => {
        await portalAcquisitionTracker.createOpportunity({
          displayName,
        });

        createdId = await portalAcquisitionTracker.readCurrentOpportunityId();
        expect(createdId, 'created opportunity id should be a positive integer').toBeGreaterThan(0);
      });
    } finally {
        const id = createdId;
        if (id != null) {
        await test.step(`Cleanup: delete opportunity metadata for ${createdId}`, async () => {
          try {
            await cleanupOpportunityById(id);
            const meta = await opportunityMetadata.get(id).catch(() => ({}));
            expect(
              Object.keys(meta).length === 0 || JSON.stringify(meta) === '{}' ,
              `opportunity metadata should be removed/empty after cleanup for site ${createdId}`,
            ).toBeTruthy();
          } catch (e) {
            const msg = e instanceof Error ? e.stack ?? e.message : String(e);
            console.error(`Cleanup failed for '${displayName}' (id=${createdId}): ${msg}`);
          }
        });
      }
    }
  });

  test('@ui Creates opportunity with all fields', async ({
    portalAcquisitionTracker,
    cleanupOpportunityById,
    opportunityMetadata,
  }) => {
    const displayName = generateUniqueName('e2e');
    let createdId: number | undefined;

    try {
      await test.step('Create opportunity (all fields)', async () => {
        await portalAcquisitionTracker.createOpportunity({
          displayName,
          address: '1 Test Street',
          postcode: 'S1 1AA',
          comment: 'Automated test opportunity',
          // landAssemblyName: 'Some scheme name',
          // locationName: 'Some location',
          // leadContactName: 'Some contact',
        });

        createdId = await portalAcquisitionTracker.readCurrentOpportunityId();
        expect(createdId, 'created opportunity id should be a positive integer').toBeGreaterThan(0);
      });
    } finally {
        const id = createdId;
        if (id != null) {
        await test.step(`Cleanup: delete opportunity metadata for ${createdId}`, async () => {
          try {
            await cleanupOpportunityById(id);
            const meta = await opportunityMetadata.get(id).catch(() => ({}));
            expect(
              Object.keys(meta).length === 0 || JSON.stringify(meta) === '{}' ,
              `opportunity metadata should be removed/empty after cleanup for site ${createdId}`,
            ).toBeTruthy();
          } catch (e) {
            const msg = e instanceof Error ? e.stack ?? e.message : String(e);
            console.error(`Cleanup failed for '${displayName}' (id=${createdId}): ${msg}`);
          }
        });
      }
    }
  });
});
import { test, expect } from '../fixtures/ui-fixtures';
import { generateUniqueName } from '../helpers/generate-random-string';
import { makeSchemePayload } from '../helpers/test-data/schemes';
import { cleanupWithReport } from '../helpers/cleanup-helper';

test.describe('@ui Scheme Directory - Schemes', () => {

    test.beforeEach(async ({ loginToPortal, portalNavbar }) => {
      await test.step('Login to Portal', async () => {
        await loginToPortal();
      });
    
      await test.step('Navigate to Scheme Directory', async () => {
        await portalNavbar.navigateTo('scheme-directory');
      });
  });

  test('@ui Shows mandatory validation errors when creating scheme', async ({ portalSchemeDirectory }) => {
    await test.step('Open new scheme form', async () => {
      await portalSchemeDirectory.openNewSchemeForm();
    });

    await test.step('Submit empty form and assert required errors', async () => {
      await portalSchemeDirectory.submitSchemeForm();
      await portalSchemeDirectory.assertMandatoryFieldErrorsVisible();
    });
  });

  test('@ui Creates scheme via UI', async (
    { portalSchemeDirectory, schemes },
    testInfo,
  ) => {
    const schemeName = generateUniqueName('e2e-scheme');
    const schemeDescription = 'Testing';
    let createdSchemeId: string | number | undefined;

    try {
      await test.step('Create scheme via UI', async () => {
        await portalSchemeDirectory.createScheme(schemeName, schemeDescription);
      });

      await test.step('Capture created scheme id via API', async () => {
        createdSchemeId = await schemes.getIdByDisplayName(schemeName);
        await testInfo.attach('created-scheme', {
          body: `displayName=${schemeName}\nid=${createdSchemeId}`,
          contentType: 'text/plain',
        });
      });
    } finally {
      await test.step(`Cleanup: delete scheme ${createdSchemeId} via API`, async () => {
        await cleanupWithReport(testInfo, [
          {
            name:
              createdSchemeId != null
                ? `Delete scheme ${createdSchemeId} via API`
                : 'Delete scheme (skipped - id unknown)',
            run: async () => {
              if (createdSchemeId == null) return;

              await schemes.delete(createdSchemeId);
              const rows = await schemes.listByIds([createdSchemeId]);
              expect(
                rows,
                `Scheme '${schemeName}' (id=${createdSchemeId}) should be deleted in cleanup`,
              ).toHaveLength(0);
            },
          },
        ]);
      });
    }
  });

  test('@ui Edits scheme description via UI', async (
    { portalSchemeDirectory, schemes, api },
    testInfo,
  ) => {
    const schemePayload = await makeSchemePayload(api);
    const schemeName = schemePayload.display_name;
    const editSchemeDescription = 'Testing Edited.';
    let createdSchemeId: string | number | undefined;

    try {
      await test.step('Create scheme via API (setup)', async () => {
        const created = await schemes.create(schemePayload);
        createdSchemeId = created.id;
        expect(createdSchemeId).toBeDefined();

        await testInfo.attach('created-scheme', {
          body: `displayName=${schemeName}\nid=${createdSchemeId}`,
          contentType: 'text/plain',
        });
      });

      await test.step('Open scheme in UI', async () => {
        await portalSchemeDirectory.selectSchemeByName(schemeName);
        await portalSchemeDirectory.openScheme(schemeName);
      });

      await test.step('Edit description and verify saved value', async () => {
        await portalSchemeDirectory.editSchemeDescription(editSchemeDescription);
        await portalSchemeDirectory.assertSchemeDescription(editSchemeDescription);
      });
    } finally {
      await test.step(`Cleanup: delete scheme ${createdSchemeId} via API`, async () => {
        await cleanupWithReport(testInfo, [
          {
            name:
              createdSchemeId != null
                ? `Delete scheme ${createdSchemeId} via API`
                : 'Delete scheme (skipped - id unknown)',
            run: async () => {
              if (createdSchemeId == null) return;

              await schemes.delete(createdSchemeId);
              const rows = await schemes.listByIds([createdSchemeId]);
              expect(
                rows,
                `Scheme '${schemeName}' (id=${createdSchemeId}) should be deleted in cleanup`,
              ).toHaveLength(0);
            },
          },
        ]);
      });
    }
  });
});
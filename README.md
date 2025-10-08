# Harworth Test Automation

End-to-end and API tests for Harworth using Playwright.  
The framework emphasizes clear separation of concerns, fast feedback, and data hygiene.

## Features
- **UI** tests with page objects (`src/pages/*`)
- **API** tests with resource clients (`src/clients/*`)
- **Fixtures** for dependency injection (`tests/fixtures/*`)
- **Test data helpers** & generators (`tests/helpers/*`)
- Path aliases (`@clients/*`, `@pages/*`, `@helpers/*`) for clean imports
- Data cleanup in tests to avoid leaving state behind
- Playwright HTML report (and traces on failure if enabled)

## Tech stack
- Node 18+
- TypeScript
- Playwright

## Project structure
src/
  clients/
    schemes.ts               # API client for /schemes
  pages/
    acquisition-tracker.ts
    login.ts
    navbar.ts
    reporting.ts
    scheme-directory.ts
    welcome.ts               # UI page objects
tests/
  api/
    schemes.spec.ts          # API CRUD tests (schemes)
  ui/
    portal-login.spec.ts     # Example UI test
  fixtures/
    api-fixtures.ts          # injects API context + clients
    ui-fixtures.ts           # injects page objects
  helpers/
    assertions.ts            # (optional) custom matchers/helpers
    generate-random-string.ts
    test-data/
      schemes.ts             # payload factories for API tests
playwright.config.ts
tsconfig.json

## Project Setup (Local runs)
# install deps
- npm ci
# install browsers (if not already)
- npx playwright install
# create .env values for local running
- DEV_API_BASE_URL=https://your.api.base.url
- DEV_API_AUTH_TOKEN=your_bearer_token
- DEV_PORTAL_BASE_URL=https://your.portal.base.url
- TEST_USER_EMAIL=user@example.com
- TEST_USER_PASS=Password123!

## Running Tests
# run only API project
- npx playwright test --project=api
# run only UI project
- npx playwright test --project=ui-chromium
# run only specific tagged tests
- npx playwright test --grep @customTag
# after a run
- npx playwright show-report

## Conventions & best practices

### Tests
- Keep specs readable: **assertions in specs**; HTTP details live in **clients**; payload factories in **helpers/test-data**.
- Each test **owns its data** and cleans up with `finally` so no state is left behind.
- Prefer semantic selectors in UI: `getByRole`, `getByLabel`, `getByTestId` (add stable `data-testid` as needed).
- Avoid test order coupling. Don’t rely on side effects from previous tests. If you must, use `test.describe.configure({ mode: 'serial' })` sparingly.
- Use `test.step()` for clearer traces on failures and easier debugging.
- Keep timeouts explicit for slow operations; avoid `waitForTimeout` sleeps—wait on conditions instead.
- Centralize environment concerns (e.g., `baseURL`, auth, viewport) in config or via `test.use` rather than hardcoding in specs.
- Tag tests intentionally (e.g., `@api`, `@smoke`) **or** rely on project/folder separation—avoid redundant tags.

### Fixtures
- Live in `tests/fixtures` and provide **dependency injection** for specs (e.g., `{ api, schemes }` for API, `{ portalWelcome, portalLogin }` for UI).
- Keep them minimal, deterministic, and fast. Build only what the test needs.
- Scope: default to **test-scoped** fixtures for simplicity; consider **worker-scoped** later for performance once you’re comfortable.

### API Clients
- One client per resource in `src/clients/*` (e.g., `schemes.ts`) with simple methods: `list`, `create`, `update`, `delete`.
- Handle status codes and low-level HTTP (headers, base paths) inside the client.
- Keep response parsing and small “is OK?” checks in the client; keep **behavioural assertions** in the spec.

### Page Objects (UI)
- Model **behaviour**, not tests. Expose actions (`open()`, `login()`) and getters for locators when the spec needs to assert.
- Use private locators with public methods to reduce coupling between specs and DOM structure.
- Keep core “Then” assertions in specs; allow micro-asserts within page objects only when they improve stability (e.g., ensuring a modal is open before interacting).

### Helpers / Test data
- Put tiny, stateless utilities in `tests/helpers` (e.g., `generate-random-string.ts`).
- Put payload builders/factories in `tests/helpers/test-data/*` (e.g., `schemes.ts` with `makeSchemePayload()`).
- Keep helpers generic and reusable; keep resource-specific logic in clients.

---

## Troubleshooting

- **No tests found**
  - Ensure you’re running the correct **project**:  
    ```bash
    npx playwright test --project=api
    # or
    npx playwright test --project=ui-chromium
    ```
  - Verify file locations match `testDir` in `playwright.config.ts`.

- **Env var / auth errors**
  - Confirm `.env` contains required keys (e.g., `DEV_API_BASE_URL`, `DEV_API_AUTH_TOKEN`, `DEV_PORTAL_BASE_URL`).
  - Make sure your config or setup loads envs (e.g., `dotenv`) before tests run.

- **Path alias resolution (“Cannot find module '@clients/…'”)**
  - Ensure `tsconfig.json` has:
    ```json
    {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@clients/*": ["src/clients/*"],
          "@pages/*": ["src/pages/*"],
          "@helpers/*": ["tests/helpers/*"]
        }
      }
    }
    ```
  - Register at runtime in `playwright.config.ts`:
    ```ts
    import 'tsconfig-paths/register';
    ```
  - If still failing, install the helper:  
    ```bash
    npm i -D tsconfig-paths
    ```

- **Duplicate “api” chips in HTML report**
  - You’ll see duplicates if both the **project name** is `api` and your titles use `@api`.  
    Either remove the `@api` tag in titles or rename the project (cosmetic only).

- **Flaky UI tests**
  - Replace time-based waits with condition-based waits (locators, network, URL change).
  - Use stable selectors (`getByRole`, `getByTestId`), not brittle CSS/XPath.
  - Ensure each test starts from a clean state (new context/storage or deterministic login).

- **Data not cleaned up**
  - Wrap create/update operations in `try/finally` and call the relevant delete in `finally`.
  - Keep IDs from create responses and use them for teardown.

- **Slow runs**
  - Run only the needed project:
    ```bash
    npx playwright test --project=api
    # or
    npx playwright test --project=ui-chromium
    ```
  - Use tags or directory scopes to narrow test selection.
  - Consider worker-scoped API contexts later for performance (once you’re comfortable with fixture scoping).








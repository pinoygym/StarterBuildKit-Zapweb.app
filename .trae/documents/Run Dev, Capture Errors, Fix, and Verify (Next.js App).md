## Objectives
- Run the application in dev, capture all runtime errors (client/server).
- Analyze stack traces, pinpoint causes, implement fixes with best practices.
- Add robust error handling to prevent recurrence.
- Verify via unit, integration, and E2E tests; perform UAT.
- Document changes and update tests; ensure zero-error runtime before sign-off.

## Context Summary
- Framework: Next.js (App Router), dev port `3000`.
- Entrypoints: `app/layout.tsx`, `app/page.tsx`, `app/(dashboard)/**`.
- Error handling: `app/error.tsx`, `app/global-error.tsx`, `components/shared/error-boundary.tsx`, `lib/logger.ts`, API `try/catch` patterns.
- Tests: Vitest for unit/integration (`tests/unit/**`, `tests/integration/**`), Playwright for E2E (`tests/e2e/**`).

## Step 1 — Execute Dev & Capture Errors
- Start dev: `npm run dev` and open `http://localhost:3000`.
- Enable verbose dev logs in `lib/logger.ts` if available.
- Reproduce flows across key routes: dashboard, products, inventory, purchase orders, receiving vouchers.
- Capture:
  - Browser console errors/warnings.
  - Network failures (API `4xx/5xx`, CORS).
  - Server-side logs from API routes under `app/api/**`.
  - Next error overlays and stack traces.

## Step 2 — Analyze Stack Traces and Root Causes
- For each error:
  - Identify the exact file/function and failing line(s).
  - Categorize: client render/runtime, SSR/route handlers, data fetching, state management, schema validation.
  - Check dependency versions and config (`next.config.ts`, `middleware.ts`).

## Step 3 — Implement Fixes (Best Practices)
- Client-side:
  - Fix null/undefined guards, improper hooks usage, stale references, memoization and effect dependencies.
  - Ensure component props/state types are correct; strengthen TypeScript types.
- Server/API:
  - Normalize error responses with `AppError` + `formatErrorResponse`.
  - Use `asyncHandler` wrapper to reduce duplicated `try/catch`.
  - Validate input via existing middleware; add schemas if missing.
- Config/routing:
  - Resolve mismatched paths, dynamic route params, middleware redirects.
- Data layer:
  - Fix fetchers; handle network timeouts; retry/backoff where reasonable.

## Step 4 — Strengthen Error Handling
- Global:
  - Ensure `components/shared/error-boundary.tsx` wraps critical UI shells.
  - Use `app/error.tsx` and `app/global-error.tsx` to show friendly messages and log.
- Logging:
  - Centralize via `lib/logger.ts`; emit structured logs in dev, avoid secrets.
  - Hook API routes to `logger.error` with correlation IDs.
- API resilience:
  - Return consistent JSON errors; include `code`, `message`, `details`.
  - Add input validation and guardrails.

## Step 5 — Verification via Tests
- Unit (Vitest):
  - Run: `npm run test`.
  - Add/extend tests for fixed modules (services, utils) under `tests/unit/**`.
- Integration:
  - Run: `npm run test` with integration suite or `vitest -t integration` if configured.
  - Cover key API routes under `tests/integration/api/**` with success/error cases.
- E2E (Playwright):
  - Start dev and run: `npx playwright test`.
  - Validate critical user journeys; ensure no console errors using Playwright `expect.soft` on `page.on('pageerror')` if present.

## Step 6 — UAT Checklist
- Validate top user flows end-to-end: login/protected routes, products, inventory, orders, vouchers.
- Confirm UI messages are user-friendly; no raw stack traces exposed.
- Verify performance acceptable; no infinite re-renders or memory leaks.

## Step 7 — Documentation & Tests Update
- Document fixes in CHANGELOG or task notes: symptom, root cause, fix, prevention.
- Update/add test cases tied to each fix.
- Note any config changes (`next.config.ts`, env vars) and migration notes.

## Step 8 — Final Zero-Error Verification
- Run dev again, navigate all major routes; confirm no runtime errors in console/server logs.
- Run full test suites (unit/integration/E2E) and ensure all green.

## Security & Secrets
- Do not log secrets from `.env` (e.g., API keys); scrub sensitive fields in logs.
- If sensitive keys are committed, rotate them and move to environment-only usage.

## Deliverables
- Implemented fixes with code references and brief rationale.
- Enhanced error handling and logging.
- Updated unit/integration/E2E tests.
- Short documentation of changes.
- Final verification report: zero runtime errors observed.
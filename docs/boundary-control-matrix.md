# Boundary Control Matrix

Last updated: 2026-03-04

Legend:

- `Implemented`: clearly present in current route wiring.
- `Partial`: basic/manual checks only.
- `Missing`: not wired/absent.

## Execution Update (2026-03-04)

- Implemented since baseline:
  - JWT auth middleware now enforces most write routes.
  - Validation middleware now enforces express-validator chains.
  - Route-specific limiters wired on `/auth/login`, `/reports` (POST), `/verify` (POST), and `/ai/chat`.
  - Audit logging middleware wired for key write operations.
  - Frontend now attaches bearer token from local storage to API requests.
- Remaining:
  - Expand validator coverage for all query/param paths.
  - Introduce role-based authorization on admin-only actions.
  - Add automated integration tests for unauthorized/invalid/rate-limited paths.

Global baseline controls from `src/app.ts`:

- `helmet`: Implemented
- `cors` allow-list from env: Implemented
- `generalLimiter` on `/api/*`: Implemented
- centralized error handler: Implemented

## Route Inventory and Controls

| Endpoint | Method | Current Exposure | Auth | Input Validation | Specific Rate Limit | Audit Log | Dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/v1/auth/` | GET | Public | Missing | Missing | Missing (`authLimiter` not wired) | Missing | MongoDB |
| `/api/v1/auth/login` | POST | Public | N/A (entry point) | Partial (manual field checks) | Missing (`authLimiter` not wired) | Missing | MongoDB, JWT |
| `/api/v1/auth/logout` | POST | Public | Missing | Missing | Missing | Missing | None |
| `/api/v1/reports` | GET | Public | Missing | Partial (query fields optional) | Missing (`reportLimiter` not wired) | Missing | MongoDB |
| `/api/v1/reports` | POST | Public write | Missing | Partial (manual required fields) | Missing (`reportLimiter` not wired) | Missing | MongoDB |
| `/api/v1/verify` | GET | Public | Missing | Missing | Missing (`verificationLimiter` not wired) | Missing | MongoDB |
| `/api/v1/verify` | POST | Public write | Missing | Partial (manual claim check) | Missing (`verificationLimiter` not wired) | Missing | MongoDB |
| `/api/v1/officials` | GET | Public | Missing | Partial (query regex) | Missing | Missing | MongoDB |
| `/api/v1/officials` | POST | Public write | Missing | Partial (manual required fields) | Missing | Missing | MongoDB |
| `/api/v1/projects` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/projects` | POST | Public write | Missing | Partial (manual required fields) | Missing | Missing | MongoDB |
| `/api/v1/evidence` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/evidence` | POST | Public write | Missing | Partial (manual required fields) | Missing | Missing | MongoDB |
| `/api/v1/livestream` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/livestream` | POST | Public write | Missing | Partial (manual required fields) | Missing | Missing | MongoDB |
| `/api/v1/petitions` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/petitions` | POST | Public write | Missing | Partial (manual required fields) | Missing | Missing | MongoDB |
| `/api/v1/petitions/:id/sign` | POST | Public write | Missing | Partial (`id` not validated; increments only) | Missing | Missing | MongoDB |
| `/api/v1/polls` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/polls` | POST | Public write | Missing | Partial (question/options check) | Missing | Missing | MongoDB |
| `/api/v1/polls/:id/vote` | POST | Public write | Missing | Partial (`optionIndex` check only) | Missing | Missing | MongoDB |
| `/api/v1/analytics` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/analytics/dashboard` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/analytics/ai-evidence` | GET | Public | Missing | Missing | Missing | Missing | MongoDB |
| `/api/v1/ai/chat` | POST | Public | Missing | Partial (`message` required, history sanitized) | Missing | Missing | MongoDB, OpenAI |

## Key Gaps Confirmed in Code

1. Middleware stubs not wired:
- `src/middleware/auth.ts`
- `src/middleware/validation.ts`

2. Validators are currently stub-level and unused:
- `src/validators/*.ts`

3. Route-specific limiters are defined but unused:
- `authLimiter`
- `reportLimiter`
- `verificationLimiter`

4. Write routes are publicly accessible without identity or role checks.

## Concrete Next Patches (Execution Queue)

1. Apply `authLimiter` to `POST /auth/login`.
2. Apply `reportLimiter` to `POST /reports`.
3. Apply `verificationLimiter` to `POST /verify`.
4. Implement JWT verification middleware and attach to all write routes except login.
5. Implement schema validation middleware and attach to all POST routes.
6. Add audit logging middleware for:
- report creation
- evidence submission
- verification submission
- petitions/polls votes/signatures
- AI chat requests (metadata only, no sensitive content)

## Boundary Test Cases (Minimum Set)

1. Unauthenticated `POST /reports` should fail once auth is enforced.
2. Invalid body for `POST /reports` should return validation `400`.
3. Burst login attempts should trigger `429`.
4. Invalid `preferredLanguage` on `/ai/chat` should normalize safely.
5. MongoDB unavailable should return safe `5xx` without internal stack traces.

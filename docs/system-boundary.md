# JusticeChain System Boundary

Last updated: 2026-03-04

## 1) Scope

This document defines the security and trust boundary for the JusticeChain platform:

- Frontend app (React/Vite)
- Backend API (`africajustice-backend`)
- Data stores (MongoDB, Redis)
- External AI provider (OpenAI)
- Operations/secrets boundary (`.env`, deployment environment)

## 2) Trust Zones

| Zone | Component | Trust Level | Notes |
| --- | --- | --- | --- |
| Z1 | User Browser / Mobile Client | Untrusted | All request input is untrusted. |
| Z2 | Frontend SPA (`src/*`) | Semi-trusted | Can be tampered client-side; never enforce security here. |
| Z3 | Backend API (`/api/v1/*`) | Trusted service boundary | Must enforce auth, validation, authorization, rate limits, and audit controls. |
| Z4 | MongoDB + Redis | Restricted internal | Only backend should connect. No direct client access. |
| Z5 | External AI (OpenAI API) | External third-party | Treat responses as untrusted generated content. |
| Z6 | Ops/Secrets (`.env`, infra config) | Highly trusted | Must be protected and rotated. |

## 3) Boundary Crossings

| Crossing | Data Flow | Required Controls |
| --- | --- | --- |
| Z1/Z2 -> Z3 | Auth, reports, evidence metadata, chatbot prompts | Input validation, auth, authorization, rate limiting, abuse monitoring, safe errors |
| Z3 -> Z4 (MongoDB) | CRUD for platform records | Least privilege DB user, query validation, timeout handling, error sanitization |
| Z3 -> Z4 (Redis) | Cache lookups/writes | Graceful degradation on cache failure, no secrets in cache keys |
| Z3 -> Z5 (OpenAI) | User prompt + context snapshot | Outbound timeout, fallback path, prompt/data minimization, no secret leakage |
| Z6 -> Z3 | Runtime config/secrets | Env validation, secret storage policy, rotation and audit |

## 4) Current Implementation Snapshot

Based on code inspection:

- Security middleware present globally in `africajustice-backend/src/app.ts`:
  - `helmet`, `cors`, `compression`, JSON body limits, `generalLimiter`.
- `MONGODB_URI` and `JWT_SECRET` are validated by `validateEnv` (non-test env).
- Endpoint-level auth middleware exists as stub in `src/middleware/auth.ts` but is not applied on routes.
- Request validator utilities exist under `src/validators/*` and `src/middleware/validation.ts`, but are stubs and not wired.
- Endpoint-specific rate limiters (`authLimiter`, `reportLimiter`, `verificationLimiter`) are defined but not wired to routes.
- AI route uses language normalization and fallback strategy (`src/routes/ai.routes.ts`, `src/services/aiService.ts`).
- Audit logging for sensitive operations is not implemented.

## 5) Boundary Policy (Target State)

All `POST`, `PUT`, `PATCH`, `DELETE` API routes must enforce:

1. Authentication (except explicitly public endpoints like login/register).
2. Authorization (role-based where needed).
3. Structured validation (request body, params, query).
4. Route-specific rate limits.
5. Audit log event for write actions.
6. Safe error responses (no stack traces/secrets in responses).

All outbound AI calls must enforce:

1. Timeout and fallback (already partially implemented).
2. Data minimization in context payload.
3. Output guardrails before returning to client.

## 6) Immediate Execution Backlog

### P0 (must-do)

- Done:
  - JWT auth middleware implemented and wired to write routes.
  - Express-validator based request validation implemented and wired to key write endpoints.
  - Route-specific rate limiting wired for auth, reports, verification, and AI chat.
  - Audit logging middleware added for critical write operations.
- Remaining:
  - Normalize authorization policy for public-citizen actions vs authenticated-only actions.
  - Add persistent audit sink (currently console JSON logs).
  - Add negative integration tests for auth/validation/rate-limit enforcement.

### P1 (next)

- Introduce role policy for admin/official-only operations.
- Add endpoint tests for unauthorized, invalid payload, and rate-limit behavior.
- Add request ID correlation for traceability across logs.

### P2 (hardening)

- Add WAF-like abuse patterns for AI/chatbot endpoint.
- Add secret rotation process and policy checks.
- Add output filtering policy for AI responses.

## 7) Verification Checklist

Use this after implementing P0:

- Unauthenticated write requests return `401/403`.
- Invalid payloads return `400` with clear schema errors.
- Burst requests trigger `429`.
- DB failures return safe `5xx` JSON (no internals leaked).
- AI endpoint falls back cleanly when provider is unavailable.

# Login Failure Troubleshooting (MongoDB)

Last updated: 2026-03-14

Use this when login fails because the backend cannot reach MongoDB.

## Quick diagnosis (fill in your current values)
- Frontend URL: <frontend-url>
- Backend URL: <backend-url>
- Symptom: Login fails or `/health` shows `mongodb: DOWN`

## Common causes
1. Atlas IP whitelist does not include your hosting provider
2. Invalid credentials or outdated connection string
3. Cluster is paused, initializing, or unhealthy

## Fix steps
1. Atlas Network Access
   - Add `0.0.0.0/0` temporarily, or add your provider IPs

2. Regenerate connection string
   - Use the Atlas Connect button
   - Update `MONGODB_URI` in your backend environment

3. Redeploy backend
   - Trigger a new deploy from your hosting provider

4. Verify health
```
curl <backend-url>/health
```
Expected: `mongodb` shows `UP`.

## Notes
- If DNS propagation is in progress after a region migration, allow 15-30 minutes.
- Always rotate secrets if they were exposed in logs or docs.

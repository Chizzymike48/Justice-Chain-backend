# MongoDB Migration Diagnostic

Last updated: 2026-03-14

Purpose: Checklist for troubleshooting connectivity after an Atlas region migration.

## Example symptoms (replace with your current observations)
- Cluster moved regions
- Backend returns 5xx for database-backed requests
- Local connection fails with a `querySrv ECONNREFUSED` error

## Example connection string (redacted)
```
mongodb+srv://<db_user>:<db_password>@<cluster-host>/<db_name>?ssl=true&authSource=admin&retryWrites=true&w=majority
```

## Possible issues after migration
1. DNS propagation delay
   - Old region DNS may be cached
   - New region DNS not fully propagated
   - Action: wait 15-30 minutes or clear DNS cache

2. Cluster nodes not fully ready
   - Migration may still be initializing nodes
   - Replica set not fully synced
   - Action: check MongoDB Atlas activity logs

3. SSL/certificate mismatch
   - New cluster may have new certificates
   - Connection string may need regeneration
   - Action: generate a fresh connection string from Atlas

4. Replica set configuration
   - Old replica set info cached in DNS
   - New replica set not registered yet
   - Action: Atlas usually handles this automatically; re-check after DNS clears

## Next steps
1. Confirm MongoDB Atlas status is "Healthy"
2. Get a fresh connection string from the Connect button
3. Compare with current `.env` `MONGODB_URI`
4. Update and redeploy the backend if different
5. Check hosting provider build/deployment logs
6. Re-test the connection

# Render Deployment Fix - TODO

## Steps to complete:

### 1. [x] Update render.yaml
- Edit buildCommand: `npm install && npm run build`
- Edit startCommand: `npm start`
- Commit/push to GitHub backend repo

### 2. [x] Test local backend build
- Run: `cd africajustice-backend && npm install && npm run build`
- Verify `dist/` folder created successfully

### 3. [x] Test local backend start
- Run: `cd africajustice-backend && npm start`
- Confirm server starts without errors (Ctrl+C to stop)

### 4. [ ] Re-deploy on Render
- Push changes to main branch on https://github.com/Chizzymike48/Justice-Chain-backend
- Monitor Render dashboard for successful build/deploy

### 5. [ ] Verify deployment
- Test API endpoints on Render URL
- Check logs for errors

**Status: Starting step 1**


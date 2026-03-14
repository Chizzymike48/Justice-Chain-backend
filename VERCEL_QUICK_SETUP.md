# ⚡ VERCEL QUICK SETUP - Visual Reference

## 📍 LOCATION: Settings → Build & Development Settings

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL PROJECT SETTINGS                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Build Command:        npm run build:frontend               │
│  Output Directory:     africajustice-frontend/dist          │
│  Install Command:      npm install                          │
│  Development Command:  npm run dev:frontend                 │
│  Ignored Build Step:   (leave blank)                        │
│  Node.js Version:      20.x                                 │
│                                                              │
│  [ ] Override Vercel System                                 │
│  [ ] Include source maps in Serverless Functions            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 LOCATION: Settings → Git

```
┌─────────────────────────────────────────────────────────────┐
│  GIT INTEGRATION                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub App:   ✅ Connected                                 │
│  Repository:   Chizzymike48/Justice-Chain-backend           │
│  Branch:       main                                         │
│  Auto Deploy:  ✅ ENABLED (toggle ON if off)               │
│                                                              │
│  Production Branch: main                                    │
│  Preview Branches: (leave default)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 YOUR vercel.json (Already Correct)

**File location**: Root directory
```json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "africajustice-frontend/dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

✅ This file is **already correct and committed** to GitHub

---

## ✅ QUICK ACTION STEPS

### If builds still not triggering:

**STEP 1**: Click "Settings"
```
Top nav: Settings
├─ General
├─ Build & Development Settings  ← OPEN THIS
├─ Git
├─ Environment Variables
└─ Advanced
```

**STEP 2**: Verify Build Command
```
Current:  npm run build:frontend
Should be: npm run build:frontend
Match? ✅ Yes → Continue
```

**STEP 3**: Verify Output Directory
```
Current:  africajustice-frontend/dist
Should be: africajustice-frontend/dist
Match? ✅ Yes → Continue
```

**STEP 4**: Clear Cache (if settings correct)
```
Settings → Scroll to bottom → "Advanced" section
Click: "Clear Build Cache"
```

**STEP 5**: Redeploy
```
Top nav: Deployments
Find: Most recent deployment
Menu: ... (three dots) → "Redeploy"
Wait: 2-5 minutes
```

**STEP 6**: Check Build Logs
```
Deployments tab
Click: The new deployment that just started
View: Build logs and console output
Look for: "✅ built in X.XXs" = SUCCESS
```

**STEP 7**: Verify Live URL
```bash
node check-live-languages.js
```

Should show:
```
✅ Summary: 9/9 languages found in live bundle
✅ Bundle hash: index-[NEW_HASH].js (NOT DEELRG19)
```

---

## 🎯 EXPECTED RESULT

After these steps, visit: **https://justice-chain-frontend.vercel.app/**

Look at **language dropdown** (top navbar):
```
Expected:
1. English
2. Français
3. Español
4. Kiswahili
5. Português
6. አማርኛ (Amharic)
7. Hausa ← NEW
8. Yoruba ← NEW
9. Igbo ← NEW
```

If you see **9 languages** including Hausa/Yoruba/Igbo → ✅ **SUCCESS!**

---

## 🆘 IF STILL NOT WORKING

**Nuclear Option** - Reconnect GitHub:

1. Settings → Git
2. Click "Disconnect"
3. Click "Connect Git Repository"
4. Select "Chizzymike48/Justice-Chain-backend"
5. Authorize Vercel app
6. Wait for automatic deployment
7. Check Deployments tab

---

## 📞 DEBUGGING INFO

If build still fails, **check the error message**:

| Error Message | Solution |
|---|---|
| "command not found: npm run build:frontend" | Build Command field is wrong - set to `npm run build:frontend` |
| "africajustice-frontend/dist not found" | Build didn't run properly - check build logs |
| "Cannot find module" | Missing package.json script - verify `npm run build:frontend` works locally |
| "Node version error" | Set Node to 20.x in Environment Variables |

To **see full error**, click on the failed deployment in "Deployments" tab and read the build logs.

---

**Map of Dashboard**:
```
https://vercel.com/dashboard
    ↓
Find your project: justice-chain-frontend (or related)
    ↓
Click project name
    ↓
Settings (left sidebar) ← DO THESE STEPS
    ↓
Deployments (left sidebar) ← THEN COME HERE
    ↓
Click latest deployment
    ↓
View build logs ← READ IF ERROR
    ↓
Redeploy button ← CLICK THIS
```

---

That's everything you need to get Vercel building and deploying with all 9 languages! 🚀

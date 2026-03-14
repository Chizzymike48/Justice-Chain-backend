# 📋 VERCEL SETUP GUIDE - Step by Step

## ✅ CONTEXT
- **Project Type**: Monorepo (root + 2 subfolders)
- **Frontend**: africajustice-frontend (React + Vite)
- **Backend**: africajustice-backend (Express/Node.js)
- **Goal**: Deploy ONLY frontend to Vercel with all 9 languages

---

## 🚀 STEP 1: Go to Vercel Dashboard

**URL**: https://vercel.com/dashboard
- Log in with your GitHub account
- Find your "Justice-Chain-backend" project (or create new one)

---

## 🔧 STEP 2: Project Settings (Left Sidebar)

Click: **Settings** → Look for these sections:

### A. GENERAL
- **Project Name**: justice-chain-frontend ✓ (should match)
- **Framework Preset**: React ✓ (confirmed)
- **Root Directory**: Leave **BLANK** or set to `.` (Vercel will use root)

### B. BUILD & DEVELOPMENT SETTINGS
This is the **CRITICAL** section. Set these EXACTLY:

| Setting | Value | Notes |
|---------|-------|-------|
| **Build Command** | `npm run build:frontend` | This runs the correct script from root package.json |
| **Output Directory** | `africajustice-frontend/dist` | Where Vite outputs the build |
| **Install Command** | `npm install` | Standard install |
| **Development Command** | `npm run dev:frontend` | Optional, for Vercel Analytics |

✅ **Your vercel.json already has these!** But Vercel dashboard can override it.

### C. ENVIRONMENT VARIABLES
- Check if any are needed (probably not for frontend)
- **VITE_API_URL** = your backend API URL if needed
- Leave blank if using relative paths

---

## 📍 STEP 3: GitHub Integration

Click: **Git**

### Check these settings:
- ✅ **GitHub App Installed**: Should show "Connected"
- ✅ **Repo**: Should show "Chizzymike48/Justice-Chain-backend"
- ✅ **Branch**: Should be "main" and **enabled**
- ✅ **Auto-Deploy**: Should be **enabled** (toggle ON if off)

**If NOT connected:**
1. Click "Connect Git Repository"
2. Select "Chizzymike48/Justice-Chain-backend"
3. Authorize Vercel app
4. Select branch: **main**

---

## 🔄 STEP 4: Deployments Tab

Click: **Deployments** (in top nav)

### Check what's deployed:
- Find the deployment with old bundle (DEELRG19.js)
- This is what's currently live
- There should be NO newer deployments

**If no recent builds:**
- Shows Vercel hasn't detected your commits
- This is the problem!

---

## 🧹 STEP 5: Clear Cache & Force Redeploy

In **Deployments** tab:

1. **Click the 3-dot menu** on the latest deployment
2. Select: **"Redeploy"** or **"Rebuild"**
3. **Wait 2-5 minutes** for build to complete

**Alternative - Clear cache:**
1. Go back to **Settings**
2. Find **"Advanced"** section
3. Click **"Clear Build Cache"**
4. Then go back to **Deployments** → Click **"Redeploy"**

---

## 🏗️ STEP 6: Monitor the Build

In **Deployments**:

1. Find the **newest deployment** (should be in progress)
2. Click on it to see **build logs**
3. **Watch for errors** - this shows what went wrong
4. **Look for**: 
   - ✅ "Building..." → "Ready" (success)
   - ❌ Any error messages
   - Check if it ran `npm run build:frontend`

---

## ✅ STEP 7: Verify the Fix Worked

Once deployment shows **Green checkmark** and says **"Ready"**:

1. Go back to terminal
2. Run: `node check-live-languages.js`
3. Look for:
   - **New bundle hash** (NOT DEELRG19)
   - **9/9 languages found** ✅

If you see 9/9 languages → **Success! 🎉**

---

## 🚨 TROUBLESHOOTING

### If build still fails:

**Check build logs in Deployment details:**

❌ **"npm run build:frontend not found"**
- Fix: Make sure root `package.json` has the script
- Verify: `grep "build:frontend" package.json`

❌ **"africajustice-frontend not found"**
- Fix: Output directory in Settings should be: `africajustice-frontend/dist`
- NOT just `dist`

❌ **Node version errors**
- Fix: Go to Settings → Environment
- Add: `NODE_VERSION` = `20` (or 20.x)

❌ **npm install errors**
- Fix: Clear cache (Settings → Advanced → Clear Build Cache)
- Redeploy

---

## 📋 SETTINGS CHECKLIST

Before clicking "Redeploy", verify:

- [ ] Build Command: `npm run build:frontend`
- [ ] Output Directory: `africajustice-frontend/dist`
- [ ] Framework: React
- [ ] Node version: 20.x (or 20)
- [ ] GitHub connected and auto-enabled
- [ ] Branch: main
- [ ] vercel.json exists in root ✓

---

## 🎯 FINAL STEPS

### Option A: Quick Fix (Recommended)
1. Go to **Deployments**
2. Click **Redeploy** on latest
3. Wait 2-5 minutes
4. Check with: `node check-live-languages.js`

### Option B: Full Reset
1. Go to **Settings**
2. Clear Build Cache
3. Verify Build Command = `npm run build:frontend`
4. Verify Output Directory = `africajustice-frontend/dist`
5. Go to **Deployments**
6. Click **Redeploy**
7. Monitor build logs
8. Check result

### Option C: Nuclear Option
1. Disconnect GitHub integration
2. Reconnect GitHub integration
3. Select branch: main
4. Let it deploy automatically
5. Monitor

---

## 📊 SUCCESS INDICATORS

After fix, you should see:

✅ **In terminal:**
```
node check-live-languages.js
  Found JS bundle: https://justice-chain-frontend.vercel.app/assets/index-[NEW_HASH].js
  Summary: 9/9 languages found in live bundle
```

✅ **Live URL:**
```
https://justice-chain-frontend.vercel.app/
- Dropdown shows 9 languages
- Hausa, Yoruba, Igbo visible
```

✅ **In Vercel Dashboard:**
```
Deployments → Latest → Status: Ready ✓ (Green checkmark)
```

---

**That's it! The code is perfect - just need Vercel to actually build it.** 🚀

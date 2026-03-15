# 🧪 JusticeChain Site Testing Checklist

**Current Live Site:** https://justice-chain-frontend.vercel.app/  
**Purpose:** Verify all core features work BEFORE creating new GitHub repo  
**Expected Languages:** 9 total (EN, FR, ES, SW, PT, AM, HA, YO, IG)  

---

## ✅ PHASE 1: PUBLIC PAGES (No Login Required)

### 1. **Home Page**
- [ ] URL: `https://justice-chain-frontend.vercel.app/` loads without errors
- [ ] View page layout, header, navigation
- [ ] Check language dropdown (should show 9 languages)
- [ ] Verify Hausa, Yoruba, Igbo present in dropdown
- [ ] Click language selector dropdown - all 9 should be visible
- [ ] Try switching languages (EN → FR → ES → etc.)
- [ ] Page content updates when language changes
- [ ] Check for any console errors (F12 > Console)

### 2. **Livestreams Page** 
- [ ] URL: `https://justice-chain-frontend.vercel.app/livestreams` loads
- [ ] Page displays correctly
- [ ] Can see livestream list/interface
- [ ] No missing or broken components
- [ ] Language switching works on this page

### 3. **Login Page**
- [ ] URL: `https://justice-chain-frontend.vercel.app/login` loads
- [ ] Form displays correctly
- [ ] Email/password fields present
- [ ] "Sign Up" link works
- [ ] Try invalid credentials (you should see error message, then stay on login page)
- [ ] Language switching works on this page

### 4. **Sign Up Page**
- [ ] URL: `https://justice-chain-frontend.vercel.app/signup` loads
- [ ] Form displays correctly
- [ ] All fields present (name, email, password, etc.)
- [ ] Terms & conditions link works
- [ ] "Log In" link works
- [ ] Language switching works on this page

### 5. **Help/Guide Page**
- [ ] URL: `https://justice-chain-frontend.vercel.app/help` loads
- [ ] Help content displays
- [ ] No broken links or images
- [ ] Language switching works on this page

---

## 🔐 PHASE 2: PROTECTED PAGES (Requires Login)

**Prerequisites:** Create test account if possible OR use existing credentials

### 6. **Report Corruption**
- [ ] URL: `https://justice-chain-frontend.vercel.app/report-corruption` requires login
- [ ] Redirects to login if not authenticated ✓
- [ ] After login: form displays correctly
- [ ] All form fields present (title, description, evidence, etc.)
- [ ] File upload works
- [ ] Form submission works
- [ ] Language switching works on this page

### 7. **Verify Reports**
- [ ] URL: `https://justice-chain-frontend.vercel.app/verify` requires login
- [ ] Can see reports to verify
- [ ] Report cards display correctly
- [ ] Verification buttons/actions work
- [ ] Language switching works on this page

### 8. **Report Issue**
- [ ] URL: `https://justice-chain-frontend.vercel.app/report-issue` requires login
- [ ] Issue report form displays
- [ ] Form fields work
- [ ] Language switching works on this page

### 9. **Officials Page**
- [ ] URL: `https://justice-chain-frontend.vercel.app/officials` requires login
- [ ] Officials list/directory displays
- [ ] Can view official details
- [ ] Language switching works on this page

### 10. **Projects Page**
- [ ] URL: `https://justice-chain-frontend.vercel.app/projects` requires login
- [ ] Projects list displays
- [ ] Project cards show correctly
- [ ] Can click/view project details
- [ ] Language switching works on this page

### 11. **Track Projects**
- [ ] URL: `https://justice-chain-frontend.vercel.app/track-projects` requires login
- [ ] Can track project progress
- [ ] Data/charts display correctly
- [ ] Language switching works on this page

### 12. **Petitions & Polls**
- [ ] URL: `https://justice-chain-frontend.vercel.app/petitions` requires login
- [ ] Can view petitions/polls
- [ ] Can vote/sign petitions
- [ ] Language switching works on this page

### 13. **Analytics**
- [ ] URL: `https://justice-chain-frontend.vercel.app/analytics` requires login
- [ ] Analytics dashboard displays
- [ ] Charts/data visible
- [ ] No data loading errors
- [ ] Language switching works on this page

### 14. **Dashboard (User)**
- [ ] URL: `https://justice-chain-frontend.vercel.app/dashboard` requires login
- [ ] User dashboard displays
- [ ] Shows user's reports/submissions
- [ ] Personalization works
- [ ] Language switching works on this page

### 15. **Admin Pages** (if you have admin access)
- [ ] URL: `https://justice-chain-frontend.vercel.app/admin` requires admin login
- [ ] Admin dashboard loads
- [ ] Can view moderation queue
- [ ] Report moderation interface works
- [ ] Evidence review interface works
- [ ] User management works
- [ ] Language switching works on admin pages

---

## 🌐 PHASE 3: LANGUAGE VERIFICATION (Critical)

### Language Dropdown Tests
- [ ] **On Home Page:** Click language dropdown
  - [ ] Shows ALL 9 languages
  - [ ] **New languages visible:**
    - [ ] Hausa (ha)
    - [ ] Yoruba (yo) 
    - [ ] Igbo (ig)
  - [ ] All 6 original languages visible too
  - [ ] Dropdown appearance is clean/not broken

- [ ] **Switch to Hausa (ha):**
  - [ ] Page content updates
  - [ ] Navigation text changes
  - [ ] Form labels change
  - [ ] No console errors
  - [ ] Stays on Hausa after refresh? (localStorage test)

- [ ] **Switch to Yoruba (yo):**
  - [ ] Page content updates
  - [ ] Navigation text changes
  - [ ] Form labels change
  - [ ] No console errors

- [ ] **Switch to Igbo (ig):**
  - [ ] Page content updates
  - [ ] Navigation text changes
  - [ ] Form labels change
  - [ ] No console errors

- [ ] **Language persistence:** 
  - [ ] Select Hausa, refresh page
  - [ ] Page should load in Hausa
  - [ ] Verify in local storage (F12 > Application > Local Storage)

- [ ] **Language switching on different pages:**
  - [ ] Home in English, go to Login in French
  - [ ] Go to Help in Spanish
  - [ ] Go back to Home
  - [ ] Language selection remembered? Or need to select again?

---

## 🔧 PHASE 4: TECHNICAL CHECKS

### Browser Console (F12)
- [ ] No JavaScript errors on Home page
- [ ] No JavaScript errors on Login page
- [ ] No 404 errors for assets/images
- [ ] No warnings about missing translations
- [ ] Network tab shows successful bundle load:
  - [ ] Main JS bundle (`index-*.js`) loads successfully
  - [ ] Check the bundle contains Hausa, Yoruba, Igbo translations

### Performance
- [ ] Page load time reasonable (< 5 seconds)
- [ ] No infinite loading spinners
- [ ] Buttons respond immediately to clicks

### Responsive Design
- [ ] Desktop view (1920x1080) works correctly
- [ ] Tablet view (768px) responsive
- [ ] Mobile view (375px) responsive
- [ ] Language dropdown works on mobile

---

## 🚀 PHASE 5: CRITICAL FLOW TESTS

### User Authentication Flow
- [ ] Click "Log In" button on Home
- [ ] Login page loads correctly
- [ ] Enter credentials
- [ ] Can successfully log in
- [ ] Dashboard/protected page loads
- [ ] Log out works
- [ ] "Log Out" brings user back to Home

### Signup Flow (if available)
- [ ] Click "Sign Up" link on Login page
- [ ] Signup form displays
- [ ] Can fill form
- [ ] Can create account
- [ ] Auto-login or redirect to login after signup works

### Navigation Menu
- [ ] All navigation links present and working
- [ ] No broken links
- [ ] Active page indicator highlight works
- [ ] Mobile menu opens/closes properly

---

## ✅ PASS/FAIL CRITERIA

### PASS ✅
- All public pages load without errors
- Login/signup workflow functional
- All 9 languages visible in dropdown
- Hausa, Yoruba, Igbo switch language correctly
- No console errors in browser
- Protected routes properly require authentication
- Page navigation smooth

### FAIL ❌ (Requires Fix)
- Any page returns error/blank
- Language dropdown missing new languages
- New languages don't switch content
- Console errors preventing functionality
- Auth flow broken
- 404 errors for resources

---

## 📝 NOTES

- **Current Issue:** Live site showing 6/9 languages (missing HA, YO, IG)
- **Goal:** Verify that after new repo + redeploy, all 9 languages appear
- **Local Status:** ✅ Local build has all 9 languages confirmed
- **Next Step:** After completing this checklist, create new GitHub repo if: 
  - All features work functionally
  - Language dropdown still shows only 6 (confirming Vercel issue)
  - New repo rebuildable with all 9 languages

---

## 📋 TEST RESULTS SUMMARY

**Date Tested:** _______________  
**Tester:** _______________  
**Site Status:** ☐ Working / ☐ Has Issues  

### Phase 1 (Public Pages): ____ / 5 passed
### Phase 2 (Protected Pages): ____ / 10 passed  
### Phase 3 (Languages): ____ / 6 passed
### Phase 4 (Technical): ____ / 3 passed
### Phase 5 (Flows): ____ / 3 passed

**Total Progress:** ____ / 27 checks passed

**Critical Issues Found:** _______________

**Ready for New Repo?** ☐ YES ☐ NO

---

# TESTING QUICK START

## 🚀 Run Tests (Pick One)

### Frontend Tests (React Components)
```bash
npm run test                # Run all component tests
npm run test:ui            # View tests in browser UI
npm run test:coverage      # Generate coverage reports
npm run test -- AdminDashboard  # Test specific file
```

### Backend Tests (Admin Controller, Auth, etc.)
```bash
cd africajustice-backend
npm run test              # Run all backend tests
npm run test:watch       # Re-run on file changes
npm run test -- adminController  # Test specific file
```

### E2E Tests (Full Admin Workflows)
```bash
npm run e2e              # Open Cypress interactive runner
npm run e2e:run          # Run all E2E tests headless
npm run e2e:run -- --browser chrome  # Use Chrome
```

---

## 📊 What Gets Tested

| Test Type | Framework | Coverage | Run Time |
|-----------|-----------|----------|----------|
| **Unit** | Jest (Backend) | adminController, auth, models | 2-5 sec |
| **Component** | Vitest (Frontend) | Pages, dialogs, forms | 3-8 sec |
| **E2E** | Cypress (Browser) | Full workflows, access control | 30-60 sec |

---

## ✅ Test Suite Breakdown

### Backend Tests (Jest)
- ✅ adminController: 8 test scenarios
- ✅ Auth: Login/register/password reset
- ✅ Reports: CRUD operations
- ✅ Verifications: Claim validation
- **Total:** 20+ backend tests

### Frontend Tests (Vitest)
- ✅ AdminDashboard: Render, metrics, navigation
- ✅ ReportModerationPage: Approve/reject, pagination
- ✅ UserManagementPage: Role changes, filtering
- **Total:** 10+ component tests

### E2E Tests (Cypress)
- ✅ Admin moderation workflow
- ✅ Dashboard navigation
- ✅ User management
- ✅ Access control (citizen/moderator/admin)
- **Total:** 15+ E2E scenarios

---

## 📁 Test Files Location

```
Root/
  ├── vitest.setup.ts
  ├── vite.config.ts (with test config)
  ├── src/pages/
  │   ├── AdminDashboard.test.tsx
  │   └── ReportModerationPage.test.tsx
  
africajustice-backend/
  ├── jest.config.ts
  └── tests/
      ├── adminController.test.ts (NEW)
      ├── auth.test.js
      ├── reports.test.js
      └── verify.test.js

cypress/
  ├── e2e/
  │   └── admin.cy.ts
  ├── support/
  │   ├── e2e.ts
  │   └── commands.ts
  └── cypress.config.ts
```

---

## 🎯 Run All Tests (CI Pipeline)

```bash
# 1. Frontend tests + coverage
npm run test:coverage

# 2. Backend tests + coverage
cd africajustice-backend
npm run test
cd ..

# 3. Start servers and run E2E
npm run dev &
cd africajustice-backend && npm run dev &
npm run e2e:run

# Stop background jobs
# kill $!  (on Linux/Mac)
# Or close terminals manually
```

---

## 📈 Coverage Targets

- **Lines:** 80%+ coverage
- **Functions:** 80%+ coverage
- **Branches:** 80%+ coverage
- **Statements:** 80%+ coverage

View reports:
- Frontend: `coverage/lcov-report/index.html`
- Backend: `africajustice-backend/coverage/lcov-report/index.html`

---

## 🛠️ Debug Tests

### Frontend
```bash
# Run single test
npm run test -- -t "should render dashboard"

# Watch mode (re-run on change)
npm run test -- --watch

# UI mode (visual test runner)
npm run test:ui
```

### Backend
```bash
# Run single test file
npm run test -- tests/adminController.test.ts

# Watch mode
npm run test:watch

# Verbose output
npm run test -- --verbose
```

### E2E (Cypress)
```bash
# Interactive runner (best for debugging)
npm run e2e

# Run specific test file
npm run e2e:run -- --spec "cypress/e2e/admin.cy.ts"

# Run with video recording
npm run e2e:run -- --record
```

---

## 🔑 Key Test Scenarios

### Admin Tests
```
1. Login as admin
2. View admin dashboard with KPI cards
3. Navigate to report moderation
4. Approve a report
5. Confirm approval
6. See success notification
```

### Moderator Tests
```
1. Login as moderator
2. Cannot access user management ✗
3. CAN access report moderation ✓
4. CAN approve/reject reports ✓
5. Cannot see admin-only pages ✗
```

### Citizen Tests
```
1. Login as citizen
2. Cannot access admin pages ✗
3. Redirected to dashboard ✓
4. Can view reports ✓
5. Can create reports ✓
```

---

## 🐛 Troubleshooting

### Tests Not Running?
```bash
# Clear cache
rm -rf node_modules/.vite
npm run test -- --force

# Reinstall dependencies
rm package-lock.json
npm install
npm run test
```

### Cypress Not Found?
```bash
# Install it
npm install --save-dev cypress

# Then run
npm run e2e
```

### Database Connection Error (Backend)?
```bash
# Check MongoDB is running
# Linux/Mac: brew services start mongodb-community
# Windows: MongoDB should auto-start if installed

# Set test environment variable
NODE_ENV=test npm run test
```

---

## 📚 Learn More

- **Jest Docs:** https://jestjs.io/
- **Vitest Docs:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Cypress Docs:** https://docs.cypress.io/

---

## ✨ Next Phase

**Phase 4.3:** Real-Time Features (WebSocket)
- Live updates when content arrives
- Notifications for moderators
- Socket.io integration

**Phase 4.6:** CI/CD Integration
- GitHub Actions workflow
- Automated test runs
- Coverage reporting

---

**Last Updated:** March 6, 2026  
**Testing Status:** ✅ READY

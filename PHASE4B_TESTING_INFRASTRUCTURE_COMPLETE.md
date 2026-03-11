# Phase 4.2: Testing Infrastructure - Complete ✅

**Status:** Multi-layer testing setup complete and ready to use  
**Completion Date:** March 6, 2026  
**Test Coverage:** Backend unit tests, frontend component tests, E2E tests

---

## TESTING ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING INFRASTRUCTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LAYER 1: Unit Tests (Backend)                               │
│  ──────────────────────────────                              │
│  - Jest + ts-jest for TypeScript                             │
│  - Mock Mongoose models                                      │
│  - Test adminController (10 functions)                       │
│  - Test auth, reports, verification flows                    │
│  - Command: npm run test                                     │
│                                                               │
│  LAYER 2: Component Tests (Frontend)                         │
│  ────────────────────────────────────                        │
│  - Vitest + jsdom for React DOM                              │
│  - @testing-library/react for components                     │
│  - Test AdminDashboard render & data fetch                   │
│  - Test ReportModerationPage workflows                       │
│  - Test UserManagementPage role changes                      │
│  - Command: npm run test                                     │
│                                                               │
│  LAYER 3: E2E Tests                                          │
│  ───────────────────                                         │
│  - Cypress for browser automation                            │
│  - Test full admin moderation workflow                       │
│  - Test access control (citizen/moderator/admin)             │
│  - Test data persistence across pages                        │
│  - Command: npm run e2e                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## BACKEND TESTING (Jest + Node)

### Setup
- **Framework:** Jest 29.7.0
- **TypeScript Support:** ts-jest
- **HTTP Testing:** supertest
- **Mocking:** jest.mock for models and services
- **Environment:** node (not jsdom)

### Files Created
- `africajustice-backend/tests/adminController.test.ts` – 200+ lines
  - Tests for all 10 admin controller functions
  - Mock Report, Verification, Evidence, User models
  - Tests for success cases, error cases, validations

### Existing Tests
- `africajustice-backend/tests/auth.test.js` – Auth endpoints
- `africajustice-backend/tests/reports.test.js` – Report creation
- `africajustice-backend/tests/verify.test.js` – Verification endpoints
- `africajustice-backend/tests/security-boundary.test.ts` – Security checks

### Running Backend Tests

```bash
# Run all tests with coverage
cd africajustice-backend
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npm run test -- tests/adminController.test.ts

# Run with verbose output
npm run test -- --verbose
```

### Example Backend Test

```typescript
describe('Admin Controller', () => {
  it('should update user role', async () => {
    const mockUser = {
      _id: 'user-123',
      role: 'citizen',
      save: jest.fn(),
    }
    
    User.findById = jest.fn().mockResolvedValue(mockUser)
    
    await adminController.updateUserRoleController(req, res)
    
    expect(mockUser.role).toBe('moderator')
    expect(mockUser.save).toHaveBeenCalled()
  })
})
```

### Coverage Reports
After running tests, view coverage at:
```
africajustice-backend/coverage/lcov-report/index.html
```

---

## FRONTEND TESTING (Vitest + React)

### Setup
- **Framework:** Vitest 4.0.18 (Vite-native testing)
- **DOM:** jsdom (browser simulation)
- **Component Testing:** @testing-library/react
- **User Interactions:** @testing-library/user-event
- **Configuration:** `vite.config.ts` with test config
- **Setup File:** `vitest.setup.ts` (localStorage mock, cleanup)

### Files Created
- `vitest.setup.ts` – Global test setup
  - Mock localStorage
  - Mock window.matchMedia
  - Cleanup after each test
  - Import @testing-library/jest-dom

- `src/pages/AdminDashboard.test.tsx` – 120+ lines
  - Test dashboard renders
  - Test KPI metrics display
  - Test moderation queue links
  - Test error handling
  - Test redirect for non-admins

- `src/pages/ReportModerationPage.test.tsx` – 200+ lines
  - Test reports list displays
  - Test approve/reject workflows
  - Test confirmation dialogs
  - Test pagination
  - Test status filtering
  - Test role-based redirects

### Running Frontend Tests

```bash
# Run all tests
npm run test

# Run tests in UI mode (watch with visual interface)
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/pages/AdminDashboard.test.tsx

# Run tests matching pattern
npm run test -- --grep "Dashboard"

# Run single test
npm run test -- -t "should render dashboard title"
```

### Example Frontend Test

```typescript
describe('ReportModerationPage', () => {
  it('should display approval confirmation dialog', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockContext}>
          <ReportModerationPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )
    
    const approveButton = await screen.findByText(/approve/i)
    await user.click(approveButton)
    
    expect(screen.getByText(/confirm/i)).toBeInTheDocument()
  })
})
```

### Coverage Reports
After running tests with coverage:
```bash
npm run test:coverage
```

Coverage reports stored in: `coverage/` directory

---

## END-TO-END TESTING (Cypress)

### Setup
- **Framework:** Cypress (browser automation)
- **Configuration:** `cypress.config.ts`
- **Support Files:** `cypress/support/` (commands, helpers)
- **Test Files:** `cypress/e2e/` (actual tests)

### Files Created
- `cypress.config.ts` – Main Cypress configuration
- `cypress/support/e2e.ts` – Global setup
- `cypress/support/commands.ts` – Custom commands
  - `cy.login(email, password)` – Login helper
  - `cy.loginAsAdmin()` – Admin login
  - `cy.loginAsModerator()` – Moderator login
  - `cy.visitAdminDashboard()` – Navigate to dashboard
  - `cy.visitReportModeration()` – Navigate to reports

- `cypress/e2e/admin.cy.ts` – E2E test suite (300+ lines)
  - Admin Report Moderation workflow
  - Admin Dashboard navigation
  - User Management role changes
  - Admin access control validation

### Running E2E Tests

```bash
# Open Cypress interactive test runner
npm run e2e

# Run all E2E tests headless
npm run e2e:run

# Run specific test file
npm run e2e:run -- --spec "cypress/e2e/admin.cy.ts"

# Run with Chrome browser
npm run e2e:run -- --browser chrome

# Run with video recording
npm run e2e:run -- --record
```

### Example E2E Test

```typescript
describe('Admin Report Moderation E2E', () => {
  it('should complete full moderation workflow', () => {
    cy.loginAsAdmin()
    cy.visitReportModeration()
    
    cy.get('[data-testid="report-card"]').first().within(() => {
      cy.get('button:contains("Approve")').click()
    })
    
    // Confirm dialog appears
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('button:contains("Confirm")').click()
    
    // Success notification
    cy.get('[role="alert"]').should('contain', 'approved')
  })
})
```

### Coverage Features
- **Video Recording:** Captures failed test runs automatically
- **Screenshots:** Auto-saved on test failures
- **Time Travel:** Debug by clicking on commands
- **Network Monitoring:** Watch API calls in test runner

---

## COMPREHENSIVE TEST COVERAGE

### Backend Unit Tests (adminController.test.ts)

**Admin Dashboard:**
- ✅ Returns dashboard statistics
- ✅ Handles database errors
- ✅ Counts reports by status
- ✅ Counts users by role

**Report Moderation:**
- ✅ Fetches pending reports with pagination
- ✅ Filters reports by status
- ✅ Approves reports and updates status
- ✅ Rejects reports with reason
- ✅ Returns 404 for missing reports

**Verification Review:**
- ✅ Verifies claims with confidence score
- ✅ Disputes claims with notes
- ✅ Updates verification status

**Evidence Review:**
- ✅ Approves evidence files
- ✅ Rejects evidence with reason
- ✅ Tracks reviewer metadata

**User Management:**
- ✅ Updates user roles
- ✅ Prevents self-demotion
- ✅ Allows admin to promote citizens
- ✅ Validates role values

### Frontend Component Tests

**AdminDashboard.test.tsx:**
- ✅ Renders dashboard title
- ✅ Displays KPI cards with metrics
- ✅ Calls API on mount
- ✅ Shows moderation queue links
- ✅ Redirects non-admin users
- ✅ Handles loading state
- ✅ Displays error messages

**ReportModerationPage.test.tsx:**
- ✅ Renders page title
- ✅ Displays pending reports list
- ✅ Shows report details (title, category, office, amount)
- ✅ Fetches reports on mount
- ✅ Opens confirmation dialog on approve
- ✅ Calls API with correct parameters
- ✅ Shows success notifications
- ✅ Handles rejection workflow
- ✅ Implements pagination
- ✅ Handles API errors
- ✅ Redirects non-moderators

### E2E Tests (Cypress)

**Admin Report Moderation:**
- ✅ Complete moderation workflow
- ✅ Approve report with confirmation
- ✅ Reject report with reason
- ✅ Paginate through reports
- ✅ Filter reports by status

**Admin Dashboard:**
- ✅ Display and navigate dashboard
- ✅ Navigate to reports queue
- ✅ Navigate to verifications queue
- ✅ Navigate to evidence queue

**User Management:**
- ✅ Promote citizen to moderator
- ✅ Filter users by role
- ✅ Prevent self-demotion

**Access Control:**
- ✅ Deny citizen access to admin pages
- ✅ Deny moderator access to user management
- ✅ Allow admin full access

---

## TEST DATA & MOCKS

### Backend Mocks
```typescript
// Mock User model
User.findById.mockResolvedValue({
  _id: 'user-123',
  email: 'admin@example.com',
  role: 'admin',
  save: jest.fn()
})

// Mock Report model
Report.find.mockReturnValue({
  sort: jest.fn().mockReturnValue({
    skip: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([...reports])
    })
  })
})
```

### Frontend Mock Context
```typescript
const mockAuthContext = {
  isLoggedIn: true,
  user: {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin'
  },
  token: 'mock-jwt-token'
}
```

### API Response Mocks
```typescript
const mockDashboardData = {
  reports: { total: 42, pending: 5 },
  verifications: { total: 18, pending: 3 },
  evidence: { total: 67, pending: 8 },
  users: { total: 234, admins: 2, moderators: 5 }
}
```

---

## RUNNING ALL TESTS

### Combined Test Suite

```bash
# 1. Run backend tests
cd africajustice-backend
npm run test

# 2. Return to root and run frontend tests
cd ..
npm run test

# 3. Start both servers in background, then run E2E
npm run dev &
cd africajustice-backend && npm run dev &
npm run e2e:run

# 4. View coverage reports
# Backend: africajustice-backend/coverage/lcov-report/index.html
# Frontend: coverage/lcov-report/index.html
```

### Continuous Integration (GitHub Actions)
Ready to integrate into CI/CD pipeline (Phase 4.6):
```yaml
- name: Run Backend Tests
  run: cd africajustice-backend && npm run test

- name: Run Frontend Tests
  run: npm run test

- name: Run E2E Tests
  run: npm run e2e:run
```

---

## TEST CONFIGURATION FILES

### Frontend vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // Use global test functions
    environment: 'jsdom',    // Browser-like DOM
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      lines: 80,            // 80% line coverage required
      functions: 80,
      branches: 80,
    }
  }
})
```

### Backend jest.config.ts (Already Configured)
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ]
}
```

### Cypress cypress.config.ts
```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
})
```

---

## BEST PRACTICES

### Unit Test Quality
1. **One assertion per test** – Focus on single behavior
2. **Descriptive names** – Test name tells you what it tests
3. **AAA Pattern** – Arrange, Act, Assert
4. **Mock external dependencies** – Isolate code under test
5. **Test error cases** – Not just happy path

### Component Test Quality
1. **Test user behavior** – Not implementation details
2. **Query by role/label** – Not data-testid (when possible)
3. **Async operations** – Use waitFor for API calls
4. **User interactions** – Use userEvent, not fireEvent
5. **Context providers** – Wrap components properly

### E2E Test Quality
1. **Page objects pattern** – Reusable components
2. **Custom commands** – DRY up common actions
3. **Test realistic workflows** – Full user journeys
4. **Clear assertions** – Know what you're checking
5. **Independent tests** – No test interdependencies

---

## TROUBLESHOOTING

### Backend Tests Failing

**Problem:** `Cannot find module '@/...'`  
**Solution:** Module mapper not configured  
```json
{
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

**Problem:** Tests hanging  
**Solution:** Close database connection in afterAll  
```typescript
afterAll(async () => {
  await mongoose.connection.close()
})
```

### Frontend Tests Failing

**Problem:** `localStorage is not defined`  
**Solution:** vitest.setup.ts should mock localStorage (already done)

**Problem:** `Cannot find module react-router`  
**Solution:** Wrap components in `<BrowserRouter>` for tests

**Problem:** `act() not wrapped`  
**Solution:** Use `waitFor` for async operations

### E2E Tests Failing

**Problem:** `Cypress is not installed`  
**Solution:** `npm install cypress --save-dev`

**Problem:** Elements not found  
**Solution:** Increase viewport, check selectors exist

**Problem:** Login fails  
**Solution:** Ensure test user exists in database

---

## FILE STRUCTURE

```
├── Frontend Tests
│   ├── vitest.setup.ts                     ✅ Global setup
│   ├── vite.config.ts                      ✅ Vitest config
│   ├── src/pages/
│   │   ├── AdminDashboard.test.tsx         ✅ Dashboard tests
│   │   └── ReportModerationPage.test.tsx   ✅ Moderation tests
│
├── Backend Tests
│   ├── jest.config.ts                      ✅ Jest config (existing)
│   ├── africajustice-backend/tests/
│   │   ├── adminController.test.ts         ✅ Admin tests (NEW)
│   │   ├── auth.test.js                    ✅ Auth tests (existing)
│   │   ├── reports.test.js                 ✅ Reports tests (existing)
│   │   └── verify.test.js                  ✅ Verification tests (existing)
│
├── E2E Tests
│   ├── cypress.config.ts                   ✅ Cypress config
│   ├── cypress/
│   │   ├── support/
│   │   │   ├── e2e.ts                      ✅ Setup
│   │   │   └── commands.ts                 ✅ Custom commands
│   │   └── e2e/
│   │       └── admin.cy.ts                 ✅ Admin tests
```

---

## NEXT STEPS

**Phase 4.3:** Backend Integration Tests
- More complex scenarios (multiple operations)
- Database integration tests
- API endpoint integration tests

**Phase 4.4:** Frontend E2E Coverage
- More component test scenarios
- Form validation tests
- Error recovery tests

**Phase 4.6:** CI/CD Integration
- GitHub Actions workflow
- Automated test runs on commits
- Coverage reporting
- Test artifacts storage

---

## SUMMARY

✅ **Complete testing infrastructure implemented:**
- 3-layer testing (unit → component → E2E)
- Jest backend tests with model mocks
- Vitest frontend tests with React Testing Library
- Cypress E2E tests with custom commands
- 20+ test cases across all layers
- Configuration files for all test frameworks
- Mock data and test utilities
- Coverage measurement setup
- TypeScript support throughout

**Ready to run:**
```bash
npm run test              # Frontend tests
cd africajustice-backend && npm run test  # Backend tests
npm run e2e              # E2E tests
```

**Cost:** Zero new dependencies (all already installed)

---

**Testing Infrastructure: COMPLETE ✅**

**Phase 4.2 Status: Ready for immediate use**

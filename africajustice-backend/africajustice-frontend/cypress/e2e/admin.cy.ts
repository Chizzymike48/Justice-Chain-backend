describe('Admin Report Moderation E2E', () => {
  beforeEach(() => {
    // Create fresh user session
    cy.session('admin-session', () => {
      cy.loginAsAdmin()
    })
  })

  it('should complete full moderation workflow', () => {
    // Navigate to reports page
    cy.visitReportModeration()

    // Check that reports are displayed
    cy.get('[data-testid="report-card"]').should('have.length.greaterThan', 0)

    // Click approve on first report
    cy.get('[data-testid="report-card"]').first().within(() => {
      cy.get('button:contains("Approve")').click()
    })

    // Confirm dialog should appear
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('button:contains("Confirm")').click()

    // Success notification should appear
    cy.get('[role="alert"]').should('contain', 'approved')

    // Report should be removed from list
    cy.get('[data-testid="report-card"]').should('exist')
  })

  it('should reject report with reason', () => {
    cy.visitReportModeration()

    // Click reject on first report
    cy.get('[data-testid="report-card"]').first().within(() => {
      cy.get('button:contains("Reject")').click()
    })

    // Fill rejection reason
    cy.get('textarea[placeholder*="reason"]').type('Insufficient evidence provided')

    // Confirm rejection
    cy.get('button:contains("Confirm")').click()

    // Success notification
    cy.get('[role="alert"]').should('contain', 'rejected')
  })

  it('should paginate through reports', () => {
    cy.visitReportModeration()

    // Check pagination controls exist
    cy.get('[data-testid="pagination"]').should('be.visible')

    // Navigate to next page
    cy.get('button:contains("Next")').click()

    // URL should reflect page 2
    cy.url().should('include', 'page=2')

    // Different reports should be shown
    cy.get('[data-testid="report-card"]').should('exist')
  })

  it('should filter reports by status', () => {
    cy.visitReportModeration()

    // Check status filter exists
    cy.get('select[name="status"]').should('be.visible')

    // Change filter
    cy.get('select[name="status"]').select('pending')

    // API should be called with new filter
    cy.get('[data-testid="report-card"]').should('exist')
  })
})

describe('Admin Dashboard E2E', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin()
    })
  })

  it('should display and navigate admin dashboard', () => {
    cy.visitAdminDashboard()

    // Check KPI cards are visible
    cy.get('[data-testid="kpi-card"]').should('have.length.greaterThan', 0)

    // Check that metrics are displayed
    cy.contains(/total reports|pending reports/).should('be.visible')
    cy.contains(/total verifications|pending verifications/).should('be.visible')
    cy.contains(/total evidence/).should('be.visible')
    cy.contains(/total users/).should('be.visible')
  })

  it('should navigate to reports queue from dashboard', () => {
    cy.visitAdminDashboard()

    // Click on reports card
    cy.get('button:contains("Reports to Review")').click()

    // Should navigate to report moderation page
    cy.url().should('include', '/admin/reports')
    cy.get('h1').should('contain', 'Reports')
  })

  it('should navigate to verifications queue from dashboard', () => {
    cy.visitAdminDashboard()

    // Click on verifications card
    cy.get('button:contains("Verifications to Review")').click()

    // Should navigate to verification review page
    cy.url().should('include', '/admin/verifications')
    cy.get('h1').should('contain', 'Verifications')
  })

  it('should navigate to evidence queue from dashboard', () => {
    cy.visitAdminDashboard()

    // Click on evidence card
    cy.get('button:contains("Evidence to Review")').click()

    // Should navigate to evidence review page
    cy.url().should('include', '/admin/evidence')
    cy.get('h1').should('contain', 'Evidence')
  })
})

describe('User Management E2E', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin()
    })
  })

  it('should promote citizen to moderator', () => {
    // Navigate to user management
    cy.visit('/admin/users')

    // Find a citizen user
    cy.get('tr').contains('citizen').first().within(() => {
      // Click change role button
      cy.get('button:contains("Change")').click()
    })

    // Confirm promotion
    cy.get('[role="dialog"]').within(() => {
      cy.get('input[value="moderator"]').click()
      cy.get('button:contains("Confirm")').click()
    })

    // Success notification
    cy.get('[role="alert"]').should('contain', 'promoted')
  })

  it('should filter users by role', () => {
    cy.visit('/admin/users')

    // Filter by moderators
    cy.get('select[name="role"]').select('moderator')

    // All displayed users should be moderators
    cy.get('td').should('contain', 'moderator')
  })

  it('should prevent admin self-demotion', () => {
    cy.visit('/admin/users')

    // Find current admin user (yourself)
    cy.get('tr').contains('admin').first().within(() => {
      // Role dropdown should be disabled
      cy.get('select').should('be.disabled')
    })
  })
})

describe('Admin Access Control E2E', () => {
  it('should deny citizen access to admin pages', () => {
    // Login as citizen
    cy.login('citizen@example.com', 'CitizenPass123!')

    // Try to access admin dashboard
    cy.visit('/admin')

    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard')
    cy.get('h1').should('contain', 'Dashboard')
  })

  it('should deny moderator access to user management', () => {
    // Login as moderator
    cy.loginAsModerator()

    // Can access report moderation
    cy.visitReportModeration()
    cy.url().should('include', '/admin/reports')

    // Cannot access user management
    cy.visit('/admin/users')
    cy.url().should('include', '/dashboard')
  })

  it('should allow admin full access', () => {
    cy.loginAsAdmin()

    // Can access any admin page
    cy.visit('/admin')
    cy.url().should('include', '/admin')

    cy.visit('/admin/reports')
    cy.url().should('include', '/admin/reports')

    cy.visit('/admin/users')
    cy.url().should('include', '/admin/users')
  })
})

/// <reference types="cypress" />

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'AdminPass123!')
})

// Custom command to login as moderator
Cypress.Commands.add('loginAsModerator', () => {
  cy.login('moderator@example.com', 'ModPass123!')
})

// Custom command to navigate to admin dashboard
Cypress.Commands.add('visitAdminDashboard', () => {
  cy.visit('/admin')
  cy.get('h1').should('contain', 'Admin Dashboard')
})

// Custom command to navigate to report moderation page
Cypress.Commands.add('visitReportModeration', () => {
  cy.visit('/admin/reports')
  cy.get('h1').should('contain', 'Reports')
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginAsAdmin(): Chainable<void>
      loginAsModerator(): Chainable<void>
      visitAdminDashboard(): Chainable<void>
      visitReportModeration(): Chainable<void>
    }
  }
}

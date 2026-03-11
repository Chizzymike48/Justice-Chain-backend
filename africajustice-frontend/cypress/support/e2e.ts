// Cypress support file for E2E tests
import './commands'

// Increase timeout for API calls
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false
})

// Global test configuration
beforeEach(() => {
  // Clear localStorage before each test
  cy.window().then((win) => {
    win.localStorage.clear()
  })
})

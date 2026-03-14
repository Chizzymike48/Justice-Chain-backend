export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.ts?(x)',
    '!src/**/*.d.ts',
    '!src/**/index.ts?(x)',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [],
}

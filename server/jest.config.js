/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/integration/**/*.test.ts",
    "**/__tests__/contract/**/*.test.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Allow importing relative modules in test files
  modulePaths: ["<rootDir>/src"],
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 47,
      functions: 62,
      lines: 69,
      statements: 65,
    },
  },
  // Timeout for integration tests
  testTimeout: 15000,
};

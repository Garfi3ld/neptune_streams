// jest.config.js
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { diagnostics: false }],
  },
  setupFilesAfterEnv: ['./jest.setup.ts'],
  // modulePathIgnorePatterns: ['<rootDir>/lib', '<rootDir>/test/integration'],
};
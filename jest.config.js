/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
    '^drizzle-orm/expo-sqlite$': '<rootDir>/__mocks__/drizzle-orm/expo-sqlite.ts',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          resolveJsonModule: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/core/**/*.ts',
    '!src/core/**/__tests__/**',
  ],
};


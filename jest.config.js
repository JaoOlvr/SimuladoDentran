/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.ts',
    '^drizzle-orm/expo-sqlite$': '<rootDir>/__mocks__/drizzle-orm/expo-sqlite.ts',
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.ts',
    '^expo-print$': '<rootDir>/__mocks__/expo-print.ts',
    '^expo-sharing$': '<rootDir>/__mocks__/expo-sharing.ts',
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
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


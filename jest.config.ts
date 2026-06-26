import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transformIgnorePatterns: ['node_modules/(?!(jose)/)'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
    }],
  },
};

export default config;

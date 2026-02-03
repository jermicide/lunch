module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/coverage/**',
        '!**/*.test.js',
        '!**/*.spec.js',
        '!jest.config.js',
        '!.eslintrc.js'
    ],
    coverageThreshold: {
        global: {
            branches: 45,
            functions: 60,
            lines: 50,
            statements: 50
        }
    },
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    setupFilesAfterEnv: [],
    testTimeout: 10000,
    verbose: true
};

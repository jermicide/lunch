module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        '**/*.js',
        '!**/node_modules/**',
        '!**/dist/**',
        '!jest.config.js',
        '!.eslintrc.js'
    ],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
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

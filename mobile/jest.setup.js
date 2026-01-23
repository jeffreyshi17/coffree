// Jest setup file
// Mock any modules that cause issues in the test environment

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

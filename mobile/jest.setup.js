// Jest setup file
// Mock any modules that cause issues in the test environment

// Mock expo-modules-core to prevent web module loading issues
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(),
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
  Subscription: jest.fn(),
  UnavailabilityError: class UnavailabilityError extends Error {},
}));

// Mock AsyncStorage for tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

import 'jest-preset-angular/setup-jest';

import '@testing-library/jest-dom';
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'Capacitor', {
  value: {
    isNativePlatform: () => false,
    getPlatform: () => 'web'
  }
});

Object.defineProperty(window, 'cordova', {
  value: undefined
});

Object.defineProperty(window, 'ResizeObserver', {
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
  writable: true,
});

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import '@testing-library/jest-dom';

setupZoneTestEnv();

const mockCustomElement = class extends HTMLElement {
  constructor() {
    super();
  }
};

Object.defineProperty(window, 'customElements', {
  value: {
    define: jest.fn(),
    get: jest.fn(),
    whenDefined: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

const ionicComponents = [
  'ion-app', 'ion-content', 'ion-header', 'ion-toolbar', 'ion-title',
  'ion-button', 'ion-input', 'ion-item', 'ion-label', 'ion-list',
  'ion-toggle', 'ion-toast', 'ion-alert', 'ion-modal', 'ion-popover'
];

ionicComponents.forEach(tagName => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, mockCustomElement);
  }
});
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

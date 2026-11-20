import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import { configure } from '@testing-library/react';

// findBy*/waitFor wait up to 3 s (default 1 s): with 50+ files running in
// parallel, a page's mocked data can take over a second to render.
configure({ asyncUtilTimeout: 3000 });

// jsdom does not implement ResizeObserver; cmdk uses it internally.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement elementFromPoint; input-otp probes it to detect
// password-manager badges.
document.elementFromPoint ??= () => null;

// jsdom does not implement scrollIntoView; cmdk uses it internally.
window.HTMLElement.prototype.scrollIntoView = () => {};

// Node 25 ships a partial native localStorage that lacks setItem/clear/etc.
// Patch the global so test code that calls localStorage.clear() works in jsdom.
// Factory-scoped so each install gets its own backing store, and a global
// beforeEach clears between tests so state can't leak across files even if
// a file forgets its own setup.
function installLocalStorageShim(): void {
  const store: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    },
  });
}

if (typeof window !== 'undefined' && typeof window.localStorage.clear !== 'function') {
  installLocalStorageShim();
}

// JSDOM does not implement the Pointer Capture API (hasPointerCapture /
// setPointerCapture / releasePointerCapture). Radix UI primitives call these
// methods inside onPointerDown handlers, which throws a TypeError and prevents
// dropdowns from opening during tests. Stub them as no-ops so userEvent.click
// on comboboxes works correctly in unit tests.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.hasPointerCapture ??= () => false;
  window.HTMLElement.prototype.setPointerCapture ??= () => {};
  window.HTMLElement.prototype.releasePointerCapture ??= () => {};
}

beforeEach(() => {
  window.localStorage.clear();
});

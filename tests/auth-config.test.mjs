import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLocalAuth } from '../app/lib/firebase-auth.ts';

test('auth configuration fails closed outside explicit local emulator mode', () => {
  const originalMode = process.env.NEXT_PUBLIC_AUTH_MODE;
  const originalWindow = globalThis.window;
  try {
    delete process.env.NEXT_PUBLIC_AUTH_MODE;
    globalThis.window = { location: { hostname: 'localhost' } };
    assert.throws(getLocalAuth, /disabled/);
    process.env.NEXT_PUBLIC_AUTH_MODE = 'emulator';
    globalThis.window = { location: { hostname: 'example.com' } };
    assert.throws(getLocalAuth, /disabled/);
    delete globalThis.window;
    assert.throws(getLocalAuth, /disabled/);
  } finally {
    if (originalMode === undefined) delete process.env.NEXT_PUBLIC_AUTH_MODE;
    else process.env.NEXT_PUBLIC_AUTH_MODE = originalMode;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

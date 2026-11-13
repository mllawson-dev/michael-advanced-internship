import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getConfiguredAuth, getFirebaseOptions } from '../app/lib/firebase-auth.ts';

test('auth configuration fails closed outside explicit local emulator mode', () => {
  const originalMode = process.env.NEXT_PUBLIC_AUTH_MODE;
  const originalWindow = globalThis.window;
  try {
    delete process.env.NEXT_PUBLIC_AUTH_MODE;
    globalThis.window = { location: { hostname: 'localhost' } };
    assert.throws(getConfiguredAuth, /disabled/);
    process.env.NEXT_PUBLIC_AUTH_MODE = 'emulator';
    globalThis.window = { location: { hostname: 'example.com' } };
    assert.throws(getConfiguredAuth, /disabled/);
    delete globalThis.window;
    assert.throws(getConfiguredAuth, /browser-only/);
  } finally {
    if (originalMode === undefined) delete process.env.NEXT_PUBLIC_AUTH_MODE;
    else process.env.NEXT_PUBLIC_AUTH_MODE = originalMode;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});


test('unknown and incomplete live config fail closed; emulator stays on demo project', () => {
  assert.throws(() => getFirebaseOptions('unknown'), /disabled/);
  const original = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  try {
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    assert.throws(() => getFirebaseOptions('firebase'), /incomplete/);
    assert.equal(getFirebaseOptions('emulator').projectId, 'demo-summarist');
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_APP_ID = original;
  }
});

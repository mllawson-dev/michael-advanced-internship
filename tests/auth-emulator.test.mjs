import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';

test('local Firebase registration, rejected credentials, login, guest and logout', async () => {
  const app = initializeApp({ projectId: 'demo-summarist', apiKey: 'demo-summarist-key' }, `test-${Date.now()}`);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  try {
    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = 'local-test-password';
    await assert.rejects(createUserWithEmailAndPassword(auth, email, '123'), { code: 'auth/weak-password' });
    const created = await createUserWithEmailAndPassword(auth, email, password);
    assert.equal(created.user.email, email);
    assert.equal(created.user.isAnonymous, false);
    await assert.rejects(createUserWithEmailAndPassword(auth, email, password), { code: 'auth/email-already-in-use' });
    await signOut(auth);
    assert.equal(auth.currentUser, null);
    await assert.rejects(signInWithEmailAndPassword(auth, email, 'wrong-password'));
    assert.equal(auth.currentUser, null);
    const signedIn = await signInWithEmailAndPassword(auth, email, password);
    assert.equal(signedIn.user.uid, created.user.uid);
    await signOut(auth);
    const guest = await signInAnonymously(auth);
    assert.equal(guest.user.isAnonymous, true);
    await signOut(auth);
    assert.equal(auth.currentUser, null);
  } finally {
    await deleteApp(app);
  }
});

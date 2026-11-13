import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

export function getFirebaseOptions(mode = process.env.NEXT_PUBLIC_AUTH_MODE): FirebaseOptions {
  if (mode === "emulator") {
    return { apiKey: "demo-summarist-key", projectId: "demo-summarist", authDomain: "demo-summarist.firebaseapp.com" };
  }
  // Fail closed: missing or unknown modes must never silently connect to live Firebase.
  if (mode !== "firebase") throw new Error("Authentication is disabled.");
  const options = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };
  if (!options.apiKey || !options.authDomain || !options.projectId || !options.appId || options.projectId.startsWith("demo-")) {
    throw new Error("Firebase authentication configuration is incomplete.");
  }
  return options;
}

export function getConfiguredAuth(): Auth {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE;
  if (typeof window === "undefined") throw new Error("Authentication is browser-only.");
  if (mode === "emulator" && !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
    throw new Error("Emulator authentication is disabled on remote hosts.");
  }
  const options = getFirebaseOptions(mode);
  // Distinct app names keep live and emulator persistence isolated, including during development.
  const name = mode === "emulator" ? "summarist-local-auth" : `summarist-firebase-${options.projectId}`;
  const app = getApps().find((candidate) => candidate.name === name) ?? initializeApp(options, name);
  const auth = getAuth(app);
  if (mode === "emulator") {
    if (!auth.emulatorConfig) connectAuthEmulator(auth, "http://127.0.0.1:9099");
    else if (auth.emulatorConfig.host !== "127.0.0.1" || auth.emulatorConfig.port !== 9099 || auth.emulatorConfig.protocol !== "http") {
      throw new Error("Unexpected emulator configuration.");
    }
  } else if (auth.emulatorConfig) {
    throw new Error("Live authentication cannot use an emulator.");
  }
  return auth;
}

import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

let localAuth: Auth | undefined;

export function getLocalAuth(): Auth {
  // Fail closed: emulator configuration cannot initialize real Firebase or run remotely.
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "emulator" ||
      typeof window === "undefined" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
    throw new Error("Local authentication is disabled. Start the app with npm run dev:local.");
  }
  if (localAuth) return localAuth;
  const name = "summarist-local-auth";
  const app = getApps().find((candidate) => candidate.name === name) ?? initializeApp({
    apiKey: "demo-summarist-key",
    projectId: "demo-summarist",
    authDomain: "demo-summarist.firebaseapp.com",
  }, name);
  const auth = getAuth(app);
  if (!auth.emulatorConfig) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
  } else if (auth.emulatorConfig.host !== "127.0.0.1" || auth.emulatorConfig.port !== 9099 || auth.emulatorConfig.protocol !== "http") {
    throw new Error("Unexpected emulator configuration.");
  }
  localAuth = auth;
  return auth;
}

"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { authReturnPath } from "../lib/book-access";
import { getConfiguredAuth } from "../lib/firebase-auth";

type AuthState = {
  open: (returnTo?: string) => void;
  user: User | null;
  loading: boolean;
  pending: boolean;
  error: string;
  enabled: boolean;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

function errorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  switch (code) {
    case "auth/email-already-in-use": return "An account already exists for this email. Try logging in.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/weak-password": return "Use a password with at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Email or password is incorrect.";
    case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    case "auth/operation-not-allowed": return "This sign-in method is not enabled in Firebase. Enable Email/Password and Anonymous in Authentication settings.";
    case "auth/configuration-not-found": return "Firebase Authentication is not set up yet. Open Authentication in the Firebase console and enable the sign-in methods.";
    case "auth/unauthorized-domain": return "This website domain is not authorized in Firebase Authentication settings.";
    case "auth/invalid-api-key": return "Firebase configuration could not be verified. Check the web app settings.";
    default: return process.env.NEXT_PUBLIC_AUTH_MODE === "emulator"
      ? "Local authentication is unavailable. Check that npm run emulators is running and try again."
      : "Authentication is unavailable. Check your connection and try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const returnPath = useRef("/for-you");
  const previousOverflow = useRef("");
  const busy = useRef(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const enabled = ["emulator", "firebase"].includes(process.env.NEXT_PUBLIC_AUTH_MODE ?? "");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    // Defer initialization to the browser; no server session or protected data exists yet.
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        unsubscribe = onAuthStateChanged(getConfiguredAuth(), (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        }, () => {
          setUser(null);
          setError("Unable to restore authentication. Please reload and try again.");
          setLoading(false);
        });
      } catch {
        if (enabled) setError("Authentication configuration is incomplete. Check the Firebase environment settings and restart the app.");
        setLoading(false);
      }
    });
    return () => { active = false; unsubscribe?.(); };
  }, [enabled]);

  function open(returnTo?: string) {
    if (!dialog.current || dialog.current.open) return;
    // Only allow known local book routes; never redirect to an arbitrary supplied URL.
    returnPath.current = authReturnPath(returnTo);
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMode("login");
    setMessage("");
    dialog.current.showModal();
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  function finishClose() {
    document.body.style.overflow = previousOverflow.current;
    dialog.current?.querySelector("form")?.reset();
    setMessage("");
    trigger.current?.focus();
  }

  async function authenticate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy.current || loading) return;
    // Native validation runs before submit; configuration guard runs before any SDK write.
    const data = event ? new FormData(event.currentTarget) : null;
    const email = String(data?.get("email") ?? "").trim();
    const password = String(data?.get("password") ?? "");
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      const auth = getConfiguredAuth();
      if (!event) await signInAnonymously(auth);
      else if (mode === "register") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      dialog.current?.close();
      router.push(returnPath.current);
    } catch (failure) {
      setMessage(errorMessage(failure));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function logout() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await signOut(getConfiguredAuth());
      router.push("/");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <AuthContext value={{ open, user, loading, pending, error, enabled, logout }}>
      {children}
      {error && <p className="auth-global-error" role="alert">{error}</p>}
      <dialog ref={dialog} className="auth-modal" aria-labelledby="auth-title" aria-describedby="auth-description" onClose={finishClose} onCancel={(event) => { if (busy.current) event.preventDefault(); }}>
        <button className="auth-close" type="button" aria-label="Close authentication" disabled={pending} onClick={() => dialog.current?.close()}>×</button>
        <h2 id="auth-title">{mode === "login" ? "Log in to Summarist" : "Create your account"}</h2>
        <p id="auth-description">{process.env.NEXT_PUBLIC_AUTH_MODE === "emulator" ? "Local test accounts only. Use a test email and password; these accounts do not connect to live Firebase." : enabled ? "Sign in to your Summarist account, create an account, or continue as a guest." : "Authentication is not configured yet."}</p>
        <form key={mode} onSubmit={authenticate} aria-busy={pending}>
          <fieldset className="auth-fields" disabled={pending || loading || !enabled}>
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required autoFocus />
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 6 : undefined} required />
            {mode === "register" && <p className="auth-hint">Use at least 6 characters.</p>}
            <button className="button" type="submit">{pending ? "Please wait…" : mode === "login" ? "Login" : "Register"}</button>
          </fieldset>
        </form>
        <button className="auth-guest" type="button" disabled={pending || loading || !enabled} onClick={() => void authenticate()}>Login as a guest</button>
        <p className="auth-status" role="status">{loading ? "Checking session…" : message}</p>
        <button className="auth-switch" type="button" disabled={pending} onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "Don’t have an account? Register" : "Already have an account? Login"}</button>
      </dialog>
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}

export function LoginButton({ className }: { className: string }) {
  const { open, user, loading, pending, logout } = useAuth();
  return <button className={className} type="button" onClick={user ? () => void logout() : () => open()} disabled={loading || pending} aria-haspopup={user ? undefined : "dialog"}>{loading ? "Checking session…" : user ? "Logout" : "Login"}</button>;
}

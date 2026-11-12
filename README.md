# Summarist virtual internship

## Run locally

Use Node.js 24 LTS (the project pin is in `.nvmrc`) and npm:

```sh
nvm use
npm ci
npm run dev
```

If you do not use nvm, select Node.js 24 with your installed version manager.
Open http://localhost:3000. The root route displays the responsive static homepage: navigation, hero,
features, benefits and statistics, testimonials, growth metrics, and footer.
No environment configuration is required to run this stage.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build`.
Type checking generates Next.js route types before running TypeScript.

## Structure

- `app/`: Next.js App Router layout, homepage, and plain CSS.
- `public/assets/`: byte-for-byte copies of the supplied image assets.
- `index.html`, `style.css`, and `assets/`: unchanged starter references.
- `.env.example`: future Firebase browser configuration and Stripe server-only
  test-mode variables; copy to `.env.local` when those integrations are built.

Next.js, React, and the Firebase client SDK are runtime dependencies. TypeScript, ESLint, and
Next.js lint rules provide development checks. Versions are pinned in
`package.json` and resolved in `package-lock.json`.

## Next stages

The static homepage is implemented from the supplied starter references. Roboto
is self-hosted by `next/font/google`; builds require network access to download
the font from Google. Homepage Login buttons open a shared Login/Register/Guest modal. Local emulator
authentication supports email/password registration, login, anonymous guest login,
session restoration, logout, and a redirect to `/for-you`. Navigation/footer items
without implemented destinations are non-interactive. Testimonials and numerical
claims are supplied internship reference content, not live analytics.

Live Firebase authentication, book APIs, the app sidebar, reader,
audio player, search, test checkout, and settings follow in the agreed plan.
Optional features come after required features. Subscription tier naming is
pending confirmation. No live Firebase or Stripe integration is active yet.

## Local authentication without a Firebase account

Use Node 24 (`nvm use`) and install dependencies with `npm ci`. No Google login,
Firebase project, billing, or production credentials are required for this mode.

In terminal 1:

```sh
npm run emulators
```

In terminal 2:

```sh
npm run dev:local
```

Open http://localhost:3000 (or the port printed by Next). Emulator UI is at
http://127.0.0.1:4000. Use test credentials only. Register with email/password,
log out and log back in, or choose Guest login. Successful sign-in goes to
`/for-you`; this stage displays account status, with book content coming later.
Firebase's SDK restores the local session on reload. Guest accounts use native
anonymous authentication. No application database or protected server resource
is introduced in this stage; client auth state is not a server authorization guard.

The emulator binds only to 127.0.0.1:9099 and uses project `demo-summarist`.
Emulator accounts are temporary and reset when the emulator restarts. They are
not production accounts and will not migrate to live Firebase. If stale sessions
remain after an emulator reset, log out and sign in again.

`npm run dev` and `npm run build` keep auth disabled unless
`NEXT_PUBLIC_AUTH_MODE=emulator` is explicitly supplied. Emulator mode also
refuses non-loopback browser hosts and never falls back to a live Firebase API.
To test an optimized local auth build, use `npm run build:local` then `npm start`.
These commands do not enable production authentication. Live Firebase setup,
production access rules, and production authorization remain a separate step.

Local auth regression checks (start the emulator before the second command):

```sh
npm run test:auth-config
npm run test:auth-emulator
```

The gRPC 1.x override in package.json resolves an advisory in Firebase's bundled
Firestore dependency; this app currently imports only Firebase App and Auth.

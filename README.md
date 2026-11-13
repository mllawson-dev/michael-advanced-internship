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

`npm start` serves the production build at http://localhost:3001 after
`npm run build`. Development uses http://localhost:3000.
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

Book APIs, the app sidebar, reader,
audio player, search, test checkout, and settings follow in the agreed plan.
Optional features come after required features. Subscription tier naming is
pending confirmation. Firebase Authentication supports explicit live or emulator mode. Stripe is not connected.

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

`npm run dev` and `npm run build` use the mode set in `.env.local`;
auth remains disabled when `NEXT_PUBLIC_AUTH_MODE` is unset or unknown. Emulator mode also
refuses non-loopback browser hosts and never falls back to a live Firebase API.
To test an optimized local auth build, use `npm run build:local` then `npm start`.
The emulator commands override live mode and never use live configuration.
Server authorization and database access rules must be added before protected data is introduced.

Local auth regression checks (start the emulator before the second command):

```sh
npm run test:auth-config
npm run test:auth-emulator
```

The gRPC 1.x override in package.json resolves an advisory in Firebase's bundled
Firestore dependency; this app currently imports only Firebase App and Auth.


## Live Firebase Authentication

Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_AUTH_MODE=firebase`, and fill
in the Firebase Web app configuration for your project. `.env.local` is ignored
by git. Restart Next after changing these values; public environment variables
are embedded at build time. Set the same variables in the deployment environment
before building a hosted release. Analytics is not initialized.

In Firebase Console → Authentication → Sign-in method, enable **Email/Password**
and **Anonymous** (for Guest login). Under Authentication → Settings → Authorized
domains, add your local/hosted hostname as needed. Local emulator accounts do not
transfer to the live project. Live tests create actual Firebase Auth users.

`npm run dev` uses live mode when configured; `npm run dev:local` always uses the
loopback-only demo emulator. Different Firebase app names isolate their sessions.
Missing configuration, unknown mode, or an emulator/live mismatch fails closed.
There is no automatic fallback from one mode to the other.

## Stage 4 app layout

The `(app)` route group shares a desktop sidebar, header, content area, and native
mobile navigation dialog across `/for-you`, `/library`, and `/settings`. It does
not wrap the homepage; future sales pages should stay outside this group too.
Navigation reflects the active route, closes after route changes or Escape, and
returns focus after dismissal. Mobile Login closes navigation before opening
the shared authentication dialog. The existing auth provider remains at the root.

Book search is visibly disabled until its later functional stage. Library and
Settings are labelled route scaffolds, with no saved books, subscription records,
or account-setting actions yet. `/for-you` retains the Stage 3 account-status
view until Stage 5's book sections are implemented. No new dependency is required.


## Avoid stale local preview servers

Use `npm run dev` for day-to-day work on port 3000. For a production preview,
stop any running `npm start` process, run `npm run build`, then run `npm start`
(on port 3001). Always restart the production preview after rebuilding, switching
branches, or moving routes: a running production server retains the route
manifest from its startup build. Separate ports also prevent `localhost` and
`127.0.0.1` from accidentally reaching different servers on IPv6 and IPv4.
Next.js already isolates development output in `.next/dev`; no custom cache
or authentication workaround is needed.

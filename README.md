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
or account-setting actions yet. `/for-you` now begins Stage 5 with the API-backed Selected Book section. No new dependency is required.


## Avoid stale local preview servers

Use `npm run dev` for day-to-day work on port 3000. For a production preview,
stop any running `npm start` process, run `npm run build`, then run `npm start`
(on port 3001). Always restart the production preview after rebuilding, switching
branches, or moving routes: a running production server retains the route
manifest from its startup build. Separate ports also prevent `localhost` and
`127.0.0.1` from accidentally reaching different servers on IPv6 and IPv4.
Next.js already isolates development output in `.next/dev`; no custom cache
or authentication workaround is needed.


## Stage 5: Selected Book

`/for-you` fetches the public selected-book catalog on the server with a 10-second
request timeout and no persistent cache. The response is validated and reduced
to the fields the card needs. The API currently returns an array; the loader also
accepts the single-object shape described by the brief. Loading uses a Suspense
skeleton; empty and error responses have a retry control, and broken covers have
a text fallback. Only the supplied Firebase Storage image bucket is allowed.

The card is visible without login, matching the reference public catalog. No
private user data or subscription entitlement is read here. Book-detail navigation
and the actual audio duration remain deferred until their respective later stages.
Recommended and Suggested Books are implemented in the sections below.

Run `npm run test:books` for parsing, media validation, and upstream-state checks.


### Recommended Books

The Recommended For You row reads `getBooks?status=recommended` independently
from Selected Book, with its own Suspense skeleton and retry/empty/error states.
It preserves API order and validates unique IDs, rating range, boolean premium
flags, and the same restricted cover source. Cards show cover, title, author,
subtitle, rating, and a Premium pill only when `subscriptionRequired` is true.
The horizontal row supports touch scrolling and keyboard arrow scrolling when
focused; it enters the tab order only when its content overflows.

Cover failures use the same reusable fallback as Selected Book. Card navigation
and durations remain deferred with the book-detail and audio-player stages.
`npm run test:books` covers selected, recommended, and suggested response states.


### Suggested Books

Suggested Books reads `getBooks?status=suggested` independently and reuses the
shared `book-list.tsx` renderer and `book-cover.tsx` fallback. Each list has its
own loading, empty, error/retry states, scroll position, and section-prefixed
card IDs. API order, rating validation, premium flags, and media restrictions
are preserved. Suggested covers are lazy-loaded. No durations or book-detail
navigation are introduced in this step.

## Stage 6: Book Details

`/book/[id]` uses the existing app shell and a bounded, uncached public book API
loader. Route IDs are validated before fetching; response IDs, cover origins,
ratings, counts, descriptions, tags, and premium flags fail closed on malformed
data. Missing books use the route's not-found view; transient failures offer retry.
The client receives display fields and a validated audio URL for duration metadata, excluding summaries.
For You cards link to details with prefetch disabled to avoid fetching an entire
catalog's details in advance. The layout includes cover, title, author, subtitle,
rating count, key ideas, format, topics, book description, and author biography.
Read/Listen authentication and free/premium destination routing are implemented;
duration, player implementation, checkout, and optional library persistence remain deferred.
`npm run test:books` covers both catalog and detail loaders.

Book Details now provides Read/Listen actions. Signed-out actions open the shared
modal; successful authentication returns to the same validated local book route.
Session restoration disables actions. Authentication/configuration errors block
progress, and a signed-in user is never assumed to have a premium subscription.
Signed-in actions route free books to `/player/[id]` and premium books to
`/choose-plan`. Those routes provide explicit future-stage destination views,
without summary/audio content or payment controls. The player destination also
checks the restored session and premium flag when opened directly. No verified
subscription source exists yet, so login alone never unlocks premium books.
These are UI gates only, not server authorization for the public upstream API.

## Stage 7: Reader and Player

`/player/[id]` displays plain-text summaries with preserved paragraph breaks and
four text sizes. Listen links use `?mode=listen` to focus the audio region without
autoplay. The native audio element powers custom play/pause, ±10-second skip,
keyboard-accessible seeking, elapsed/total duration, speed selection, and retry.
Playback is scoped to this route and stops when its audio element is unmounted.
Session restoration, auth errors, signed-out users, and premium books fail closed
before mounting the content loader. Content requests are bounded and cancelled
on unmount; responses revalidate ID, premium status, and the restricted audio
bucket. Missing text/audio and request/media failures have explicit states.
These remain client UI gates over a public upstream API, not server authorization.
Premium entitlement verification remains deferred. Catalog and detail duration badges
load restricted audio metadata when visible, with an unavailable fallback.
`npm run test:books` includes content parsing and loader failure coverage.

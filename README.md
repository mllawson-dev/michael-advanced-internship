# Summarist virtual internship

## Run locally

Use Node.js 24 LTS (the project pin is in `.nvmrc`) and npm:

```sh
nvm use
npm ci
npm run dev
```

If you do not use nvm, select Node.js 24 with your installed version manager.
Open http://localhost:3000. The root route currently displays a static setup
page; the homepage will be implemented one section at a time.
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

- `app/`: Next.js App Router layout, setup page, and plain CSS.
- `public/assets/`: byte-for-byte copies of the supplied image assets.
- `index.html`, `style.css`, and `assets/`: unchanged starter references.
- `.env.example`: future Firebase browser configuration and Stripe server-only
  test-mode variables; copy to `.env.local` when those integrations are built.

Next.js and React are the only runtime dependencies. TypeScript, ESLint, and
Next.js lint rules provide development checks. Versions are pinned in
`package.json` and resolved in `package-lock.json`.

## Next stages

Build the homepage navigation and hero first, then review each remaining
section before advancing. Authentication, book APIs, the app sidebar, reader,
audio player, search, test checkout, and settings follow in the agreed plan.
Optional features come after required features. Subscription tier naming is
pending confirmation. No Firebase or Stripe integration is active yet.

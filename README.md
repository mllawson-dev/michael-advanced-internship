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

Next.js and React are the only runtime dependencies. TypeScript, ESLint, and
Next.js lint rules provide development checks. Versions are pinned in
`package.json` and resolved in `package-lock.json`.

## Next stages

The static homepage is implemented from the supplied starter references. Roboto
is self-hosted by `next/font/google`; builds require network access to download
the font from Google. Login buttons remain disabled, and navigation/footer items
without implemented destinations are non-interactive. Testimonials and numerical
claims are supplied internship reference content, not live analytics.

Authentication, book APIs, the app sidebar, reader,
audio player, search, test checkout, and settings follow in the agreed plan.
Optional features come after required features. Subscription tier naming is
pending confirmation. No Firebase or Stripe integration is active yet.

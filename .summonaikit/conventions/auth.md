# Authentication conventions
- Firebase Auth via root AuthProvider; useAuth exposes restored user and pending/loading/error state.
- Native dialog is shared; open accepts only a known local /book/id return route, otherwise /for-you.
- No server session, entitlement store, or protected content endpoint exists yet.
- Book actions wait for session restoration and block on configuration/auth errors.
- Login does not confer a subscription; premium access remains unavailable until verified entitlement wiring.
- Book actions route authenticated free books to /player/id and premium books to /choose-plan; no client subscription flag unlocks content.
- Player destination is a future-stage placeholder that repeats session/premium UI checks and loads no summary/audio.

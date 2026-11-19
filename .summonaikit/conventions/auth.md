# Authentication conventions
- Firebase Auth via root AuthProvider; useAuth exposes restored user and pending/loading/error state.
- Native dialog accepts allowlisted /book/id, /settings, /library and /choose-plan returns; default /for-you.
- Firebase native Google popup and password-reset email own provider flow, tokens, recovery delivery and provider abuse throttling. Reset success text does not reveal account existence.
- Admin identity(request) verifies live Firebase ID tokens with revocation checking; anonymous billing identities fail closed. Library explicitly opts into anonymous identity and scopes every document path to the verified uid.
- Billing and library use server-only Admin Firestore. Browser Firestore rules deny all access. Never take uid, plan or metadata authority from the browser.
- Premium content and subscriptions have independent server entitlement checks; login alone grants no premium entitlement.
- Auth/configuration, origin and library storage failures fail closed. Library starts tracking saved/finished books in Stage 11, with no history to backfill.

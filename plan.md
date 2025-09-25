# Plan: Fix profile photo upload failure (Convex)

- [x] Reproduce/error triage: Confirmed Convex error `profiles:addPhoto -> Profile not found` when profile doc is missing.
- [x] Backend fix: Upsert behavior in `convex/profiles.ts:addPhoto` — create placeholder profile if missing and add the uploaded photo.
- [x] Logging: Add robust console logging for start, missing-profile path, success cases, and auth failures.
- [ ] Optional: Add `returns` validators to all functions in `convex/profiles.ts` to align with docs/CONVEX_RULES.md (only added to addPhoto for now).
- [ ] Optional: Frontend UX — disable photo upload button until profile exists to avoid placeholder creation unless desired.
- [ ] Verify end-to-end locally: run dev, sign up fresh user, upload image, observe photos and logs.
- [ ] Review logs after validation and clean up any noisy messages.

Notes:
- Kept changes minimal and focused to unblock image uploads immediately.
- Placeholder profile uses empty strings/arrays and `isActive: true`; user can update later via ProfileSetup form.


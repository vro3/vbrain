# HANDOFF — vrbrain
Generated 2026-04-16 by overnight audit agent (Haiku 4.5)

## What it does

vbrain is the Jarvince frontend dashboard. React 19 + Vite + TypeScript, 38 pages delivered via Vercel. It queries Firestore directly for show, performer, and financial data. No backend (proxies to vcommand via Vercel serverless functions for email). Supports show calendar, roster management, financial tracking, task management, and performer portal.

## Run it (verified commands)

```bash
npm run dev              # Start dev server on http://localhost:3000
npm run build           # Vite build to dist/
npm run preview         # Preview the build locally
npm run clean           # Remove dist/
npm run lint            # Run `npx tsc --noEmit` (standard type check — node_modules not installed locally)
```

**Note:** `node_modules` is NOT installed locally. Vercel handles deps at build. `npx tsc --noEmit` works because TypeScript is in devDependencies and Node resolves from `node_modules/` via npm.

## State today

- **Last commit:** `7dd441d` — "chore: ignore .DS_Store" (Apr 16, 19:02)
- **Branch:** main, up to date with origin/main
- **Dirty?:** Only `.DS_Store` modified (cleanup in progress — should be clean after commit)
- **TypeScript:** ✓ 0 errors (verified: `npx tsc --noEmit`)

## TypeScript errors

None. Clean build.

## Missing pieces

### Firebase Config (Required)
vrbrain queries Firestore directly. Requires 6 env vars in Vercel project settings:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Local dev loads from `.env.local` (Git-ignored, Vercel token only).

### API Proxy Auth (Conditional)
Email endpoint (`/api/send-email`) proxies to vcommand. Requires:
- `VCOMMAND_URL` — defaults to `https://vcommand.vercel.app`
- `VCOMMAND_AUTH_TOKEN` — Must be set in Vercel env to enable email sending

If missing, email endpoints return 500 "VCOMMAND_AUTH_TOKEN not configured".

## Overlaps

**Tight coupling to vcommand (vrcg-system)**

1. **Email Proxy** (`/api/send-email.ts` → `vcommand.vercel.app/api/showsync/send-email`)
   - vrbrain client calls `/api/send-email` directly (no brain_requests queue)
   - Vercel function forwards to vcommand
   - Requires `VCOMMAND_AUTH_TOKEN` in Vercel env

2. **Brain Queue** (`src/lib/brainRequestService.ts`)
   - vrbrain writes show analysis requests to Firestore `brain_requests` collection
   - Chromebox Brain (vrcg-system) picks them up and responds
   - Response is streamed back to UI via Firestore listener
   - No direct HTTP coupling — purely Firestore-based

3. **Shared Types**
   - `src/types/show.ts` — ported from `vrcg-system/core/dashboard/src/types/atlas.ts`
   - `src/types/brain.ts` — BrainRequest/BrainRequestType schemas

**Tight coupling is isolated to:**
- `/api/send-email.ts` — Email proxy to vcommand
- `src/lib/brainRequestService.ts` — Brain queue to Firestore
- `src/components/ShowRosterTab.tsx` — Uses `/api/send-email` endpoint (lines ~150–180)

## Recommended next step

1. **Deploy .DS_Store cleanup**
   - `git add .DS_Store` and commit (or stage with `git restore --staged .DS_Store` to leave dirty)
   - Verify `.gitignore` contains `.DS_Store` (confirmed in place)

2. **Verify Vercel env**
   - Confirm `VCOMMAND_AUTH_TOKEN` is set in Vercel project settings
   - All 6 Firebase vars are set
   - Redeploy if any vars were missing

3. **Monitor brain_requests**
   - If AI analysis feature breaks, check Firestore `brain_requests` collection and Chromebox Brain logs
   - Email proxy failures → check `VCOMMAND_AUTH_TOKEN` and vcommand uptime

4. **Type safety**
   - All TypeScript checks pass
   - If adding new Firestore fields, update types in `src/types/`

---

**Last verified:** 2026-04-16 19:05 UTC  
**Auditor:** Claude Haiku 4.5 (overnight agent)

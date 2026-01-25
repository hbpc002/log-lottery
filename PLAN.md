# QR Sign-up Plan

## 1. Goals
- Replace Excel-based entry with QR code sign-up on the main page.
- Collect only name and phone for participation.
- Use WebSocket for real-time synchronization to reflect new participants on the main screen.
- UI: show a QR code button on main page; a mobile registration page for entry.

## 2. Scope
- Frontend: QR code widget, on-page button, registration page for mobile entry.
- Backend: extend WebSocket service to accept a sign-up and broadcast to all clients.
- Data: IPersonConfig schema; add phone; store in Dexie (IndexedDB).

## 3. Data Model Changes
- Add `phone?: string` to IPersonConfig.
- Dexie: store `phone` field in allPersonList; consider indexing by `phone` for dedup.
- On submission: validate phone format; dedupe by phone.

-## 4. UI/UX Changes
- Main page: 3D board shows only name in the card details (no department/identity).
- QRCode widget: shows total participants and a QR code linking to /log-lottery/register.
- Registration page: mobile entry form with 2 fields: name and phone; validate and submit.
- Added local draft integration: on successful registration, create a local IPersonConfig with name/phone and persist to Dexie for immediate UI reflection.

-## 5. API & Routes
- Backend: POST /api/submit-person to submit participation; broadcast to connected clients via WebSocket.
- Frontend: iperson submission function `api_submitPerson` to call the API.
- Frontend: after a successful submission, push a local draft into Dexie so the main UI reflects the new participant instantly.
- New route: /log-lottery/register for registration page.

## 6. Milestones & Timeline
- Phase 1 (0.5 day): TS type changes and Dexie schema adjustments.
- Phase 2 (0.5 day): QR code UI + main page integration.
- Phase 3 (0.5 day): mobile registration page.
- Phase 4 (0.5 day): router wiring, API wiring, translations.
- Phase 5 (0.5 day): end-to-end testing and bug fixes.

## 7. Risks & Mitigations
- Data duplication: deduplicate by phone on server side and at client side before submission.
- WebSocket network issues: provide fallback to local sign-up and queue messages for retry.
- Privacy: limit data collected and secure API access.

## 8. Rollout Plan
- Start with a pilot group, monitor for 1–2 weeks, then roll out company-wide.

## 9. Next Steps
- Implement backend endpoint.
- Create Register.vue UI.
- Wire up router and API.
- Documentation updates.

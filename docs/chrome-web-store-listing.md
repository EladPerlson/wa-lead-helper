# Chrome Web Store — Listing checklist (WA Lead Helper)

Do **not** publish until Developer Dashboard credentials and assets are ready.

## Account & access
- [ ] Chrome Web Store Developer account paid ($5 one-time)
- [ ] Access to the publisher Google account for this extension
- [ ] 2FA enabled on the publisher account

## Extension package
- [ ] `npm run build` succeeds; upload the `dist/` zip (or CRX from store packaging)
- [ ] `manifest.json` version bumped for each submission
- [ ] Icons present: 16, 32, 48, 128 (`dist/icons/`)
- [ ] Permissions reviewed — only what the product needs (storage, tabs/host for web.whatsapp.com, etc.)

## Store listing copy (Hebrew recommended primary)
- [ ] **Short description** (≤132 chars): e.g. ניהול לידים בוואטסאפ ווב — תגיות, הערות, תזכורות ו-AI
- [ ] **Detailed description**: problem → features (home board, tags, status, reminders, AI) → privacy note
- [ ] **Category**: Productivity
- [ ] **Language**: Hebrew (+ English optional)

## Graphics (required sizes)
- [ ] Store icon **128×128** PNG
- [ ] Small promo tile **440×280** (optional but useful)
- [ ] Marquee promo **1400×560** (optional)
- [ ] Screenshots **1280×800** or **640×400** — at least 1, ideally 3–5:
  - Sidebar home / follow-up board
  - Tags + lead status
  - Reminder / AI suggest
  - Customers list with filters

## Privacy & compliance
- [ ] Privacy policy URL live (`PRIVACY_POLICY_URL` in extension)
- [ ] Single purpose statement filled in the dashboard
- [ ] Host permissions justification for `web.whatsapp.com`
- [ ] Data usage disclosure (local storage + optional Supabase account sync / AI)

## Video (optional but high converting)
- [ ] Replace landing placeholder (`דף נחיתה/#video`) with a real 30s demo
- [ ] Optionally link the same video in the store listing “YouTube URL” field

## Pre-submit QA
- [ ] Fresh Chrome profile: install packed build, open WhatsApp Web
- [ ] Login / register / free limits / upgrade modal
- [ ] Tag, note (Ctrl+S), reminder quick chip, AI summary (if key configured)
- [ ] DOM health banner does not false-positive on healthy WA
- [ ] Cloud sync toggle only after `user_contacts` migration applied in Supabase

## Publish
- [ ] Submit for review
- [ ] Monitor email for rejection reasons
- [ ] After approval: announce link + update landing CTA

## Credentials note
Publishing requires Chrome Web Store API / dashboard login. This repo does not contain publish credentials — run publish manually from the developer console when ready.

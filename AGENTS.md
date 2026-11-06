# Jadeite Systems · Installer app (mobile, Figma Make)

Clickable prototype of the **Installer mobile app** for Jadeite Glazing (windows, doors, bifolds, orangeries) — the fitter's phone app on the same platform as the Office Admin, the Sales portal and the Surveyor apps.
React 19 + Vite + TypeScript, running inside Figma Make. Phone size **375 × 812**. On a desktop it shows inside a phone frame, centred on the page; on a real phone it fills the screen.

The demo is signed in as **Amir Khan** (lead fitter). He only sees the jobs the office booked with him. Demo "today" is Friday 16 Oct 2026: an 8am return visit at Mrs Patel's, then day 1 of 2 at Hartley Dental (10 windows) with Joe Patel.

## Development server
A Vite dev server is already running on `$PORT` (default 8443). Changes hot-reload in the preview.

## Structure
- `src/main.tsx` – entry: HashRouter → StoreProvider → App. Imports Sora font, `src/index.css`, `src/styles/app.css`.
- `src/App.tsx` – all routes, wrapped in the phone `Device` and a sign-in guard.
- `src/ui/kit.tsx` – phone frame, status bar, `Screen`, `Header`, bottom `TabBar` (Today, Jobs, Calendar, Messages, Profile), bottom `Sheet`, toasts, Tag, Avatar, Field, Check, Switch, Seg, Steps, SignaturePad, PhotoGrid.
- `src/ui/sheets.tsx` – the pop-ups: On my way (type the arrival time), Can't make it, Customer not in, Report a problem, Send a progress update, Finish for today, Ask for time off, Log a call, Message the office, My crew, the job "more" menu.
- `src/lib/jobs.ts` – my bookings (installations, return visits, workshop days, time off), statuses, alerts, conversations and every installer action.
- `src/data/installs.ts` – the job pack for each job (sizes, positions, access, parking, materials, waste, surveyor notes, documents), the checks, problem types and job messages.
- `src/pages/` – Auth (sign in, code, locked, forgot, welcome tour), Today, Jobs (+ search, notifications, workshop/time-off day), Job (job page, job pack, before you start, on the job, complete the job in 5 steps, done, summary, history), Visit (return / aftercare visits), Calendar, Messages (+ thread), Profile (+ details, skills/area/van, notifications, Outlook and job packs, security, help).
- `src/data/` – sample data and shared demo state (saved in sessionStorage; "Reset demo data" in Profile clears it).
- `public/images` – property photos and the Jadeite J logo (relative paths like `images/house.jpg`).

## Installer flow (matches the Office Admin)
Office books the installation with individual fitters and releases the job pack → it appears in Today, Jobs, Calendar and Outlook → Read the job pack (the office sees it was read) → On my way (type the arrival time, text to the customer) → Before you start (4 checks + photos of the old frames) → On the job: tap off each frame as it is fitted, send progress updates, report a problem (wrong size, damage, missing part…) → multi-day jobs: Finish for today (customer told when you're back), Start day 2 next day, or Back on site the same day → Complete the job: 1 Final checks (8) → 2 Snags (add with photo, or "No snags") → 3 Photos of the finished work → 4 Handover: shown how everything works + customer signature (or reason they won't sign) → 5 Check and submit → Done → Job summary. Snags go to the office, which books a return visit. Return / aftercare visit: On my way → Start visit → each snag Fixed (photo) or Not fixed (reason: needs a part, another visit…) → optional signature → Submit. Can't make it → the office moves it. Customer not in → sent back to the office. Time off is asked for and the office agrees it.

## Design system (do not drift)
- Font: Sora (400–700). Plain CSS tokens in `src/styles/app.css` (same as the Surveyor mobile app).
- Colours: primary `#00c7a1`, primary-dark `#0b6e5c`, deep `#0b1f1b`, tint `#ebf7f3`, page `#f6f8f7`, border `#e3e9e7`, text `#0f1414` / `#3a4a4a` / `#6b7a78`, ok `#1f9d5b`, warn `#e0a100`, error `#d64545` (use red sparingly).
- Sizes (keep consistent): text only 11px to 20px; buttons 48px for main actions and 40px for everything else (icon buttons, chips, tabs, Fixed/Not fixed), all with 12px corners; inputs 48px; cards, notes and files have 16px corners. Bottom sheets for every pop-up. Calm, simple, jargon-free wording. Real property photos.
- Tailwind utilities are available, but Tailwind's base reset is intentionally not loaded.

## Demo sign-in
Any email · security code **482193** (3 wrong codes locks the account).

## Code quality
- Use double quotes for strings containing apostrophes, or escape them.
- Keep JSX balanced; pages export components used in `App.tsx`.

# Store Release Checklist

Use this checklist before preparing Google Play or Apple App Store builds.

## Build Mode
- Run `npm run build:store` and confirm the bundle completes successfully.
- Run `npm run build:cap:store` for Capacitor/app-shell builds.
- Confirm store mode disables popunder ad behavior.
- Confirm web mode still keeps normal website behavior.

## Tablet And Phone QA
- Phone portrait: home, lobby, game, result, and modals render correctly.
- Phone landscape: game is intentionally blocked and the rotate notice renders correctly.
- Tablet portrait: game topbar, language dropdown, and action buttons stay aligned.
- Tablet landscape: topbar, language dropdown, and side log render correctly.

## Android Shell
- Run `npm run cap:sync`.
- Open Android shell with `npm run cap:open:android`.
- Verify Android back behavior:
  - closes overlays first
  - returns to prior in-app screen before exiting
- Verify sign-in, room join/create, game start, result, and restart.
- Verify store mode build does not launch ads.

## iOS Shell
- Run `npm run cap:sync`.
- Open iOS shell with `npm run cap:open:ios`.
- Verify safe-area layout on iPhone and iPad.
- Verify sign-in, room join/create, game start, result, and restart.
- Verify phone landscape stays blocked and tablet landscape stays allowed.
- Verify store mode build does not launch ads or external tabs.

## Store Submission Basics
- App icon prepared.
- Splash / launch screen prepared.
- Privacy policy URL ready.
- Support contact ready.
- Account/data handling reviewed for store compliance.

## Final Verification
- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Run `npm run build:store`.

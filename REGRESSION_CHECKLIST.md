# Regression Checklist

Use this checklist after gameplay, room, language, audio, or layout changes.

## 1. Build Gate

- `npm run build` passes.
- App loads to the main menu without a blank screen or startup error.

## 2. Solo Flow

- Start a solo game from the main menu and confirm it starts as a fresh session.
- Confirm fresh solo start resets session totals.
- Confirm fresh solo start resets round wins.
- Use `Continue Game` and confirm totals and round wins are preserved.
- Use `Reset Game` and confirm totals and round wins are both reset.
- Use `Return to Main Menu` from in-game solo flow and confirm the next solo start is fresh.
- Use result-page `Home` and confirm the next solo start is fresh.
- Use congrats-page `Home` and confirm the next solo start is fresh.

## 3. Room Flow

- Create a room and confirm lobby and room page load correctly.
- Join an existing room and confirm player list and controls render correctly.
- Leave a room and confirm the app returns to a safe home or lobby state.
- Confirm stale, expired, or missing room fallback returns safely instead of leaving the game screen half-reset.
- Confirm room rematch or continue flow keeps expected room membership and room progression.
- Confirm reconnect flow restores room state when the room is still valid.

## 4. Language And Audio

- Open the language dropdown and select a language; confirm the dropdown closes immediately.
- Repeat the language selection check on Android touch input.
- Switch language during normal navigation and confirm the current screen remains usable.
- Switch from Chinese to Japanese and confirm voice playback follows the selected language.
- Confirm turning sound off immediately stops active callout playback.
- Confirm turning sound back on allows later callouts to play normally.
- Confirm duplicate Chinese callouts do not replay unexpectedly.

## 5. Gameplay UI

- Confirm top misc box shows `Round` on one row and `Countdown` on one row.
- Confirm top misc box position does not overlap nearby UI.
- Confirm room shuffle and emote buttons are on the right side like solo view.
- Confirm callouts are not covered by open-card or closed-card stacks.
- Confirm result page shows penalty wording for `無頂大` and translated equivalents.

## 6. Lobby UI

- Confirm no `0/4` tag appears when there are no active rooms.
- Confirm the create-room button matches join-room button styling.
- Confirm the create-room button uses default width rather than spanning full width.

## 7. Mobile And Device Checks

- Confirm no unexpected scrollbar appears on the main screens.
- Confirm portrait and landscape layouts both remain usable where supported.
- Confirm mobile south player badge stays anchored to the table bottom-left, not inside the action panel.
- Confirm selected hand cards do not hide cards to the right.
- Confirm iPhone game background image appears on the game page.
- Confirm the round wins tag does not wrap on iPhone game view.
- Confirm desktop topbar does not overlap the game log on narrow desktop widths.

## 8. Minimum Manual Pass Before Push

- Run `npm run build`.
- Play one fresh solo game.
- Test `Continue Game`.
- Test `Reset Game`.
- Test one room create or join flow.
- Test one language change.
- Test sound off during active voice playback.
- Test one iPhone or Android browser path if the change affects mobile UI or touch behavior.

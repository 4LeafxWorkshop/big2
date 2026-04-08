# Big Two State Contract

This document defines the intended state behavior for gameplay and UI transitions.

It is the source of truth for what must persist, what must reset, and what must never leak across flows.

## 1. Scope

This contract covers:
- solo mode
- room mode
- result screen actions
- home / lobby exits
- room reconnect behavior
- language and audio-callout behavior

This contract does not redefine game rules, scoring formulas, or Firebase schema outside of state ownership expectations.

## 2. State Buckets

For implementation purposes, state should be treated as these separate buckets:

- `profile state`
  - signed-in identity
  - player name
  - gender / avatar choice
  - profile picture
- `settings state`
  - language
  - AI difficulty
  - card back
  - sound enabled
  - callout display enabled
  - emote display enabled
  - callout voice mode / style
- `solo session state`
  - solo players
  - hand / trick / turn runtime
  - solo totals
  - solo round wins
  - solo history and temporary status
- `room session state`
  - room id / room code / shard routing
  - room snapshot
  - room self seat
  - room ready / started / pending flags
  - room totals
  - room round count
  - room reconnect pointer
- `ephemeral UI state`
  - selected cards
  - drag state
  - open menus
  - modal visibility
  - emote picker state
  - callout timers
  - speech / audio playback state

## 3. Global Rules

- Profile state persists until the user changes it or signs out.
- Settings state persists across screens and across new games.
- Ephemeral UI state must never survive a screen transition unless explicitly required.
- Solo session state and room session state must never bleed into each other.
- Any button labeled like `continue` is the only action allowed to preserve in-progress match carry-over.

## 4. Solo Mode Contract

### Start Solo Game

When starting a new solo game from home:
- preserve profile state
- preserve settings state
- initialize a fresh solo session
- reset selected cards, drag state, recommendation state, callout state, and temporary logs
- initialize solo totals from the default starting score unless a defined carry-over flow says otherwise
- reset solo round wins to `0`

### In-Round Solo State

During a solo round:
- hand, turn, discard, pass streak, last play, history, recommendation, and transient callouts are round-local
- cumulative solo totals persist for the current solo session
- solo round wins persist for the current solo session

### Solo Continue

When the player presses `continue` from a solo result screen:
- preserve solo totals
- preserve solo round wins
- preserve the same solo player lineup unless the product explicitly introduces a reshuffle rule
- reset round-local runtime only
  - hands
  - discard state
  - pass streak
  - current turn markers
  - selected cards
  - recommendation state
  - temporary callouts / emotes / logs

### Solo Restart

When the player presses `restart` for solo:
- preserve profile state
- preserve settings state
- create a fresh solo session
- reset solo totals to the default starting score
- reset solo round wins to `0`
- reset all round-local runtime

### Solo Return Home

When the player leaves solo by `home`, result-page `home`, or congratulation-page `home`:
- preserve profile state
- preserve settings state
- clear the solo session
- reset solo round wins to `0`
- clear all round-local and UI-ephemeral state

## 5. Room Mode Contract

### Create Room

When creating a room:
- preserve profile state
- preserve settings state
- snapshot current settings into room settings
- initialize a fresh room session
- clear solo session state
- clear ephemeral UI state from prior screens

### Join Room

When joining a room:
- preserve profile state
- preserve settings state
- load room settings and room runtime from the live room document
- do not overwrite the user's home settings permanently just because a room was joined
- clear solo session state
- clear stale room-local UI state from any previous room

### Room Lobby

In room lobby:
- room membership, seat assignment, ready state, privacy flag, and host identity are room-owned
- local menus, join modal visibility, and create/join form state are ephemeral
- leaving lobby clears room-local ephemeral state immediately

### Room Start / Active Game

During room play:
- room totals persist for the current room session
- room round count persists for the current room session
- room code, shard routing, players, and host identity persist for the current room session
- selected cards, emote picker, callouts, timers, and open menus are ephemeral

### Room Continue / Rematch

When the host starts the next room round from result:
- preserve room membership
- preserve room totals
- preserve room round count progression
- preserve room settings snapshot unless host explicitly changes them through a defined lobby flow
- reset round-local runtime only

### Room Leave / Return Home

When leaving a room or returning home from room mode:
- preserve profile state
- preserve settings state
- clear room session state held locally
- clear room-local ephemeral UI state
- clear active speech / callout playback state
- keep reconnect pointer only if reconnect is intentionally supported for this identity

## 6. Result Screen Contract

Result screens must be read-only summaries of the completed round.

### Continue

`Continue` means:
- keep current session carry-over
- advance to a fresh next round
- do not reset session totals
- do not reset session round wins when in solo

### Restart

`Restart` means:
- discard current match/session carry-over
- start a fresh match with default totals
- reset session round wins

### Home

`Home` means:
- discard current match/session carry-over
- return to the home screen with profile/settings intact
- reset session round wins

## 7. Reconnect Contract

### Signed-In User

For signed-in users:
- the authoritative reconnect target is the cloud user pointer and room directory
- reconnect may restore room membership if the room still exists and the user is still a member
- reconnect must not restore stale local-only round UI state such as selected cards, open menus, or pending callout animations

### Signed-Out User

For signed-out users:
- only the last room id helper may be cached locally
- reconnect may restore the room target, but not sensitive profile state beyond the current guest identity fields already in use

### Reconnect Failure

If reconnect fails because room data is stale, deleted, or inaccessible:
- clear local room session state
- clear the reconnect pointer if it is invalid
- return the user to a safe home/lobby state without leftover room UI

## 8. Language Contract

When language changes:
- preserve profile state
- preserve settings state except for the language value itself
- rerender all visible UI labels in the new language
- preserve the current screen
- preserve current gameplay state
- close the language dropdown immediately
- clear only language-sensitive ephemeral state that would be invalid after the change
  - active speech synthesis utterances
  - active recorded callout playback
  - temporary callout dedupe keys tied to previous language output

Language change must not:
- reset solo totals
- reset room totals
- reset round wins
- leave menus visually open after rerender

## 9. Audio / Callout Contract

Callout state is ephemeral.

When audio is toggled off:
- stop active callout playback
- stop speech synthesis
- prevent new voice playback until audio/voice is enabled again

When audio is toggled on:
- do not replay prior callouts automatically
- only new callouts may speak

Duplicate protection:
- the same callout should not replay twice because of duplicate touch/click events, rerender timing, or stale speech state

Language-sensitive playback:
- changing language must invalidate in-flight callout playback from the old language before the next callout starts

## 10. UI Ephemeral Reset Rules

The following must reset on any major screen transition:
- selected hand cards
- drag reorder state
- open dropdowns
- open transient popovers
- emote picker open state
- recommendation hints
- callout animation timers
- temporary speech/audio playback state

The following may persist only within the same active session and same screen when appropriate:
- game log expansion state
- leaderboard modal visibility only if the rerender is same-screen and explicitly intended

## 11. Priority Rules

If two flows conflict, apply these priorities:

1. prevent stale room/solo state leakage
2. preserve profile and settings state
3. preserve session carry-over only for explicit `continue` flow
4. reset all ephemeral UI state on screen transitions
5. clear language/audio playback state when language changes

## 12. Regression Checklist

Any change touching state transitions should verify:
- solo `continue` keeps totals and round wins
- solo `restart` resets totals and round wins
- solo `home` resets totals/round wins session state locally
- room `continue` keeps players, totals, and round count
- room `leave` clears local room runtime
- language switch closes dropdown and keeps gameplay state
- language switch does not leave stale voice playback active
- no selected cards or open popups leak across screen changes

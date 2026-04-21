# Big Two Web App Technical Specification

Related engineering docs:
- `GAME_BOT.md`
- `STATE_CONTRACT.md`
- `REGRESSION_CHECKLIST.md`

## 1. Technology Stack
- Runtime: Browser (client-side app)
- Language: JavaScript (ES modules)
- Build tool: Vite (`vite` dev/build/preview)
- Styling: CSS (single main stylesheet with responsive media rules)

## 2. Project Structure (Key Files)
- `src/main.js`
  - Core application state
  - Rendering functions
  - Game logic and validation
  - AI decision logic and recommendation
  - Input/event handling
  - Auth/session integration logic
- `public/style.css`
  - Theming
  - Home/game layouts
  - Responsive behavior for phone/tablet/desktop
  - Overlay and modal styles
- `public/`
  - Card assets
  - Avatar assets
  - Emote sticker assets
  - Callout audio assets
  - Fonts and background assets

## 3. Application Architecture
- Single-page client app with state-driven rendering.
- Main state object stores:
  - UI state (screen, language, overlays, log)
  - Home settings (name, gender/avatar, difficulty, card back)
  - System settings (sound, callout display, emote display)
  - Session identity and Google sign-in data
  - Solo game runtime
  - Room state and snapshots
  - Emote UI state (picker open + active sticker timer)
- Firebase architecture:
  - primary Firebase (`seed-services`) for leaderboard, user pointers, Firebase instance registry, and room directory
  - one or more room shard Firebase projects for live `big2Rooms` and `big2GameLogs`
- Render pipeline:
  - `render()` dispatches to screen-specific renderers:
    - `renderHome()`
    - `renderConfig()`
    - `renderGame()`
    - `renderOpponents()`
- Hash route:
  - `#opponents` switches the screen to the opponents view.
  - Home menu hides the opponents button unless the hash is present.
- View updates are achieved by HTML template regeneration and event rebinding.

## 4. Core Game Engine
- Deck/model:
  - 52-card deck, no jokers
  - Rank order encoded for Big Two behavior
- Rule evaluation:
  - `evaluatePlay(cards)` validates play type and power
  - `canBeat(candidate, target)` compares legal responses
  - First trick enforcement (`♦️3`)
  - Pass validity checks by lead state
- Turn progression:
  - Human action and AI turns update shared game state
  - Round completion triggers scoring and result view

## 5. AI System
- Main selector:
  - `chooseAiPlay(hand, game, diff)`
- Difficulty modes:
  - `easy`, `normal`, `hard`
- Recommendation feature reuses the hard-tuned decision path plus scoring heuristics.
- Detailed bot strategy documentation:
  - `GAME_BOT.md`

## 6. Input and Interaction Layer
- Card interactions:
  - Click/tap selection
  - Drag reorder (desktop)
- Mobile-specific handling:
  - Pointer/touch movement thresholds
  - Tap de-duplication window
- UI controls:
  - Play/pass/recommend/auto-sort
  - Modals and toggles
  - Log expand/collapse state handling

## 7. Responsive and Layout System
- CSS breakpoints split mobile/tablet/desktop behavior.
- Orientation logic:
  - Mobile-phone landscape restriction block
  - Tablet/desktop behaviors differ by media queries
- Dynamic viewport sync:
  - `syncViewport()` updates runtime CSS variables and orientation attributes
- Device-specific card sizing:
  - CSS clamps for card width and center-discard scale on small mobile devices (including iOS).
- Small desktop/web viewport guard:
  - Runtime attribute flags (`data-web-too-small`)
  - Interaction-blocking overlay in game screen

## 8. Authentication and Session
- Google Identity Services for sign-in UI.
- Firebase Auth used when available (Google provider).
- Session persistence:
  - Local storage of signed-in email for session restoration
  - Local storage of last room id when not signed in (room reconnect helper)
- Sign-in is required to start solo or room games.

## 9. Data and Persistence
- In-memory runtime store for leaderboard/profile cache behavior.
- Cloud persistence via Firebase/Firestore:
  - Primary Firebase:
    - leaderboard profiles
    - user room pointers
    - Firebase instance registry
    - room directory
  - Room shard Firebase:
    - live room documents
    - game logs
- REST fallback is used for leaderboard writes if SDK auth is unavailable.

### Multi-Firebase Room Routing

- `big2FirebaseInstances` in primary Firebase is the shard registry.
- `big2RoomDirectory` in primary Firebase maps room code / room id to `firebaseInstanceId`.
- New room creation:
  - loads the available Firebase instances
  - reads the newest room directory entry
  - rotates to the next usable Firebase instance
  - creates the live room in that shard
  - writes the directory record in primary Firebase
- Join/reconnect:
  - resolves the directory record first
  - opens the correct shard Firebase app dynamically in the browser
  - subscribes and writes only against that shard's live room
- Existing legacy rooms without a directory record still fall back to primary Firebase room lookup.

## 10. Audio and Speech Subsystem
- Sound engine via Web Audio API context.
- Runtime unlock on first user interaction.
- Callouts:
  - Prefer recorded MP3 clips when available.
  - Fallback to Web Speech; if unavailable, use tone fallback.
  - Callout display is independently toggleable from sound.
- Emote SFX are short Web Audio tone sequences.

## 11. Build and Run
- Development:
  - `npm run dev`
- Production build:
  - `npm run build`
- Local preview:
  - `npm run preview`

## 11.1 Firestore Rules Deploy
- Firebase projects for current rules deploy:
  - `Stream-0523`
  - `fourleafbig2`
  - `fourleafbig2-bot`
  - `peugeot-0523`
  - `seed-services`
  - `seed-services-31`
- Firebase config folder:
  - `/Users/ronnie/WebstormProjects/big2/firebase`
- Login check:
  - `npx firebase-tools login:list`
- Rules deploy:
  - `npx firebase-tools deploy --only firestore:rules --project Stream-0523`
  - `npx firebase-tools deploy --only firestore:rules --project fourleafbig2`
  - `npx firebase-tools deploy --only firestore:rules --project fourleafbig2-bot`
  - `npx firebase-tools deploy --only firestore:rules --project peugeot-0523`
  - `npx firebase-tools deploy --only firestore:rules --project seed-services`
  - `npx firebase-tools deploy --only firestore:rules --project seed-services-31`
- Operational guard:
  - treat rules deploy as pending until the deploy command succeeds
  - do not treat `login:ci` as a successful deploy
  - if Firestore rule changes affect room collections, deploy to all active room projects before considering the task complete

## 12. Mobile Packaging (Capacitor)
- Wrapper: Capacitor (single web codebase for iOS + Android).
- Config: `capacitor.config.json` with app name `Big2`, appId `com.seedservices.big2`, webDir `dist`.
- Build for Capacitor (relative asset base):
  - `npm run build:cap` (sets `CAPACITOR=1` so Vite base is `./`)
- Sync native platforms after build:
  - `npm run cap:sync`
- Open native projects:
  - `npm run cap:open:ios`
  - `npm run cap:open:android`
- iOS build requires Xcode + CocoaPods on macOS.
- Native builds lock orientation to portrait only (landscape is disabled in iOS/Android wrappers).

## 13. Mobile Behavior Test Checklist
- Core targets:
  - iPhone SE (2nd/3rd gen) portrait + landscape
  - iPhone 14/15 (or 13) portrait + landscape
  - iPad 9.7/10.2 portrait + landscape
  - Android phone (Pixel 6/7) portrait + landscape
  - Android tablet (10-11") portrait + landscape
- Layout checks:
  - Home screen: no overflow scrollbars; title/logo and settings panels stay within viewport.
  - Game screen: table + action zone fit without vertical scroll; log panel placement matches breakpoint rules.
  - Game log: header alignment consistent between expanded/collapsed.
  - Result screen: card rows and avatars stay within viewport; cards remain legible.
- Card sizing guards:
  - `--card-w` clamps must remain in spec across all mobile breakpoints.
  - iPhone Safari: hand/closed/discard cards stay compact with no overflow.
- Interaction checks:
  - Tap selection and drag thresholds work on touch devices.
  - Emote panel opens/closes without layout jump.
  - Sound toggle and callout display toggles behave as expected.
- Orientation checks:
  - Portrait: log defaults to collapsed under south panel on small widths.
  - Landscape: right log column shows on eligible widths without overlapping topbar.

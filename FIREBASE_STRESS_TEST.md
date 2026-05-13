# Firebase Stress Test Guide

This project should estimate Firebase capacity with measured Firestore operation counts, then run small controlled checks. Do not stress production blindly.

## Free Quota Baseline

Firestore free daily quota is project-level:

- 50,000 document reads per day
- 20,000 document writes per day
- 20,000 document deletes per day
- 1 GiB stored data

The practical daily capacity is whichever operation runs out first.

```text
games/day = min(
  50000 / reads_per_game,
  20000 / writes_per_game,
  20000 / deletes_per_game
)
```

## Estimator

Run the estimator:

```powershell
node tools/firebase-stress-estimate.mjs --scenario solo --users 100 --games-per-user 5
```

Override measured per-game counts when you have them:

```powershell
node tools/firebase-stress-estimate.mjs --scenario solo --users 100 --games-per-user 5 --reads-per-game 12 --writes-per-game 4 --deletes-per-game 0
```

Room game estimate:

```powershell
node tools/firebase-stress-estimate.mjs --scenario room --users 100 --games-per-user 2 --players 4 --moves 52
```

If room games are spread across the five dedicated room Firebase projects, include the project multiplier:

```powershell
node tools/firebase-stress-estimate.mjs --scenario room --users 50 --games-per-user 18.6 --players 4 --moves 52 --room-projects 5
```

The admin Firebase project, `seed-services`, should be measured separately from the room Firebase projects. Room-game capacity should use only the projects carrying room reads, writes, and listeners.

Room games are read-heavy because every room document update is read by each active listener. A simple estimate is:

```text
room_reads_per_game = setup_reads + (room_writes_per_game * player_count)
room_writes_per_game = setup_writes + (moves_per_game * writes_per_move) + finish_writes
```

## What To Measure

Measure these flows separately:

- login and home load
- solo game start
- solo game finish
- leaderboard open and refresh
- room create
- room join
- room lobby wait
- each room move/pass
- room emote and presence updates
- room finish and cleanup

Record:

- document reads
- document writes
- document deletes
- realtime listener count
- average moves per room game
- average players per room game

## Recommended Test Flow

1. Use the Firebase Emulator for high-volume testing.
2. Run scripted flows for solo games and room games.
3. Count Firestore operations per completed game.
4. Feed the measured counts into `tools/firebase-stress-estimate.mjs`.
5. Run one small production canary after emulator results look sane.

Example production canary:

```text
1 room
4 players
1 complete game
compare Firebase Console usage before and after
```

## Capacity Questions

Answer these from measured counts:

```text
single_games_per_day = min(50000 / solo_reads, 20000 / solo_writes, 20000 / solo_deletes)
room_games_per_day = room_project_count * min(50000 / room_reads, 20000 / room_writes, 20000 / room_deletes)
daily_users = min(50000 / reads_per_user_day, 20000 / writes_per_user_day, 20000 / deletes_per_user_day)
```

## Notes

- Do not include service account credentials in client stress tests.
- Keep production stress tests small; use the emulator for volume.
- Free quota is shared by all app usage in each Firebase project.
- The project multiplier assumes room load is balanced evenly across the room Firebase projects.
- Room capacity is usually limited by reads from realtime listeners, not writes.

# Firebase Scaling Checklist

This document lists the exact information needed when splitting Big Two across multiple Firebase projects.

## Current baseline

- Primary Firebase project:
  - `seed-services`
- Current implemented responsibilities:
  - `big2LeaderboardPlayers`
  - `big2Users`
  - `big2FirebaseInstances`
  - `big2RoomDirectory`
- Current room shard projects:
  - `Stream-0523`
  - `fourleafbig2`
  - `fourleafbig2-bot`
  - `peugeot-0523`
  - `seed-services`
  - `seed-services-31`
- Current live room collections on shards:
  - `big2Rooms`
  - `big2GameLogs`

## Planned scaling model

Example target:
- primary Firebase keeps:
  - leaderboard
  - room lobby directory / room metadata
  - user room pointers
- one or more extra Firebase projects handle:
  - live room gameplay traffic only

Current implementation:
- this is already active
- room creation rotates by the most recent `big2RoomDirectory.firebaseInstanceId`
- clients resolve room code -> directory -> shard Firebase at join/reconnect time

## What to give for one new Firebase project

For each extra Firebase project, provide:

- Firebase project ID
- Web app Firebase config:
  - `apiKey`
  - `authDomain`
  - `projectId`
  - `storageBucket`
  - `messagingSenderId`
  - `appId`
  - `measurementId` if used
- Exact Firestore collection names to use there:
  - live rooms collection
  - game logs collection if logs should also move there
  - any per-user pointer collection if different from current
- Whether Google Auth must work in that project too
  - if yes, the project must have the same Google sign-in setup and authorized domains
- Firestore security rules requirements
  - same as primary project or different
- Whether this project is:
  - dedicated to all room traffic
  - dedicated only to some room shards
  - dedicated only to a region / environment
- Sharding rule
  - how to choose which Firebase project a room uses
  - examples:
    - random per room
    - room code prefix
    - modulo on room code hash
    - region-based
    - manually assigned

## What to give for the overall multi-Firebase design

When enabling room load balancing, also provide:

- Which collections stay in primary Firebase
- Which collections move to shard Firebase projects
- Whether room creation happens:
  - only in primary, then forwards to a shard
  - directly in a chosen shard
- What room data must remain globally discoverable
  - room code
  - host name
  - room status
  - player count
  - shard/project id
- Whether `big2Users.currentRoomId` stays in primary Firebase
- Whether room reconnect should look up the shard from:
  - user pointer
  - room directory record
  - encoded room id / code
- Whether finished game logs stay with the gameplay shard or are copied back to primary
- Whether leaderboard writes remain primary-only

## Recommended shape for this app

For this codebase, the cleanest split is:

- Primary Firebase:
  - `big2LeaderboardPlayers`
  - `big2Users`
  - `big2FirebaseInstances`
  - `big2RoomDirectory`
- Room shard Firebase:
  - live `big2Rooms` game documents
  - `big2GameLogs`

Current implemented directory fields:

- `roomId`
- `code`
- `createdAt`
- `hostId`
- `hostName`
- `firebaseInstanceId`

Current implemented instance fields:

- `projectId`
- `projectNumber`
- `appId`
- `apiKey`

## Information needed again when adding even more Firebase projects later

For every additional Firebase project later, send this exact block:

- Project label:
- Firebase project ID:
- Web app config:
  - apiKey:
  - authDomain:
  - projectId:
  - storageBucket:
  - messagingSenderId:
  - appId:
  - measurementId:
- Intended responsibility:
  - live rooms / logs / directory / leaderboard / users
- Collection names:
  - rooms:
  - logs:
  - users:
  - leaderboard:
- Auth requirement:
  - Google sign-in yes/no
- Rules:
  - same as existing yes/no
  - if no, provide exact differences
- Routing rule:
  - how this project is selected for a room
- Migration need:
  - new rooms only or existing rooms also

## Notes

- Any time a new field is added to Firestore read/write payloads, `firebase/firebase.rules` must be updated in the same change.
- After any Firestore schema field change, deploy the updated rules before considering the feature done.
- For this project, deploy Firestore rules to all active room projects:
  - `Stream-0523`
  - `fourleafbig2`
  - `fourleafbig2-bot`
  - `peugeot-0523`
  - `seed-services`
  - `seed-services-31`
- Do not assume a client-only code change is enough when a room/user/log document shape changes.
- If multiple Firebase projects are used from the browser, each one needs its own web app config.
- If Google Auth is needed across all shards, the auth setup must be consistent across those projects.
- If room discovery remains global, one project must act as the source of truth for room directory lookup.
- In the current implementation, the source of truth is `seed-services`.
- If a new shard row is added to `big2FirebaseInstances` with valid config and matching rules deployed, it joins new-room rotation automatically.
- Existing rooms are not migrated automatically.

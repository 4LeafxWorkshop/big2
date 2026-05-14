#!/usr/bin/env node

import {fileURLToPath} from 'node:url';

export const FREE_FIRESTORE_DAILY_QUOTA={
  reads:50000,
  writes:20000,
  deletes:20000
};

export const DEFAULT_SOLO_PROFILE={
  readsPerGame:8,
  writesPerGame:4,
  deletesPerGame:0
};

export const DEFAULT_ROOM_PROFILE={
  players:4,
  movesPerGame:52,
  setupReads:12,
  setupWrites:7,
  writesPerMove:1,
  finishWrites:5,
  deletesPerGame:1
};

export const DEFAULT_ROOM_HUMAN_PROFILE={
  ...DEFAULT_ROOM_PROFILE,
  emojiPerPlayer:2,
  bellPerPlayer:2,
  presenceTouchesPerPlayer:1,
  profileSyncWritesPerPlayer:1,
  scoreSyncWritesPerPlayer:1,
  reactionWritesPerAction:1,
  presenceWritesPerTouch:1
};

function positiveNumber(value,fallback){
  const n=Number(value);
  return Number.isFinite(n)&&n>=0?n:fallback;
}

function positiveInt(value,fallback){
  return Math.max(0,Math.floor(positiveNumber(value,fallback)));
}

export function estimateSoloProfile(input={}){
  return{
    readsPerGame:positiveNumber(input.readsPerGame,DEFAULT_SOLO_PROFILE.readsPerGame),
    writesPerGame:positiveNumber(input.writesPerGame,DEFAULT_SOLO_PROFILE.writesPerGame),
    deletesPerGame:positiveNumber(input.deletesPerGame,DEFAULT_SOLO_PROFILE.deletesPerGame)
  };
}

export function estimateRoomProfile(input={}){
  const players=positiveInt(input.players,DEFAULT_ROOM_PROFILE.players)||1;
  const movesPerGame=positiveInt(input.movesPerGame,DEFAULT_ROOM_PROFILE.movesPerGame);
  const setupReads=positiveNumber(input.setupReads,DEFAULT_ROOM_PROFILE.setupReads);
  const setupWrites=positiveNumber(input.setupWrites,DEFAULT_ROOM_PROFILE.setupWrites);
  const writesPerMove=positiveNumber(input.writesPerMove,DEFAULT_ROOM_PROFILE.writesPerMove);
  const finishWrites=positiveNumber(input.finishWrites,DEFAULT_ROOM_PROFILE.finishWrites);
  const deletesPerGame=positiveNumber(input.deletesPerGame,DEFAULT_ROOM_PROFILE.deletesPerGame);
  const writesPerGame=setupWrites+(movesPerGame*writesPerMove)+finishWrites;

  return{
    players,
    movesPerGame,
    readsPerGame:setupReads+(writesPerGame*players),
    writesPerGame,
    deletesPerGame
  };
}

export function estimateRoomHumanProfile(input={}){
  const base=estimateRoomProfile(input);
  const emojiPerPlayer=positiveNumber(input.emojiPerPlayer,DEFAULT_ROOM_HUMAN_PROFILE.emojiPerPlayer);
  const bellPerPlayer=positiveNumber(input.bellPerPlayer,DEFAULT_ROOM_HUMAN_PROFILE.bellPerPlayer);
  const presenceTouchesPerPlayer=positiveNumber(input.presenceTouchesPerPlayer,DEFAULT_ROOM_HUMAN_PROFILE.presenceTouchesPerPlayer);
  const profileSyncWritesPerPlayer=positiveNumber(input.profileSyncWritesPerPlayer,DEFAULT_ROOM_HUMAN_PROFILE.profileSyncWritesPerPlayer);
  const scoreSyncWritesPerPlayer=positiveNumber(input.scoreSyncWritesPerPlayer,DEFAULT_ROOM_HUMAN_PROFILE.scoreSyncWritesPerPlayer);
  const reactionWritesPerAction=positiveNumber(input.reactionWritesPerAction,DEFAULT_ROOM_HUMAN_PROFILE.reactionWritesPerAction);
  const presenceWritesPerTouch=positiveNumber(input.presenceWritesPerTouch,DEFAULT_ROOM_HUMAN_PROFILE.presenceWritesPerTouch);
  const emojiActions=positiveNumber(input.emojiActions,base.players*emojiPerPlayer);
  const bellActions=positiveNumber(input.bellActions,base.players*bellPerPlayer);
  const presenceTouches=positiveNumber(input.presenceTouches,base.players*presenceTouchesPerPlayer);
  const profileSyncWrites=positiveNumber(input.profileSyncWrites,base.players*profileSyncWritesPerPlayer);
  const scoreSyncWrites=positiveNumber(input.scoreSyncWrites,base.players*scoreSyncWritesPerPlayer);
  const extraWritesPerGame=
    (emojiActions*reactionWritesPerAction)+
    (bellActions*reactionWritesPerAction)+
    (presenceTouches*presenceWritesPerTouch)+
    profileSyncWrites+
    scoreSyncWrites;
  return{
    ...base,
    emojiPerPlayer,
    bellPerPlayer,
    presenceTouchesPerPlayer,
    profileSyncWritesPerPlayer,
    scoreSyncWritesPerPlayer,
    reactionWritesPerAction,
    presenceWritesPerTouch,
    emojiActions,
    bellActions,
    presenceTouches,
    profileSyncWrites,
    scoreSyncWrites,
    writesPerGame:base.writesPerGame+extraWritesPerGame,
    readsPerGame:base.readsPerGame+(extraWritesPerGame*base.players)
  };
}

export function scaledQuota(projects=1,quota=FREE_FIRESTORE_DAILY_QUOTA){
  const safeProjects=positiveInt(projects,1)||1;
  return{
    projects:safeProjects,
    reads:quota.reads*safeProjects,
    writes:quota.writes*safeProjects,
    deletes:quota.deletes*safeProjects
  };
}

export function estimateQuotaCapacity(profile,quota=FREE_FIRESTORE_DAILY_QUOTA){
  const readsPerGame=positiveNumber(profile.readsPerGame,0);
  const writesPerGame=positiveNumber(profile.writesPerGame,0);
  const deletesPerGame=positiveNumber(profile.deletesPerGame,0);
  const limits=[
    {name:'reads',capacity:readsPerGame>0?Math.floor(quota.reads/readsPerGame):Infinity},
    {name:'writes',capacity:writesPerGame>0?Math.floor(quota.writes/writesPerGame):Infinity},
    {name:'deletes',capacity:deletesPerGame>0?Math.floor(quota.deletes/deletesPerGame):Infinity}
  ];
  const finiteLimits=limits.filter((x)=>Number.isFinite(x.capacity));
  const bottleneck=finiteLimits.reduce((best,next)=>next.capacity<best.capacity?next:best,finiteLimits[0]??{name:'none',capacity:Infinity});
  return{
    readsPerGame,
    writesPerGame,
    deletesPerGame,
    maxGamesPerDay:bottleneck.capacity,
    bottleneck:bottleneck.name,
    limits:Object.fromEntries(limits.map((x)=>[x.name,x.capacity]))
  };
}

export function estimateDailyLoad({users=1,gamesPerUser=1,profile={}}={}){
  const safeUsers=positiveInt(users,1);
  const safeGames=positiveNumber(gamesPerUser,1);
  const totalGames=safeUsers*safeGames;
  return{
    users:safeUsers,
    gamesPerUser:safeGames,
    totalGames,
    reads:Math.ceil(totalGames*positiveNumber(profile.readsPerGame,0)),
    writes:Math.ceil(totalGames*positiveNumber(profile.writesPerGame,0)),
    deletes:Math.ceil(totalGames*positiveNumber(profile.deletesPerGame,0))
  };
}

export function estimateQuotaUsage(load,quota=FREE_FIRESTORE_DAILY_QUOTA){
  return{
    readsPct:quota.reads?load.reads/quota.reads:0,
    writesPct:quota.writes?load.writes/quota.writes:0,
    deletesPct:quota.deletes?load.deletes/quota.deletes:0
  };
}

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i+=1){
    const raw=argv[i];
    if(!raw.startsWith('--'))continue;
    const eq=raw.indexOf('=');
    if(eq>=0){
      out[raw.slice(2,eq)]=raw.slice(eq+1);
      continue;
    }
    const key=raw.slice(2);
    const next=argv[i+1];
    if(next&&!next.startsWith('--')){
      out[key]=next;
      i+=1;
    }else{
      out[key]=true;
    }
  }
  return out;
}

function pct(value){
  return `${(value*100).toFixed(1)}%`;
}

function humanRoomActivitySummary(profile){
  const players=positiveInt(profile.players,DEFAULT_ROOM_PROFILE.players)||1;
  const emojiPerPlayer=positiveNumber(profile.emojiPerPlayer,0);
  const bellPerPlayer=positiveNumber(profile.bellPerPlayer,0);
  const presenceTouchesPerPlayer=positiveNumber(profile.presenceTouchesPerPlayer,0);
  const profileSyncWritesPerPlayer=positiveNumber(profile.profileSyncWritesPerPlayer,0);
  const scoreSyncWritesPerPlayer=positiveNumber(profile.scoreSyncWritesPerPlayer,0);
  const emojiActions=positiveNumber(profile.emojiActions,players*emojiPerPlayer);
  const bellActions=positiveNumber(profile.bellActions,players*bellPerPlayer);
  const presenceTouches=positiveNumber(profile.presenceTouches,players*presenceTouchesPerPlayer);
  const profileSyncWrites=positiveNumber(profile.profileSyncWrites,players*profileSyncWritesPerPlayer);
  const scoreSyncWrites=positiveNumber(profile.scoreSyncWrites,players*scoreSyncWritesPerPlayer);
  const reactionWritesPerAction=positiveNumber(profile.reactionWritesPerAction,1);
  const presenceWritesPerTouch=positiveNumber(profile.presenceWritesPerTouch,1);
  const extraWrites=(emojiActions*reactionWritesPerAction)+(bellActions*reactionWritesPerAction)+(presenceTouches*presenceWritesPerTouch)+profileSyncWrites+scoreSyncWrites;
  return[
    `Activity mix: ${profile.movesPerGame} moves, ${emojiActions} emoji actions, ${bellActions} bell actions, ${presenceTouches} presence touches, ${profileSyncWrites} profile sync writes, ${scoreSyncWrites} score sync writes`,
    `Extra human traffic: ${extraWrites} writes/game before listener fanout`
  ];
}

function printEstimate(args){
  const scenario=String(args.scenario||'solo').toLowerCase();
  const quota=scaledQuota(args.projects??args['room-projects']??1);
  const activityModel=String(args['activity-model']||'').trim().toLowerCase();
  const explicitProfile={
    readsPerGame:args['reads-per-game'],
    writesPerGame:args['writes-per-game'],
    deletesPerGame:args['deletes-per-game']
  };
  const profile=scenario==='room-human'||activityModel==='human'
    ?estimateRoomHumanProfile({
      players:args.players,
      movesPerGame:args.moves,
      setupReads:args['setup-reads'],
      setupWrites:args['setup-writes'],
      writesPerMove:args['writes-per-move'],
      finishWrites:args['finish-writes'],
      deletesPerGame:args['deletes-per-game'],
      emojiPerPlayer:args['emoji-per-player'],
      bellPerPlayer:args['bell-per-player'],
      presenceTouchesPerPlayer:args['presence-touches-per-player'],
      profileSyncWritesPerPlayer:args['profile-sync-writes-per-player'],
      scoreSyncWritesPerPlayer:args['score-sync-writes-per-player'],
      emojiActions:args['emoji-actions'],
      bellActions:args['bell-actions'],
      presenceTouches:args['presence-touches'],
      profileSyncWrites:args['profile-sync-writes'],
      scoreSyncWrites:args['score-sync-writes'],
      reactionWritesPerAction:args['reaction-writes-per-action'],
      presenceWritesPerTouch:args['presence-writes-per-touch']
    })
    :scenario==='room'
    ?estimateRoomProfile({
      players:args.players,
      movesPerGame:args.moves,
      setupReads:args['setup-reads'],
      setupWrites:args['setup-writes'],
      writesPerMove:args['writes-per-move'],
      finishWrites:args['finish-writes'],
      deletesPerGame:args['deletes-per-game']
    })
    :estimateSoloProfile(explicitProfile);
  const mergedProfile={
    ...profile,
    readsPerGame:args['reads-per-game']===undefined?profile.readsPerGame:positiveNumber(args['reads-per-game'],profile.readsPerGame),
    writesPerGame:args['writes-per-game']===undefined?profile.writesPerGame:positiveNumber(args['writes-per-game'],profile.writesPerGame),
    deletesPerGame:args['deletes-per-game']===undefined?profile.deletesPerGame:positiveNumber(args['deletes-per-game'],profile.deletesPerGame)
  };
  const capacity=estimateQuotaCapacity(mergedProfile,quota);
  const load=estimateDailyLoad({
    users:args.users,
    gamesPerUser:args['games-per-user']??args.games,
    profile:mergedProfile
  });
  const usage=estimateQuotaUsage(load,quota);

  console.log(`Scenario: ${scenario}`);
  if(scenario==='room-human'||activityModel==='human'){
    console.log(`Activity model: human`);
    humanRoomActivitySummary(profile).forEach((line)=>console.log(line));
  }
  console.log(`Quota projects: ${quota.projects}`);
  console.log(`Per game: ${capacity.readsPerGame} reads, ${capacity.writesPerGame} writes, ${capacity.deletesPerGame} deletes`);
  console.log(`Free quota capacity: ${capacity.maxGamesPerDay} games/day, bottleneck=${capacity.bottleneck}`);
  console.log(`Requested load: ${load.users} users * ${load.gamesPerUser} games = ${load.totalGames} games/day`);
  console.log(`Daily usage: ${load.reads} reads (${pct(usage.readsPct)}), ${load.writes} writes (${pct(usage.writesPct)}), ${load.deletes} deletes (${pct(usage.deletesPct)})`);
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  printEstimate(parseArgs(process.argv.slice(2)));
}

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  estimateDailyLoad,
  estimateQuotaCapacity,
  estimateQuotaUsage,
  estimateRoomProfile,
  estimateSoloProfile,
  FREE_FIRESTORE_DAILY_QUOTA,
  scaledQuota
} from '../tools/firebase-stress-estimate.mjs';

test('solo profile estimates free quota capacity by the tightest operation', ()=>{
  const profile=estimateSoloProfile({
    readsPerGame:10,
    writesPerGame:5,
    deletesPerGame:0
  });
  const capacity=estimateQuotaCapacity(profile);
  assert.equal(capacity.maxGamesPerDay,4000);
  assert.equal(capacity.bottleneck,'writes');
  assert.equal(capacity.limits.reads,5000);
  assert.equal(capacity.limits.writes,4000);
});

test('room profile accounts for each listener reading every room write', ()=>{
  const profile=estimateRoomProfile({
    players:4,
    movesPerGame:10,
    setupReads:2,
    setupWrites:3,
    writesPerMove:1,
    finishWrites:2,
    deletesPerGame:1
  });
  assert.equal(profile.writesPerGame,15);
  assert.equal(profile.readsPerGame,62);
  assert.equal(profile.deletesPerGame,1);
});

test('daily load and quota usage scale by users and games per user', ()=>{
  const load=estimateDailyLoad({
    users:100,
    gamesPerUser:2,
    profile:{readsPerGame:25,writesPerGame:8,deletesPerGame:0}
  });
  const usage=estimateQuotaUsage(load,FREE_FIRESTORE_DAILY_QUOTA);
  assert.deepEqual(load,{
    users:100,
    gamesPerUser:2,
    totalGames:200,
    reads:5000,
    writes:1600,
    deletes:0
  });
  assert.equal(usage.readsPct,0.1);
  assert.equal(usage.writesPct,0.08);
});

test('scaled quota multiplies capacity across room firebase projects', ()=>{
  const profile={readsPerGame:268,writesPerGame:64,deletesPerGame:1};
  const singleProject=estimateQuotaCapacity(profile,scaledQuota(1));
  const fiveProjects=estimateQuotaCapacity(profile,scaledQuota(5));
  assert.equal(singleProject.maxGamesPerDay,186);
  assert.equal(fiveProjects.maxGamesPerDay,932);
  assert.equal(fiveProjects.bottleneck,'reads');
});

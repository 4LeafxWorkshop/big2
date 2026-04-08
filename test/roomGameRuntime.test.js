import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomGameRuntimeController} from '../src/roomGameRuntime.js';

function card(rank,suit){
  return{rank,suit};
}

function createController(overrides={}){
  const deps={
    botProfileForSeat(seat){
      return{name:`Bot ${seat+1}`,gender:seat===1?'female':'male'};
    },
    calcPenaltyDetail(hand){
      return{remain:hand.length,base:hand.length,multiplier:1,deduction:hand.length,anyTwo:false,topTwo:false,chaoMultiplier:1,chaoKey:''};
    },
    canBeat(candidate,target){
      return (candidate.power?.[0]??-1)>(target.power?.[0]??-1);
    },
    cardId(c){
      return`${c.rank}-${c.suit}`;
    },
    cloneRoomGame(game){
      return structuredClone(game);
    },
    cmpCard(a,b){
      return a.rank-b.rank||a.suit-b.suit;
    },
    cmpStrongPlayDesc(a,b){
      return (b.eval.power?.[0]??-1)-(a.eval.power?.[0]??-1);
    },
    comparePower(a,b){
      return (a?.[0]??-1)-(b?.[0]??-1);
    },
    createDeck(){
      return[
        card(0,0),card(1,0),card(2,0),card(3,0),
        card(4,0),card(5,0),card(6,0),card(7,0),
        card(8,0),card(9,0),card(10,0),card(11,0),card(12,0),
        card(0,1),card(1,1),card(2,1),card(3,1),card(4,1),card(5,1),card(6,1),card(7,1),card(8,1),card(9,1),card(10,1),card(11,1),card(12,1),
        card(0,2),card(1,2),card(2,2),card(3,2),card(4,2),card(5,2),card(6,2),card(7,2),card(8,2),card(9,2),card(10,2),card(11,2),card(12,2),
        card(0,3),card(1,3),card(2,3),card(3,3),card(4,3),card(5,3),card(6,3),card(7,3),card(8,3),card(9,3),card(10,3),card(11,3),card(12,3)
      ];
    },
    evaluatePlay(cards){
      if(cards.length===1)return{valid:true,count:1,kind:'single',power:[cards[0].rank],sorted:[...cards]};
      return{valid:false,reason:'bad'};
    },
    getStartingScoreForSeat(player,seat,storedTotal){
      return Number.isFinite(Number(storedTotal))?Number(storedTotal):5000;
    },
    getDefaultDifficulty(){
      return'normal';
    },
    has3d(cards){
      return cards.some((c)=>c.rank===0&&c.suit===0);
    },
    isBotRoomEntry(entry){
      return entry?.isHuman===false || String(entry?.uid||'').startsWith('bot:');
    },
    isValidDifficulty(value){
      return ['easy','normal','hard'].includes(value);
    },
    kindLabel(kind){
      return kind;
    },
    legalTurnPlays(hand){
      return hand.map((c)=>({cards:[c],eval:{count:1,kind:'single',power:[c.rank]}}));
    },
    setGameStatus(game,message,{meta=null}={}){
      game.status=message;
      game.statusMeta=meta;
    },
    shouldForceMaxAgainstLastCard(){
      return false;
    },
    shuffle(deck){
      return [...deck];
    },
    t(key){
      return key;
    }
  };
  return createRoomGameRuntimeController({...deps,...overrides});
}

test('buildRoomGameState creates a 4-seat room game with preserved totals and round wins', ()=>{
  const controller=createController();
  const game=controller.buildRoomGameState({
    players:[
      {uid:'uid:1',name:'Alice',gender:'female',picture:'pic-a',seat:0,isHuman:true},
      {uid:'uid:2',name:'Bob',gender:'male',picture:'pic-b',seat:2,isHuman:true}
    ],
    totals:[5400,5000,4900,4700],
    game:{roundWins:[2,0,1,0]},
    settings:{aiDifficulty:'hard'}
  });
  assert.equal(game.players.length,4);
  assert.equal(game.players[0].uid,'uid:1');
  assert.equal(game.players[1].isHuman,false);
  assert.deepEqual(game.totals,[5400,5000,4900,4700]);
  assert.deepEqual(game.roundWins,[2,0,1,0]);
  assert.equal(game.aiDifficulty,'hard');
});

test('buildRoomGameState seeds bot totals from latest score helper when stored totals are missing', ()=>{
  const controller=createController({
    getStartingScoreForSeat(player,seat,storedTotal){
      if(Number.isFinite(Number(storedTotal)))return Number(storedTotal);
      return player.isHuman?6100:4800+(seat*75);
    }
  });
  const game=controller.buildRoomGameState({
    players:[
      {uid:'uid:1',name:'Alice',gender:'female',picture:'pic-a',seat:0,isHuman:true}
    ],
    settings:{aiDifficulty:'normal'}
  });
  assert.deepEqual(game.totals,[6100,4875,4950,5025]);
});

test('applyPlayToGame removes cards and advances turn on a valid play', ()=>{
  const controller=createController();
  const result=controller.applyPlayToGame({
    players:[
      {uid:'uid:1',name:'Alice',hand:[card(0,0),card(5,0)]},
      {uid:'uid:2',name:'Bob',hand:[card(1,1)]}
    ],
    currentSeat:0,
    lastPlay:null,
    passStreak:0,
    isFirstTrick:true,
    gameOver:false,
    history:[],
    playerActionLog:[null,null],
    handCount:[2,1],
    totals:[5000,5000],
    roundWins:[0,0]
  },0,[card(0,0)],100);
  assert.equal(result.ok,true);
  assert.equal(result.game.players[0].hand.length,1);
  assert.equal(result.game.currentSeat,1);
  assert.equal(result.game.isFirstTrick,false);
  assert.equal(result.game.history.length,1);
});

test('applyPassToGame retakes lead after three passes', ()=>{
  const controller=createController();
  const result=controller.applyPassToGame({
    players:[
      {uid:'uid:1',name:'Alice',hand:[card(0,0)]},
      {uid:'uid:2',name:'Bob',hand:[card(1,1)]},
      {uid:'uid:3',name:'Cara',hand:[card(2,2)]},
      {uid:'uid:4',name:'Dan',hand:[card(3,3)]}
    ],
    currentSeat:3,
    lastPlay:{seat:1,eval:{count:1,kind:'single',power:[5]}},
    passStreak:2,
    isFirstTrick:false,
    gameOver:false,
    history:[],
    playerActionLog:[null,null,null,null]
  },3,200);
  assert.equal(result.ok,true);
  assert.equal(result.game.currentSeat,1);
  assert.equal(result.game.lastPlay,null);
  assert.equal(result.game.passStreak,0);
});

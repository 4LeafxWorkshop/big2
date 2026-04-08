export function createRoomGameRuntimeController(deps){
  function buildRoomGameState(roomData){
    const roster=Array.isArray(roomData?.players)?roomData.players:[];
    const seatMap=new Map();
    roster.forEach((p)=>{
      const seat=Number(p?.seat);
      if(Number.isFinite(seat)&&seat>=0&&seat<4)seatMap.set(seat,p);
    });
    const players=[];
    for(let seat=0;seat<4;seat++){
      const entry=seatMap.get(seat);
      if(entry){
        const entryIsBot=deps.isBotRoomEntry(entry);
        const fallbackBot=deps.botProfileForSeat(seat);
        const entryNameRaw=String(entry.name??'').trim();
        const entryName=entryNameRaw||fallbackBot.name||`Bot ${seat+1}`;
        const entryGender=String(entry.gender??fallbackBot.gender??'male')==='female'?'female':'male';
        players.push({
          uid:String(entry.uid??(entryIsBot?`bot:${seat}:${entryName}`:'')),
          name:entryName,
          gender:entryGender,
          picture:entryIsBot?'':String(entry.picture??'').trim(),
          hand:[],
          isHuman:!entryIsBot,
          seat
        });
      }else{
        const bp=deps.botProfileForSeat(seat);
        players.push({
          uid:`bot:${seat}:${bp.name}`,
          name:String(bp.name),
          gender:String(bp.gender??'male')==='female'?'female':'male',
          hand:[],
          isHuman:false,
          seat
        });
      }
    }
    const deck=deps.shuffle(deps.createDeck());
    players.forEach((x)=>{x.hand=deck.splice(0,13).sort(deps.cmpCard);});
    const start=players.findIndex((x)=>x.hand.some((c)=>c.rank===0&&c.suit===0));
    const storedTotals=Array.isArray(roomData?.totals)&&roomData.totals.length===4?roomData.totals
      :(Array.isArray(roomData?.game?.totals)&&roomData.game.totals.length===4?roomData.game.totals:null);
    const totals=storedTotals?[...storedTotals]:[5000,5000,5000,5000];
    const roundWins=Array.isArray(roomData?.game?.roundWins)&&roomData.game.roundWins.length===4
      ?roomData.game.roundWins.map((v)=>Number(v)||0)
      :[0,0,0,0];
    const difficulty=(roomData?.settings?.aiDifficulty&&deps.isValidDifficulty(roomData.settings.aiDifficulty))?roomData.settings.aiDifficulty:deps.getDefaultDifficulty();
    const roomBots=players.filter((p)=>!p.isHuman).map((p)=>({name:p.name,gender:p.gender}));
    const game={players,botProfiles:roomBots,botNames:players.filter((p)=>!p.isHuman).map((p)=>p.name),totals,roundWins,currentSeat:start,lastPlay:null,passStreak:0,isFirstTrick:true,gameOver:false,status:'',systemLog:[],history:[],aiDifficulty:difficulty,lastCardBreach:null,roundSummary:null,startedAt:Date.now(),turnStartedAt:Date.now(),lastMove:null,playerActionLog:[null,null,null,null],handCount:players.map((p)=>p.hand.length)};
    deps.setGameStatus(game,`${players[start].name} ${deps.t('start')}`,{meta:{key:'start',name:players[start].name}});
    return game;
  }

  function applyPlayToGame(game,seat,cards,now=Date.now()){
    const g=deps.cloneRoomGame(game);
    if(!g||!Array.isArray(g.players)||!g.players[seat])return{ok:false,reason:'invalid'};
    const handIds=new Set((g.players[seat].hand??[]).map(deps.cardId));
    const cardIds=cards.map(deps.cardId);
    if(!cardIds.length||cardIds.some((id)=>!handIds.has(id)))return{ok:false,reason:deps.t('illegal')};
    const ev=deps.evaluatePlay(cards);
    if(!ev.valid)return{ok:false,reason:ev.reason||deps.t('illegal')};
    if(g.isFirstTrick&&!deps.has3d(cards))return{ok:false,reason:deps.t('must3')};
    if(g.lastPlay&&!deps.canBeat(ev,g.lastPlay.eval))return{ok:false,reason:deps.t('beat')};
    if(deps.shouldForceMaxAgainstLastCard(g,seat)){
      const legal=deps.legalTurnPlays(g.players[seat].hand,g).sort(deps.cmpStrongPlayDesc);
      const strongest=legal[0];
      const chosen=legal.find((x)=>x.eval.count===ev.count&&x.eval.kind===ev.kind&&deps.comparePower(x.eval.power,ev.power)===0);
      if(chosen&&strongest&&deps.comparePower(chosen.eval.power,strongest.eval.power)!==0){
        g.lastCardBreach={seat,threatenedSeat:(seat+1)%4};
      }
    }
    const ids=new Set(cards.map(deps.cardId));
    g.players[seat].hand=g.players[seat].hand.filter((c)=>!ids.has(deps.cardId(c)));
    g.lastPlay={seat,eval:ev,cards:ev.sorted};
    g.passStreak=0;
    g.isFirstTrick=false;
    g.lastMove={type:'play',seat,uid:String(g.players[seat]?.uid??''),cards:ev.sorted,ts:now};
    if(Array.isArray(g.playerActionLog))g.playerActionLog[seat]={type:'play',cards:ev.sorted,ts:now};
    g.turnStartedAt=now;
    g.history.push({action:'play',seat,name:g.players[seat].name,cards:ev.sorted,kind:ev.kind,ts:now});
    if(Array.isArray(g.handCount))g.handCount[seat]=g.players[seat].hand.length;
    if(g.players[seat].hand.length===0){
      g.gameOver=true;
      const details=g.players.map((p,i)=>i===seat?{remain:0,base:0,multiplier:1,deduction:0,anyTwo:false,topTwo:false,chaoMultiplier:1,chaoKey:''}:deps.calcPenaltyDetail(p.hand));
      let deductions=details.map((d)=>d.deduction);
      if(g.lastCardBreach&&seat===g.lastCardBreach.threatenedSeat){
        const violator=g.lastCardBreach.seat;
        const transferred=deductions.reduce((sum,v)=>sum+v,0);
        deductions=deductions.map((v,i)=>i===violator?transferred:0);
      }
      const winnerGain=deductions.reduce((sum,v)=>sum+v,0);
      g.roundSummary={winnerSeat:seat,deductions:[...deductions],winnerGain,details,lastCardBreach:g.lastCardBreach?{...g.lastCardBreach}:null};
      g.roundWins=(Array.isArray(g.roundWins)&&g.roundWins.length===4?g.roundWins:[0,0,0,0]).map((v,i)=>i===seat?(Number(v)||0)+1:(Number(v)||0));
      g.totals=(g.totals??[5000,5000,5000,5000]).map((s,i)=>s+(i===seat?winnerGain:-deductions[i]));
      const remain=g.players.map((p,i)=>({p,i})).filter((x)=>x.i!==seat).map((x)=>`${x.p.name}:${deductions[x.i]}`).join(' / ');
      const penalties=g.players.map((p,i)=>({name:p.name,value:deductions[i]})).filter((_,i)=>i!==seat);
      deps.setGameStatus(g,`${g.players[seat].name} ${deps.t('wins')} ${deps.t('penalty')}:${remain}`,{now,meta:{key:'wins',name:g.players[seat].name,penalties}});
      g.lastMove={type:'win',seat,uid:String(g.players[seat]?.uid??''),cards:[],ts:now};
      return{ok:true,game:g,finished:true};
    }
    if(g.lastCardBreach&&seat===g.lastCardBreach.threatenedSeat)g.lastCardBreach=null;
    g.currentSeat=(seat+1)%4;
    deps.setGameStatus(g,`${g.players[seat].name} ${deps.t('played')} ${deps.kindLabel(ev.kind)}.`,{appendLog:false,now,meta:{key:'played',name:g.players[seat].name,kind:ev.kind}});
    return{ok:true,game:g};
  }

  function applyPassToGame(game,seat,now=Date.now()){
    const g=deps.cloneRoomGame(game);
    if(!g||!Array.isArray(g.players)||!g.players[seat])return{ok:false,reason:'invalid'};
    if(!g.lastPlay)return{ok:false,reason:deps.t('cantPass')};
    g.passStreak+=1;
    g.history.push({action:'pass',seat,name:g.players[seat].name,ts:now});
    g.lastMove={type:'pass',seat,uid:String(g.players[seat]?.uid??''),cards:[],ts:now};
    if(Array.isArray(g.playerActionLog))g.playerActionLog[seat]={type:'pass',cards:[],ts:now};
    g.turnStartedAt=now;
    if(g.lastCardBreach&&seat===g.lastCardBreach.threatenedSeat)g.lastCardBreach=null;
    if(g.passStreak>=3){
      const lead=g.lastPlay.seat;
      g.currentSeat=lead;
      g.lastPlay=null;
      g.passStreak=0;
      g.turnStartedAt=now;
      deps.setGameStatus(g,`${g.players[lead].name} ${deps.t('retake')}`,{now,meta:{key:'retake',name:g.players[lead].name}});
      return{ok:true,game:g};
    }
    g.currentSeat=(seat+1)%4;
    deps.setGameStatus(g,`${g.players[seat].name} ${deps.t('pass')}.`,{appendLog:false,now,meta:{key:'pass',name:g.players[seat].name}});
    return{ok:true,game:g};
  }

  return{
    applyPassToGame,
    applyPlayToGame,
    buildRoomGameState
  };
}

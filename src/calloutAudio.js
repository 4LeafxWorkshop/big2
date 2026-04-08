export function createCalloutAudioController(deps){
  let speechPrimed=false;
  let lastSpokenCalloutKey='';
  let lastSpokenCalloutAt=0;
  let calloutSpeechActive=false;
  let calloutSpeechUntil=0;
  let calloutSpeechEndedAt=0;
  let calloutResumePending=false;
  let calloutSpeakSeq=0;
  const calloutAudioCache=new Map();
  let iosSharedCalloutAudio=null;

  const state=()=>deps.getState();
  const sound=()=>deps.getSound();
  const calloutVoiceMode=()=>deps.getCalloutVoiceMode();
  const calloutStylePack=()=>deps.getCalloutStylePack();

  function resetPlaybackState(){
    calloutSpeakSeq+=1;
    calloutSpeechActive=false;
    calloutSpeechUntil=0;
    calloutSpeechEndedAt=Date.now();
    calloutResumePending=false;
    lastSpokenCalloutKey='';
    lastSpokenCalloutAt=0;
    speechPrimed=false;
    try{window.speechSynthesis?.cancel?.();}catch{}
    try{
      if(iosSharedCalloutAudio){
        iosSharedCalloutAudio.pause?.();
        iosSharedCalloutAudio.currentTime=0;
        iosSharedCalloutAudio.onended=null;
        iosSharedCalloutAudio.onerror=null;
      }
    }catch{}
  }

  function ensureIosSharedAudio(){
    if(!deps.isIOSDevice())return null;
    if(!iosSharedCalloutAudio){
      iosSharedCalloutAudio=new Audio();
      iosSharedCalloutAudio.preload='auto';
      iosSharedCalloutAudio.playsInline=true;
      iosSharedCalloutAudio.setAttribute?.('playsinline','');
    }
    return iosSharedCalloutAudio;
  }

  function deriveCalloutClipKey(msg='',meta={}){
    const explicit=String(meta?.clipKey??meta?.key??'').trim().toLowerCase();
    if(explicit)return explicit;
    const raw=String(msg??'').trim();
    if(deps.isPassCalloutText(raw))return'pass';
    if(deps.isLastCalloutText(raw))return'last';
    const currentState=state();
    const kindMap=deps.KIND[currentState.language]??deps.KIND['zh-HK'];
    for(const[k,v] of Object.entries(kindMap)){
      if(raw.startsWith(String(v)))return`kind-${k}`;
    }
    return'generic';
  }

  async function playRecordedCalloutClip(clipKey='',gender='male',seq=0,opts={}){
    const key=String(clipKey??'').trim().toLowerCase();
    if(!key)return false;
    const holdResume=Boolean(opts?.holdResume);
    const waitForEnd=Boolean(opts?.waitForEnd);
    const currentState=state();
    const lang=currentState.language==='en'?'en':currentState.language==='zh-HK'?'zh-HK':'';
    if(!lang)return false;
    const g=String(gender??'male')==='female'?'female':'male';
    const pack=deps.normalizeCalloutStylePack(calloutStylePack());
    const cacheKey=`${lang}|${key}|${g}`;
    const exts=lang==='zh-HK'?['mp3']:['m4a','mp3','wav'];
    const nameCandidates=[
      `${key}-${pack}-${g}`,
      `${key}-${pack}`,
      `${key}-${g}`,
      key
    ];
    for(const baseName of nameCandidates){
      for(const ext of exts){
        const src=deps.withBase(`audio/callout/${lang}/${baseName}.${ext}`);
        const token=`${cacheKey}|${baseName}|${ext}`;
        let a=null;
        if(deps.isIOSDevice()){
          a=ensureIosSharedAudio();
        }else{
          a=calloutAudioCache.get(token);
          if(!a){
            a=new Audio(src);
            a.preload='auto';
            calloutAudioCache.set(token,a);
          }
        }
        a.src=src;
        try{
          if(seq&&seq!==calloutSpeakSeq)return false;
          calloutSpeechActive=true;
          calloutResumePending=false;
          calloutSpeechEndedAt=0;
          let settled=false;
          let settlePlayback;
          const playbackDone=waitForEnd?new Promise((resolve)=>{settlePlayback=resolve;}):null;
          const finish=(ok)=>{
            if(settled)return;
            settled=true;
            if(waitForEnd&&typeof settlePlayback==='function')settlePlayback(Boolean(ok));
          };
          const estimatedMs=Number.isFinite(a.duration)&&a.duration>0
            ?Math.max(200,Math.min(2800,Math.round(a.duration*1000)))
            :1200;
          calloutSpeechUntil=Date.now()+estimatedMs;
          a.onended=()=>{
            if(seq&&seq!==calloutSpeakSeq)return;
            calloutSpeechActive=false;
            calloutSpeechUntil=0;
            calloutSpeechEndedAt=Date.now();
            calloutResumePending=!holdResume;
            if(!holdResume)deps.maybeRunSoloAi();
            finish(true);
          };
          a.onerror=()=>{
            if(seq&&seq!==calloutSpeakSeq)return;
            calloutSpeechActive=false;
            calloutSpeechUntil=0;
            calloutSpeechEndedAt=Date.now();
            calloutResumePending=!holdResume;
            if(!holdResume)deps.maybeRunSoloAi();
            finish(false);
          };
          a.muted=false;
          a.volume=1;
          a.pause?.();
          a.currentTime=0;
          await a.play();
          if(waitForEnd&&playbackDone){
            const endedOk=await playbackDone;
            return Boolean(endedOk);
          }
          return true;
        }catch{
          if(seq&&seq!==calloutSpeakSeq)return false;
          calloutSpeechActive=false;
          calloutSpeechUntil=0;
          calloutSpeechEndedAt=Date.now();
          calloutResumePending=!holdResume;
        }
      }
    }
    return false;
  }

  async function playRecordedCalloutClipSequence(clipKeys=[],gender='male',seq=0){
    const keys=(Array.isArray(clipKeys)?clipKeys:[])
      .map((k)=>String(k??'').trim().toLowerCase())
      .filter(Boolean);
    if(!keys.length)return false;
    let playedAny=false;
    for(let i=0;i<keys.length;i+=1){
      const isLast=i===keys.length-1;
      const ok=await playRecordedCalloutClip(keys[i],gender,seq,{
        holdResume:!isLast,
        waitForEnd:!isLast
      });
      if(!ok)return playedAny;
      playedAny=true;
    }
    return playedAny;
  }

  function speakCallout(text,gender='male',meta={}){
    try{
      const msg=String(text??'').trim();
      if(!msg)return;
      const currentState=state();
      if(deps.getCalloutGateUntilPlay()&&currentState.screen==='game'&&currentState.home.mode==='solo'&&((currentState.solo?.history?.length??0)===0)&&!meta?.force)return;
      if(calloutVoiceMode()==='off')return;
      const speakSeq=++calloutSpeakSeq;
      try{
        window.speechSynthesis?.cancel?.();
        if(iosSharedCalloutAudio){
          iosSharedCalloutAudio.pause?.();
          iosSharedCalloutAudio.currentTime=0;
        }
      }catch{}
      calloutSpeechActive=false;
      calloutSpeechUntil=0;
      calloutResumePending=false;
      const g=String(gender??'male')==='female'?'female':'male';
      const seatNum=Number(meta?.seat);
      const seatKey=Number.isFinite(seatNum)?`s${(Math.trunc(seatNum)%4+4)%4}`:'sX';
      const key=`${currentState.language}|${seatKey}|${g}|${msg}`;
      const now=Date.now();
      if(key===lastSpokenCalloutKey&&(calloutSpeechActive||now-lastSpokenCalloutAt<1600))return;
      lastSpokenCalloutKey=key;
      lastSpokenCalloutAt=now;
      const clipKey=deriveCalloutClipKey(msg,meta);
      const variantClipKey=deps.deriveWinnerVariantClipKey(msg)
        ||deps.deriveZhHkVariantClipKey(msg,meta)
        ||deps.deriveEnVariantClipKey(msg,meta);
      const composedClipKeys=deps.deriveZhHkComposedClipKeys(variantClipKey,clipKey);
      const effectiveClipKey=variantClipKey||clipKey;
      const calloutType=clipKey==='pass'
        ?'pass'
        :clipKey==='last'
          ?'last'
          :clipKey.startsWith('kind-')
            ?'play'
            :'generic';
      const playCalloutToneFallback=()=>{
        deps.unlockAudio();
        const currentSound=sound();
        if(!currentSound.enabled||!currentSound.ctx)return;
        if(calloutType==='pass'||deps.isPassCalloutText(msg)){
          deps.playTone(240,0.12,'square',0.05);
          deps.playTone(180,0.12,'square',0.04,0.07);
          return;
        }
        if(calloutType==='last'||deps.isLastCalloutText(msg)){
          deps.playTone(740,0.12,'triangle',0.06);
          deps.playTone(920,0.14,'triangle',0.05,0.06);
          return;
        }
        deps.playTone(430,0.12,'square',0.055);
        deps.playTone(590,0.13,'triangle',0.05,0.06);
      };
      const tryRecorded=()=>{
        if(composedClipKeys.length){
          return playRecordedCalloutClipSequence(composedClipKeys,g,speakSeq);
        }
        return playRecordedCalloutClip(effectiveClipKey,g,speakSeq);
      };
      const forceExactTts=Boolean(meta?.forceExactTts);
      const ttsOnlyLang=!(currentState.language==='zh-HK'||currentState.language==='en');
      const useTts=Boolean(meta?.forceTts)||ttsOnlyLang;
      const voiceMode=calloutVoiceMode();
      const useRecorded=!ttsOnlyLang&&(voiceMode==='auto'||voiceMode==='recorded');
      const recordedMatchesText=Boolean(variantClipKey)||Boolean(composedClipKeys.length)||deps.isCanonicalRecordedCalloutText(msg,clipKey);
      if(!useTts){
        if(useRecorded){
          void tryRecorded().then((ok)=>{if(!ok)playCalloutToneFallback();});
        }else{
          playCalloutToneFallback();
        }
        return;
      }

      if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance==='undefined'){
        if(useRecorded){
          void tryRecorded().then((ok)=>{if(!ok)playCalloutToneFallback();});
        }else{
          playCalloutToneFallback();
        }
        return;
      }
      if(!useTts&&useRecorded&&recordedMatchesText){
        void tryRecorded().then((ok)=>{if(!ok)playCalloutToneFallback();});
        return;
      }
      const synth=window.speechSynthesis;
      const femaleHint=/(female|woman|girl|zira|samantha|victoria|karen|aria|ava|alloy|helena|sabina|dalia|paulina|monica|laura|denise|julie|amelie|hedda|katja|haruka|kyoko|ayumi|nanami|sayaka|ting[-\s]?ting|sin[-\s]?ji|sinji|mei[-\s]?jia|xiaoxiao|xiaoyi|xiaomeng|xiaohan|jia[-\s]?yi|yi[-\s]?ting|tracy|hiumaan|standard[-_\s]?a|standard[-_\s]?c|neural[-_\s]?a|neural[-_\s]?c|yue[-_\s]?hk[-_\s]?(female|a|c))/i;
      const maleHint=/(male|\bman\b|boy|david|alex|daniel|fred|jorge|pablo|raul|diego|carlos|henri|thomas|stefan|klaus|ichiro|otoya|takumi|lee|jun[-\s]?jie|wei|ming|yunxi|yunyang|xiaoming|xiaogang|james|tom|kevin|danny|hiugaai|wanlung|aasing|standard[-_\s]?b|standard[-_\s]?d|neural[-_\s]?b|neural[-_\s]?d|yue[-_\s]?hk[-_\s]?(male|b|d))/i;
      const voiceMeta=(v)=>`${v?.name||''} ${v?.voiceURI||''} ${v?.lang||''}`;
      const isFemaleVoice=(v)=>femaleHint.test(voiceMeta(v))&&!maleHint.test(voiceMeta(v));
      const isMaleVoice=(v)=>maleHint.test(voiceMeta(v))&&!femaleHint.test(voiceMeta(v));
      const byLangPrefixes=(voices,prefixes)=>voices.filter((v)=>prefixes.some((p)=>String(v.lang??'').toLowerCase().startsWith(p)));
      const speechLangMeta=(()=>{
        if(currentState.language==='fr')return{tts:'fr-FR',prefixes:['fr']};
        if(currentState.language==='de')return{tts:'de-DE',prefixes:['de']};
        if(currentState.language==='es')return{tts:'es-ES',prefixes:['es']};
        if(currentState.language==='en')return{tts:'en-US',prefixes:['en']};
        if(currentState.language==='ja')return{tts:'ja-JP',prefixes:['ja']};
        return{tts:'yue-HK',prefixes:['yue','zh-hk','zh-hant-hk']};
      })();
      const isCantoneseVoice=(v)=>{
        const meta=voiceMeta(v).toLowerCase();
        const lang=String(v?.lang??'').toLowerCase();
        return /^yue(-|$)/i.test(lang) || /^zh[-_]?hk(-|$)/i.test(lang) || /cantonese|hong kong|heung gong/.test(meta);
      };
      const isMandarinVoice=(v)=>{
        const meta=voiceMeta(v).toLowerCase();
        const lang=String(v?.lang??'').toLowerCase();
        return /^zh[-_]?cn(-|$)/i.test(lang)
          || /^zh[-_]?sg(-|$)/i.test(lang)
          || /mandarin|putonghua|guoyu|普通话|普通話|國語/.test(meta);
      };
      const chooseVoice=(voices)=>{
        const source=voices??[];
        if(!source.length)return null;
        const langPool=currentState.language==='zh-HK'
          ?source.filter((v)=>isCantoneseVoice(v)&&!isMandarinVoice(v))
          :byLangPrefixes(source,speechLangMeta.prefixes);
        const set=langPool.filter((v)=>!isMandarinVoice(v));
        if(!set.length)return null;
        if(g==='female')return set.find(isFemaleVoice) ?? set.find((v)=>!isMaleVoice(v)) ?? null;
        return set.find(isMaleVoice) ?? set.find((v)=>!isFemaleVoice(v)) ?? null;
      };
      const chooseAnyCantonese=(voices)=>{
        const source=voices??[];
        const set=source.filter((v)=>isCantoneseVoice(v)&&!isMandarinVoice(v));
        return set[0]??null;
      };
      const chooseFallbackVoice=(voices)=>{
        const source=voices??[];
        if(!source.length)return null;
        if(currentState.language==='zh-HK'){
          const cantonese=source.find((v)=>isCantoneseVoice(v));
          if(cantonese)return cantonese;
          const mandarin=source.find((v)=>isMandarinVoice(v));
          if(mandarin)return mandarin;
        }
        const locale=source.find((v)=>byLangPrefixes([v],speechLangMeta.prefixes).length);
        return locale??source[0]??null;
      };
      const speakNow=()=>{
        if(speakSeq!==calloutSpeakSeq)return;
        const emojiPattern=/[\uD83C-\uDBFF\uDC00-\uDFFF]/g;
        const spokenMsg=msg
          .replace(emojiPattern,'')
          .replace(/\uFE0F/gu,'')
          .replace(/[!!]/g,'')
          .trim();
        const u=new SpeechSynthesisUtterance(spokenMsg||msg.replace(/[!!]/g,''));
        const pack=deps.normalizeCalloutStylePack(calloutStylePack());
        const packRate=pack==='energetic'?0.835:pack==='minimal'?0.56:0.62;
        const femalePitch=pack==='energetic'?1.38:pack==='minimal'?1.18:1.28;
        const malePitch=pack==='energetic'?1.0:pack==='minimal'?0.84:0.92;
        const seatNum=Number(meta?.seat);
        const seatOffset=Number.isFinite(seatNum)?((Math.trunc(seatNum)%4+4)%4)-1.5:0;
        const seatRateOffset=seatOffset*0.01;
        const seatPitchOffset=seatOffset*0.015;
        const basePitch=g==='female'?femalePitch:malePitch;
        u.rate=Math.max(0.55,Math.min(1.2,packRate+seatRateOffset));
        u.pitch=Math.max(0.7,Math.min(1.8,basePitch+seatPitchOffset));
        const voices=synth.getVoices?.()??[];
        let voice=chooseVoice(voices);
        if(!voice&&g==='female'){
          if(currentState.language==='zh-HK'){
            voice=chooseAnyCantonese(voices);
          }else{
            voice=byLangPrefixes(voices,speechLangMeta.prefixes)[0]??null;
          }
          if(!voice&&currentState.language==='en'&&deps.isIOSDevice())voice=voices[0]??null;
          if(!voice)voice=chooseFallbackVoice(voices);
          if(!voice){playCalloutToneFallback();return;}
          u.pitch=Math.max(u.pitch,1.18);
        }else if(!voice){
          if(currentState.language==='zh-HK')voice=chooseAnyCantonese(voices);
          if(deps.isIOSDevice()){
            const localeVoice=voices.find((v)=>byLangPrefixes([v],speechLangMeta.prefixes).length);
            if(!voice)voice=localeVoice??(currentState.language==='en'?(voices[0]??null):null);
          }
          if(!voice)voice=chooseFallbackVoice(voices);
          if(!voice){playCalloutToneFallback();return;}
        }
        const estimatedMs=Math.max(120,Math.min(420,Math.round((msg.length*62)/Math.max(0.55,u.rate))));
        calloutSpeechActive=true;
        calloutSpeechUntil=Date.now()+estimatedMs;
        u.onend=()=>{if(speakSeq!==calloutSpeakSeq)return;calloutSpeechActive=false;calloutSpeechUntil=0;calloutSpeechEndedAt=Date.now();calloutResumePending=true;deps.maybeRunSoloAi();};
        u.onerror=()=>{if(speakSeq!==calloutSpeakSeq)return;calloutSpeechActive=false;calloutSpeechUntil=0;calloutSpeechEndedAt=Date.now();calloutResumePending=true;deps.maybeRunSoloAi();};
        u.voice=voice;
        u.lang=String(voice.lang||speechLangMeta.tts);
        synth.resume?.();
        synth.speak(u);
      };
      const speakTts=()=>{
        const trySpeakWithVoices=(attempt=0)=>{
          if(speakSeq!==calloutSpeakSeq)return;
          const voices=synth.getVoices?.()??[];
          if(voices.length){
            speechPrimed=true;
            speakNow();
            return;
          }
          if(attempt>=4){
            speechPrimed=true;
            speakNow();
            return;
          }
          const retryDelay=attempt===0?120:attempt===1?280:attempt===2?520:900;
          setTimeout(()=>{trySpeakWithVoices(attempt+1);},retryDelay);
        };
        const onVoices=()=>{
          if(speakSeq!==calloutSpeakSeq)return;
          speechPrimed=true;
          speakNow();
        };
        const voices=synth.getVoices?.()??[];
        if(!voices.length){
          synth.addEventListener('voiceschanged',onVoices,{once:true});
          synth.resume?.();
          trySpeakWithVoices(0);
          return;
        }
        speechPrimed=true;
        speakNow();
      };
      const voices=synth.getVoices?.()??[];
      if(forceExactTts){
        speakTts();
        return;
      }
      if(!voices.length){
        if(useRecorded&&voiceMode==='auto'&&recordedMatchesText){
          void tryRecorded().then((ok)=>{if(!ok)speakTts();});
        }else{
          speakTts();
        }
        return;
      }
      if(useRecorded&&voiceMode==='auto'&&recordedMatchesText){
        void tryRecorded().then((ok)=>{if(!ok)speakTts();});
      }else{
        speakTts();
      }
    }catch{}
  }

  async function playWinnerCallout(wc,gender='male',seat=0){
    if(!wc||!wc.text)return;
    if(calloutVoiceMode()==='off')return;
    const currentState=state();
    const ttsOnlyLang=!(currentState.language==='zh-HK'||currentState.language==='en');
    const clipKey=wc.repeat?'winner-repeat':'winner';
    if(ttsOnlyLang){
      speakCallout(wc.text,gender,{clipKey,seat});
      return;
    }
    const speakSeq=++calloutSpeakSeq;
    const ok=await playRecordedCalloutClip(clipKey,gender,speakSeq);
    if(!ok)return;
  }

  function forceReleaseStale(now=Date.now()){
    if(calloutSpeechActive&&calloutSpeechUntil>0&&now>calloutSpeechUntil+800){
      calloutSpeechActive=false;
      calloutSpeechUntil=0;
      calloutSpeechEndedAt=now;
      try{window.speechSynthesis?.cancel?.();}catch{}
    }
  }

  function consumeResumePending(){
    const afterCallout=calloutResumePending;
    if(afterCallout)calloutResumePending=false;
    return afterCallout;
  }

  function primeSpeech(){
    try{
      if(deps.isIOSDevice())return;
      const synth=window.speechSynthesis;
      if(!synth)return;
      synth.getVoices?.();
      speechPrimed=true;
    }catch{}
  }

  function primeHtmlAudioIfNeeded(){
    try{
      if(!deps.isIOSDevice())return;
      const a=ensureIosSharedAudio();
      if(!a.src)a.src=deps.withBase('audio/silence.mp3');
      const prevVolume=Number.isFinite(a.volume)?a.volume:1;
      a.muted=false;
      a.volume=0;
      const p=a.play?.();
      if(p?.then){
        p.then(()=>{
          try{a.pause?.();a.currentTime=0;}catch{}
          a.volume=prevVolume;
        }).catch(()=>{a.volume=prevVolume;});
      }else{
        a.volume=prevVolume;
      }
    }catch{}
  }

  function markInterrupted(now=Date.now()){
    calloutSpeechActive=false;
    calloutSpeechUntil=0;
    calloutSpeechEndedAt=now;
    calloutResumePending=false;
  }

  function currentSfxDuckFactor(){
    const now=Date.now();
    return (calloutSpeechActive||now<calloutSpeechUntil+250)?0.45:1;
  }

  return{
    consumeResumePending,
    currentSfxDuckFactor,
    forceReleaseStale,
    getSpeechUntil:()=>calloutSpeechUntil,
    isSpeechActive:()=>calloutSpeechActive,
    markInterrupted,
    playWinnerCallout,
    primeHtmlAudioIfNeeded,
    primeSpeech,
    resetPlaybackState,
    speakCallout
  };
}

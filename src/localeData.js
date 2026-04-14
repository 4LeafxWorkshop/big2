export const KIND={
  'zh-HK':{single:'單張',pair:'一對',triple:'三條',straight:'蛇',flush:'花',fullhouse:'俘佬',fourofkind:'四條',straightflush:'同花順'},
  en:{single:'Single',pair:'Pair',triple:'Triple',straight:'Straight',flush:'Flush',fullhouse:'Full House',fourofkind:'Four Kind',straightflush:'Straight Flush'},
  fr:{single:'Carte',pair:'Paire',triple:'Brelan',straight:'Suite',flush:'Couleur',fullhouse:'Full',fourofkind:'Carré',straightflush:'Quinte flush'},
  de:{single:'Einzel',pair:'Paar',triple:'Drilling',straight:'Straße',flush:'Farbe',fullhouse:'Full House',fourofkind:'Vierling',straightflush:'Straight Flush'},
  es:{single:'Carta',pair:'Pareja',triple:'Trío',straight:'Escalera',flush:'Color',fullhouse:'Full',fourofkind:'Póker',straightflush:'Escalera de color'},
  ja:{single:'1枚',pair:'ペア',triple:'トリプル',straight:'ストレート',flush:'フラッシュ',fullhouse:'フルハウス',fourofkind:'フォーカード',straightflush:'ストレートフラッシュ'}
};

export const LANGUAGE_OPTIONS=[
  {value:'zh-HK',labelKey:'zh'},
  {value:'en',labelKey:'en'},
  {value:'fr',labelKey:'fr'},
  {value:'de',labelKey:'de'},
  {value:'es',labelKey:'es'},
  {value:'ja',labelKey:'ja'}
];

export const LANGUAGE_NATIVE_LABEL={
  'zh-HK':'繁體中文',
  en:'English',
  fr:'Français',
  de:'Deutsch',
  es:'Español',
  ja:'日本語'
};

export const CALLOUT_RESPONSE_TEXT={
  'zh-HK':{
    pass:['大','唔跟','唔去','過','Pass!'],
    last:[
      '最後一張！',
      '淨翻一張！',
      '埋門一腳！',
      '準備找數💰',
      'Last Card!'
    ],
    play:[
      (kind)=>`${kind}！`,
      (kind)=>`跟！${kind}`,
      (kind)=>`${kind}，頂住。`,
      (kind)=>`${kind}，大你少少😏`,
      (kind)=>`${kind}，大過你😏`
    ],
    winner:[
      '\u591A\u8B1D\u6652\u3002',
      '\u904B\u6C23\u597D\u5230\u5187\u670B\u53CB\uD83D\uDE43',
      '\u4ECA\u65E5\u624B\u6C23\u5E7E\u9806\u3002',
      '\u8D0F\u7FFB\u676F\u5976\u8336\u2615',
      '\u4ECA\u92EA\u6211\u8D0F\uff01',
      '\u884C\u904B\u884C\u5230\u8173\u8DBE\u5C3E'
    ],
    winnerRepeat:'\u5514\u597D\u610F\u601D\uff0c\u53C8\u4FC2\u6211\u3002'
  },
  en:{
    pass:['Pass','No beat','I pass','Pass this round'],
    last:['Last card!','One card left!','Final card!','Get ready to pay up 💰','Last card, watch it 😉'],
    play:[
      (kind)=>`${kind}!`,
      (kind)=>`${kind}. Beat that.`,
      (kind)=>`${kind}. Holding.`,
      (kind)=>`${kind}, higher.`
    ],
    winner:[
      'Thanks a lot.',
      'Just got lucky.',
      'My luck is pretty good today.',
      'Won back bubble tea ☕',
      'This round is mine!',
      'Lucky down to my toes.'
    ],
    winnerRepeat:'Sorry, me again.'
  },
  fr:{
    pass:['Je passe','Passe','À toi'],
    last:['Dernière carte !','Une carte !'],
    play:[
      (kind)=>`${kind} !`,
      (kind)=>`${kind}. À toi.`,
      (kind)=>`${kind}.`
    ],
    winner:['Bien joué.','Coup de chance.','Cette manche est à moi !'],
    winnerRepeat:'Encore moi.'
  },
  de:{
    pass:['Ich passe','Passe','Du bist dran'],
    last:['Letzte Karte!','Nur noch eine!'],
    play:[
      (kind)=>`${kind}!`,
      (kind)=>`${kind}. Dein Zug.`,
      (kind)=>`${kind}.`
    ],
    winner:['Gut gespielt.','Glück gehabt.','Diese Runde gehört mir!'],
    winnerRepeat:'Schon wieder ich.'
  },
  es:{
    pass:['Paso','No voy','Te toca'],
    last:['¡Última carta!','¡Una carta!'],
    play:[
      (kind)=>`¡${kind}!`,
      (kind)=>`${kind}. Tu turno.`,
      (kind)=>`${kind}.`
    ],
    winner:['Bien jugado.','Solo suerte.','¡Esta ronda es mía!'],
    winnerRepeat:'Otra vez yo.'
  },
  ja:{
    pass:['パス','出せない','あなたの番'],
    last:['ラストカード！','残り1枚！'],
    play:[
      (kind)=>`${kind}！`,
      (kind)=>`${kind}、どうぞ。`,
      (kind)=>`${kind}。`
    ],
    winner:['いい勝負でした。','運が良かった。','このラウンドは私の勝ち！'],
    winnerRepeat:'また私ですね。'
  }
};

export const BACK_OPTIONS=[
  {value:'blue',file:'back-blue.png',preview:'back-blue-sm.png',label:{'zh-HK':'藍色',en:'Blue',fr:'Bleu',de:'Blau',es:'Azul',ja:'青'}},
  {value:'red',file:'back-red.png',preview:'back-red-sm.png',label:{'zh-HK':'紅色',en:'Red',fr:'Rouge',de:'Rot',es:'Rojo',ja:'赤'}},
  {value:'green',file:'back-green.png',preview:'back-green-sm.png',label:{'zh-HK':'綠色',en:'Green',fr:'Vert',de:'Grün',es:'Verde',ja:'緑'}},
  {value:'gold',file:'back-gold.png',preview:'back-gold-sm.png',label:{'zh-HK':'金色',en:'Gold',fr:'Or',de:'Gold',es:'Oro',ja:'金'}},
  {value:'silver',file:'back-silver.png',preview:'back-silver-sm.png',label:{'zh-HK':'銀色',en:'Silver',fr:'Argent',de:'Silber',es:'Plata',ja:'銀'}},
  {value:'purple',file:'back-purple.png',preview:'back-purple-sm.png',label:{'zh-HK':'紫色',en:'Purple',fr:'Violet',de:'Lila',es:'Morado',ja:'紫'}}
];

export function getScoreGuideText(language){
  if(language==='en'){
    return{
      close:'Close',
      headingDesc:'At round end, each loser is deducted based on remaining cards, then multiplied by penalty conditions. The winner receives the total deductions from all losers.',
      baseTitle:'Base Scoring',
      mulTitle:'Multiplier Penalties',
      summary:'Per-loser deduction formula: Base deduction x total multiplier. The winner gains the combined deductions from all losing players.',
      tableHeaders:['Remaining Cards','Base Multiplier','Base Deduction'],
      tableRows:[
        ['1-9','x1','remaining cards x1'],
        ['10-12','x2','remaining cards x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Condition','Multiplier','Rule'],
      chaoTableHeaders:['Remaining Cards','Multiplier','Name'],
      chaoTableRows:[
        ['8-9','x2','Chao Two'],
        ['10-11','x3','Chao Three'],
        ['12','x4','Chao Four'],
        ['13','x5','Big Chao']
      ],
      anyTwo:'Holding any 2 card (♦️2/♣️2/♥️2/♠️2) applies x2.',
      twoPenalty:'Holding ♠️Spade 2 (2-penalty) applies an additional x2.',
      stack:'If multiple conditions apply, multipliers stack (multiply together).',
      scoringOrderTitle:'Scoring Order',
      scoringOrder:[
        'Calculate each loser’s base deduction from remaining cards.',
        'Apply 2 / ♠2 multipliers and stack them when multiple conditions apply.',
        'Apply chao multipliers according to the loser’s remaining-card count.',
        'Apply Play big: when the next player has only 1 card, the previous player must play the strongest card or strongest legal response in hand. If they fail to play big and the next player wins, that player also pays the deductions owed by the other two losers.'
      ],
      playBigRule:'Apply Play big: when the next player has only 1 card, the previous player must play the strongest card or strongest legal response in hand. If they fail to play big and the next player wins, that player also pays the deductions owed by the other two losers.'
    };
  }
  if(language==='fr'){
    return{
      close:'Fermer',
      headingDesc:'En fin de manche, chaque perdant est pénalisé selon ses cartes restantes puis multiplié par les conditions. Le gagnant reçoit la somme totale.',
      baseTitle:'Score de base',
      mulTitle:'Multiplicateurs',
      summary:'Formule : déduction de base x multiplicateur total. Le gagnant reçoit la somme des déductions.',
      tableHeaders:['Cartes restantes','Multiplicateur','Déduction'],
      tableRows:[
        ['1-9','x1','cartes restantes x1'],
        ['10-12','x2','cartes restantes x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Condition','Multiplicateur','Règle'],
      chaoTableHeaders:['Cartes restantes','Multiplicateur','Nom'],
      chaoTableRows:[
        ['8-9','x2','Chao deux'],
        ['10-11','x3','Chao trois'],
        ['12','x4','Chao quatre'],
        ['13','x5','Grand chao']
      ],
      anyTwo:'Avoir un 2 (♦️2/♣️2/♥️2/♠️2) applique x2.',
      twoPenalty:'Avoir le ♠️2 (pénalité 2) ajoute un x2.',
      stack:'Si plusieurs conditions s’appliquent, les multiplicateurs se cumulent.',
      scoringOrderTitle:'Ordre de calcul',
      scoringOrder:[
        'Calculez la déduction de base de chaque perdant selon ses cartes restantes.',
        'Appliquez les multiplicateurs 2 / ♠2 et cumulez-les si plusieurs conditions s’appliquent.',
        'Appliquez les multiplicateurs chao selon le nombre de cartes restantes du perdant.',
        'Appliquez Joue grand : quand le joueur suivant n’a plus qu’une carte, le joueur précédent doit jouer sa carte la plus forte ou sa meilleure réponse légale. S’il ne le fait pas et que le joueur suivant gagne, il paie aussi les pertes des deux autres perdants.'
      ],
      playBigRule:'Appliquez Joue grand : quand le joueur suivant n’a plus qu’une carte, le joueur précédent doit jouer sa carte la plus forte ou sa meilleure réponse légale. S’il ne le fait pas et que le joueur suivant gagne, il paie aussi les pertes des deux autres perdants.'
    };
  }
  if(language==='de'){
    return{
      close:'Schließen',
      headingDesc:'Am Rundenende wird jeder Verlierer nach Restkarten abgezogen und mit Bedingungen multipliziert. Der Gewinner erhält die Summe.',
      baseTitle:'Grundwertung',
      mulTitle:'Multiplikatoren',
      summary:'Formel: Grundabzug x Gesamt‑Multiplikator. Der Gewinner erhält die Summe der Abzüge.',
      tableHeaders:['Restkarten','Multiplikator','Abzug'],
      tableRows:[
        ['1-9','x1','Restkarten x1'],
        ['10-12','x2','Restkarten x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Bedingung','Multiplikator','Regel'],
      chaoTableHeaders:['Restkarten','Multiplikator','Name'],
      chaoTableRows:[
        ['8-9','x2','Doppelt'],
        ['10-11','x3','Dreifach'],
        ['12','x4','Vierfach'],
        ['13','x5','Groß']
      ],
      anyTwo:'Ein 2 (♦️2/♣️2/♥️2/♠️2) ergibt x2.',
      twoPenalty:'Ein ♠️2 (2-Strafe) gibt zusätzlich x2.',
      stack:'Mehrere Bedingungen werden multipliziert.',
      scoringOrderTitle:'Wertungsreihenfolge',
      scoringOrder:[
        'Berechne den Grundabzug jedes Verlierers aus seinen Restkarten.',
        'Wende 2- / ♠2-Multiplikatoren an und multipliziere sie, wenn mehrere Bedingungen gelten.',
        'Wende Chao-Multiplikatoren nach der Restkartenzahl des Verlierers an.',
        'Wende Größte Karte an: Hat der nächste Spieler nur noch 1 Karte, muss der vorherige Spieler seine stärkste Karte oder stärkste legale Antwort spielen. Tut er das nicht und der nächste Spieler gewinnt, übernimmt er auch die Abzüge der beiden anderen Verlierer.'
      ],
      playBigRule:'Wende Größte Karte an: Hat der nächste Spieler nur noch 1 Karte, muss der vorherige Spieler seine stärkste Karte oder stärkste legale Antwort spielen. Tut er das nicht und der nächste Spieler gewinnt, übernimmt er auch die Abzüge der beiden anderen Verlierer.'
    };
  }
  if(language==='es'){
    return{
      close:'Cerrar',
      headingDesc:'Al final de la ronda, cada perdedor pierde según cartas restantes y se multiplica por condiciones. El ganador recibe la suma.',
      baseTitle:'Puntuación base',
      mulTitle:'Multiplicadores',
      summary:'Fórmula: deducción base x multiplicador total. El ganador recibe la suma de deducciones.',
      tableHeaders:['Cartas restantes','Multiplicador','Deducción'],
      tableRows:[
        ['1-9','x1','cartas restantes x1'],
        ['10-12','x2','cartas restantes x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Condición','Multiplicador','Regla'],
      chaoTableHeaders:['Cartas restantes','Multiplicador','Nombre'],
      chaoTableRows:[
        ['8-9','x2','Chao dos'],
        ['10-11','x3','Chao tres'],
        ['12','x4','Chao cuatro'],
        ['13','x5','Chao grande']
      ],
      anyTwo:'Tener un 2 (♦️2/♣️2/♥️2/♠️2) aplica x2.',
      twoPenalty:'Tener el ♠️2 (penalización 2) añade x2.',
      stack:'Si se cumplen varias condiciones, los multiplicadores se acumulan.',
      scoringOrderTitle:'Orden de puntuación',
      scoringOrder:[
        'Calcula la deducción base de cada perdedor según sus cartas restantes.',
        'Aplica los multiplicadores de 2 / ♠2 y acumúlalos si hay varias condiciones.',
        'Aplica los multiplicadores chao según las cartas restantes del perdedor.',
        'Aplica Carta Alta: cuando el siguiente jugador solo tiene 1 carta, el jugador anterior debe jugar su carta más fuerte o su mejor respuesta legal. Si no lo hace y el siguiente jugador gana, también paga las deducciones de los otros dos perdedores.'
      ],
      playBigRule:'Aplica Carta Alta: cuando el siguiente jugador solo tiene 1 carta, el jugador anterior debe jugar su carta más fuerte o su mejor respuesta legal. Si no lo hace y el siguiente jugador gana, también paga las deducciones de los otros dos perdedores.'
    };
  }
  if(language==='ja'){
    return{
      close:'閉じる',
      headingDesc:'ラウンド終了時、各敗者は残り枚数に応じた基本減点にペナルティ倍率を掛けます。勝者は全敗者の合計減点を得ます。',
      baseTitle:'基本得点',
      mulTitle:'倍率ペナルティ',
      summary:'各敗者の減点：基本減点 x 総倍率。勝者は全敗者の合計減点を獲得します。',
      tableHeaders:['残り枚数','基本倍率','基本減点'],
      tableRows:[
        ['1-9','x1','残り枚数 x1'],
        ['10-12','x2','残り枚数 x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['条件','倍率','ルール'],
      chaoTableHeaders:['残り枚数','倍率','名称'],
      chaoTableRows:[
        ['8-9','x2','チャオ2'],
        ['10-11','x3','チャオ3'],
        ['12','x4','チャオ4'],
        ['13','x5','ビッグ・チャオ']
      ],
      anyTwo:'2（♦️2/♣️2/♥️2/♠️2）を所持していると x2。',
      twoPenalty:'♠️2（2ペナルティ）を所持していると追加で x2。',
      stack:'複数条件が当てはまる場合、倍率は掛け合わせます。',
      scoringOrderTitle:'計算順序',
      scoringOrder:[
        '各敗者の残り枚数から基本減点を計算します。',
        '2 / ♠2 の倍率を適用し、複数条件があれば掛け合わせます。',
        '敗者の残り枚数に応じてチャオ倍率を適用します。',
        '大を出せを適用します：次のプレイヤーが残り1枚のとき、前のプレイヤーは手札の最強カードまたは最強の合法手を出す必要があります。出さずに次のプレイヤーが勝った場合、そのプレイヤーは他の2人の敗者分の減点も負担します。'
      ],
      playBigRule:'大を出せを適用します：次のプレイヤーが残り1枚のとき、前のプレイヤーは手札の最強カードまたは最強の合法手を出す必要があります。出さずに次のプレイヤーが勝った場合、そのプレイヤーは他の2人の敗者分の減点も負担します。'
    };
  }
  return{
    close:'關閉',
    headingDesc:'每局結算時，先按各輸家剩餘張數計算基本扣分，再套用加乘罰則；最後由贏家獲得所有輸家扣分總和。',
    baseTitle:'基本計分',
    mulTitle:'加乘罰則',
    summary:'每位輸家扣分公式：基本扣分 x 總加乘倍數；贏家加分為所有輸家扣分總和。',
    tableHeaders:['剩餘張數','基本倍數','基本扣分'],
    tableRows:[
      ['1-9 張','x1','按剩餘張數 x1'],
      ['10-12 張','x2','按剩餘張數 x2'],
      ['13 張','x3','13 x3']
    ],
    mulTableHeaders:['條件','倍率','說明'],
    chaoTableHeaders:['剩餘張數','倍率','稱呼'],
    chaoTableRows:[
      ['8-9張','x2','雙炒'],
      ['10-11','x3','三炒'],
      ['12','x4','四炒'],
      ['13張','x5','大炒']
    ],
    anyTwo:'持有任何 2（♦️2/♣️2/♥️2/♠️2）會套用 x2。',
    twoPenalty:'持有 ♠️2（2罰則）會額外再套用 x2。',
    stack:'同時符合多個條件時，倍率會疊乘（相乘計算）。',
    scoringOrderTitle:'計分次序',
    scoringOrder:[
      '先按每位輸家剩餘手牌計算基本扣分。',
      '如輸家剩餘手牌包含任何 2，套用 x2；若同時持有 ♠2，額外再套用 2罰則 x2。多個倍率會疊乘。',
      '按輸家剩餘張數套用炒的倍率。',
      '套用頂大：當下家只剩下一張牌時，上家必須打出手上最大的牌。若玩家沒頂大而讓下家勝出的話，則該玩家必須兼負其餘兩家所輸的分數。'
    ],
    playBigRule:'套用頂大：當下家只剩下一張牌時，上家必須打出手上最大的牌。若玩家沒頂大而讓下家勝出的話，則該玩家必須兼負其餘兩家所輸的分數。'
  };
}

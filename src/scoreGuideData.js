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
      topTwo:'Holding ♠️Spade 2 (top 2) applies an additional x2.',
      stack:'If multiple conditions apply, multipliers stack (multiply together).'
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
      topTwo:'Avoir le ♠️2 (top 2) ajoute un x2.',
      stack:'Si plusieurs conditions s’appliquent, les multiplicateurs se cumulent.'
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
      topTwo:'Ein ♠️2 (Top 2) gibt zusätzlich x2.',
      stack:'Mehrere Bedingungen werden multipliziert.'
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
      topTwo:'Tener el ♠️2 (top 2) añade x2.',
      stack:'Si se cumplen varias condiciones, los multiplicadores se acumulan.'
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
      topTwo:'♠️2（トップ2）を所持していると追加で x2。',
      stack:'複数条件が当てはまる場合、倍率は掛け合わせます。'
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
    anyTwo:'持有任意 2（♦️2/♣️2/♥️2/♠️2）會套用 x2。',
    topTwo:'持有 ♠️2（頂大）會額外再套用 x2。',
    stack:'同時符合多個條件時，倍率會疊乘（相乘計算）。'
  };
}

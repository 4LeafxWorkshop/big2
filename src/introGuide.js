export function createIntroGuideHelpers(deps){
  const {
    getLanguage,
    renderIntroPanel,
    renderCoachMarksPanel,
    colorizeSuitText,
    esc,
    withBase,
    t,
    renderStaticCard,
    ranks,
    suits,
    isGestureHelpEnabled=()=>false,
  }=deps;

  function introText(){
    const lang=getLanguage();
    if(lang==='en'){
      return{
        btnShow:'Guide',
        btnHide:'Close',
        panelTitle:'Guide',
        panelSub:'Official quick reference covering core rules, hand hierarchy, opening flow, and practical table strategy.',
        historyTitle:'Background',
        historyBody:'Big Two (Cho Dai Di) is a four-player shedding card game using a standard 52-card deck without jokers. Each player receives 13 cards, and the objective is to empty your hand before all opponents. The game is known for high decision density, compact round duration, and strong strategic interaction between tempo control, hand preservation, and timing of power cards.',
        playTitle:'Gameplay Highlights',
        playList:[
          'Opening lead of the first round must contain {{3D}}.',
          'Follow play must match card count: single, pair, triple, or 5-card hand.',
          'Five-card hierarchy: Straight < Flush < Full House < Four of a Kind < Straight Flush.',
          'For equal ranks, suit order is ♦️ < ♣️ < ♥️ < ♠️.',
          'Single-card order: 2 > A > K > ... > 3 (highest: ♠️Spade 2, lowest: ♦️3).',
          'After three consecutive passes, initiative returns to the last successful player.',
          'When you hold initiative, choose a tempo that preserves control and blocks opponent exits.'
        ],
        flowTitle:'Opening Flow',
        flowList:[
          'Deal 13 cards to each of the 4 players.',
          'The player holding {{3D}} must open the first trick.',
          'Other players either beat with matching card count or pass.',
          'After three passes, the previous winning play resets the lead.',
          'Round ends immediately when one player plays all cards.'
        ],
        guideHowTitle:'How to Play',
        guideHowIntro:'Quick start steps to begin a match:',
        guideHowList:[
          'Sign in to enable room play and leaderboard tracking.',
          'From Home, choose Solo or enter the Lobby to create/join a room.',
          'In a room, the host can press Start when at least 2 players are inside.',
          'On your turn, select cards and tap Play; tap Pass when allowed.',
          'Use Suggest for help, and sort/drag to organize your hand.'
        ],
        guideGestureTitle:'Gesture Controls',
        guideGestureIntro:'Mobile game gestures:',
        guideGestureList:[
          'Swipe up on the table to open the game log.',
          'Swipe right to request a recommendation.',
          'Swipe down to trigger the food callout.',
          'Swipe left to open the emote picker.',
          'Swipe up on selected cards to discard them.'
        ],
        guideHomeTitle:'Add to Home Screen',
        guideHomeIntro:'Add it to your Home screen for a full-screen, app-like launch.',
        guideAndroidTitle:'Android (Chrome)',
        guideAndroidSteps:[
          'Open this site in Chrome.',
          'Tap the three-dot menu.',
          'Select Add to Home screen.',
          'Confirm the name and tap Add.'
        ],
        guideIosTitle:'iPhone / iPad (Safari)',
        guideIosSteps:[
          'Open this site in Safari.',
          'Tap Share (square with an up arrow).',
          'Choose Add to Home Screen.',
          'Confirm the name and tap Add.'
        ],
        guideHomeNotes:'If you do not see the option, make sure you are using Safari/Chrome rather than an in-app browser.',
        howTitle:'Hand Types',
        howBody:'To follow, card count must match the active play. For 5-card contests, compare the highest rank first, then the next ranks in order, and only use suit as the final tiebreaker.',
        howList:[]
      };
    }
    if(lang==='fr'){
      return{
        btnShow:'Guide',
        btnHide:'Fermer',
        panelTitle:'Guide',
        panelSub:'Référence rapide officielle : règles clés, hiérarchie des mains, ouverture et stratégie de table.',
        historyTitle:'Contexte',
        historyBody:'Big Two (Cho Dai Di) est un jeu de défausse à 4 joueurs, joué avec un jeu standard de 52 cartes sans jokers. Chaque joueur reçoit 13 cartes et l’objectif est de vider sa main avant les autres. Le jeu est connu pour sa densité de décisions, ses manches rapides et l’interaction stratégique entre le contrôle du tempo, la conservation des cartes fortes et le timing.',
        playTitle:'Points clés',
        playList:[
          'La première sortie du premier tour doit contenir {{3D}}.',
          'Pour suivre, le nombre de cartes doit correspondre : simple, paire, brelan ou 5 cartes.',
          'Hiérarchie des 5 cartes : Suite < Couleur < Full House < Carré < Quinte flush.',
          'À rang égal, l’ordre des couleurs est ♦️ < ♣️ < ♥️ < ♠️.',
          'Ordre des cartes simples : 2 > A > K > ... > 3 (max : ♠️2, min : ♦️3).',
          'Après trois passes consécutives, l’initiative revient au dernier joueur ayant joué.',
          'Avec l’initiative, choisissez un tempo qui garde le contrôle et bloque les sorties adverses.'
        ],
        flowTitle:'Déroulement initial',
        flowList:[
          'Distribuer 13 cartes à chacun des 4 joueurs.',
          'Le joueur qui a {{3D}} ouvre la première levée.',
          'Les autres jouent la même quantité ou passent.',
          'Après trois passes, le dernier jeu valide reprend la main.',
          'La manche se termine quand un joueur n’a plus de cartes.'
        ],
        guideHowTitle:'Comment jouer',
        guideHowIntro:'Étapes rapides pour démarrer :',
        guideHowList:[
          'Connectez-vous pour activer les salles et le classement.',
          'Depuis l’accueil, choisissez Solo ou entrez dans le Lobby pour créer/rejoindre.',
          'Dans une salle, l’hôte lance dès que 2 joueurs sont présents.',
          'À votre tour, sélectionnez des cartes puis Jouer ; Passez si autorisé.',
          'Utilisez Suggestion et triez/drag pour organiser votre main.'
        ],
        guideGestureTitle:'Gestes',
        guideGestureIntro:'Gestes de jeu sur mobile :',
        guideGestureList:[
          'Glissez vers le haut sur la table pour ouvrir le journal de partie.',
          'Glissez vers la droite pour demander une recommandation.',
          'Glissez vers le bas pour déclencher l’appel nourriture.',
          'Glissez vers la gauche pour ouvrir le sélecteur d’emotes.',
          'Glissez vers le haut sur les cartes sélectionnées pour les défausser.'
        ],
        guideHomeTitle:'Ajouter à l’écran d’accueil',
        guideHomeIntro:'Ajoutez l’app pour un lancement plein écran, comme une application.',
        guideAndroidTitle:'Android (Chrome)',
        guideAndroidSteps:[
          'Ouvrez ce site dans Chrome.',
          'Appuyez sur le menu à trois points.',
          'Choisissez Ajouter à l’écran d’accueil.',
          'Confirmez le nom puis Ajouter.'
        ],
        guideIosTitle:'iPhone / iPad (Safari)',
        guideIosSteps:[
          'Ouvrez ce site dans Safari.',
          'Appuyez sur Partager (carré avec flèche).',
          'Choisissez Sur l’écran d’accueil.',
          'Confirmez le nom puis Ajouter.'
        ],
        guideHomeNotes:'Si l’option n’apparaît pas, utilisez Safari/Chrome plutôt qu’un navigateur intégré.',
        howTitle:'Types de mains',
        howBody:'Pour suivre, le nombre de cartes doit correspondre. En 5 cartes, comparez d’abord la plus haute carte, puis les suivantes dans l’ordre, et ne départagez par la couleur qu’en dernier.',
        howList:[]
      };
    }
    if(lang==='de'){
      return{
        btnShow:'Guide',
        btnHide:'Schließen',
        panelTitle:'Guide',
        panelSub:'Offizielle Kurzübersicht: Regeln, Hand-Rangfolge, Startablauf und Taktik.',
        historyTitle:'Hintergrund',
        historyBody:'Big Two (Cho Dai Di) ist ein 4‑Spieler‑Ausstiegsspiel mit einem 52‑Karten‑Deck ohne Joker. Jeder erhält 13 Karten; Ziel ist, die eigene Hand zuerst zu leeren. Das Spiel ist bekannt für hohe Entscheidungsdichte, kurze Runden und starke strategische Wechselwirkung zwischen Tempo, Kartenmanagement und Timing starker Karten.',
        playTitle:'Spiel-Highlights',
        playList:[
          'Der Eröffnungszug der ersten Runde muss {{3D}} enthalten.',
          'Nachspielen muss die Kartenanzahl treffen: Einzel, Paar, Drilling oder 5‑Karten‑Hand.',
          '5‑Karten‑Hierarchie: Straße < Farbe < Full House < Vierling < Straight Flush.',
          'Bei gleichem Rang gilt die Farb-Reihenfolge ♦️ < ♣️ < ♥️ < ♠️.',
          'Einzelkarten-Rang: 2 > A > K > ... > 3 (höchste: ♠️2, niedrigste: ♦️3).',
          'Nach drei Pässen in Folge geht die Initiative an den letzten Gewinner zurück.',
          'Mit Initiative wähle ein Tempo, das Kontrolle hält und Ausstiege blockiert.'
        ],
        flowTitle:'Startablauf',
        flowList:[
          '13 Karten an jeden der 4 Spieler verteilen.',
          'Der Spieler mit {{3D}} eröffnet den ersten Stich.',
          'Andere überbieten mit gleicher Kartenanzahl oder passen.',
          'Nach drei Pässen setzt der letzte gültige Zug die Führung fort.',
          'Die Runde endet sofort, wenn ein Spieler alle Karten gespielt hat.'
        ],
        guideHowTitle:'So spielst du',
        guideHowIntro:'Schnellstart in 5 Schritten:',
        guideHowList:[
          'Anmelden, um Räume und Rangliste zu aktivieren.',
          'Im Home Solo wählen oder Lobby öffnen, um Raum zu erstellen/beitreten.',
          'Im Raum kann der Host starten, sobald mindestens 2 Spieler drin sind.',
          'Im Zug Karten wählen und Spielen; Passen, wenn erlaubt.',
          'Vorschlag nutzen und per Sortieren/Drag die Hand ordnen.'
        ],
        guideGestureTitle:'Gestensteuerung',
        guideGestureIntro:'Mobile Spielgesten:',
        guideGestureList:[
          'Nach oben über das Spielfeld wischen, um das Spielprotokoll zu öffnen.',
          'Nach rechts wischen, um eine Empfehlung anzufordern.',
          'Nach unten wischen, um den Food-Callout auszulösen.',
          'Nach links wischen, um die Emote-Auswahl zu öffnen.',
          'Nach oben über ausgewählte Karten wischen, um sie abzulegen.'
        ],
        guideHomeTitle:'Zum Startbildschirm hinzufügen',
        guideHomeIntro:'Füge es zum Startbildschirm hinzu für einen Vollbild‑App‑Start.',
        guideAndroidTitle:'Android (Chrome)',
        guideAndroidSteps:[
          'Diese Seite in Chrome öffnen.',
          'Drei‑Punkte‑Menü tippen.',
          'Zum Startbildschirm hinzufügen auswählen.',
          'Name bestätigen und Hinzufügen.'
        ],
        guideIosTitle:'iPhone / iPad (Safari)',
        guideIosSteps:[
          'Diese Seite in Safari öffnen.',
          'Teilen tippen (Quadrat mit Pfeil).',
          'Zum Home‑Bildschirm wählen.',
          'Name bestätigen und Hinzufügen.'
        ],
        guideHomeNotes:'Falls die Option fehlt, nutze Safari/Chrome statt In‑App‑Browser.',
        howTitle:'Handtypen',
        howBody:'Beim Nachspielen muss die Kartenanzahl passen. Bei 5 Karten zuerst die höchste Karte, dann die weiteren Karten der Reihe nach vergleichen und die Farbe nur als letzten Tiebreaker nutzen.',
        howList:[]
      };
    }
    if(lang==='es'){
      return{
        btnShow:'Guía',
        btnHide:'Cerrar',
        panelTitle:'Guía',
        panelSub:'Referencia rápida oficial: reglas clave, jerarquía de manos, apertura y estrategia.',
        historyTitle:'Contexto',
        historyBody:'Big Two (Cho Dai Di) es un juego de descarte para 4 jugadores con una baraja estándar de 52 cartas sin comodines. Cada jugador recibe 13 cartas y el objetivo es vaciar la mano antes que los demás. Es un juego de alta densidad de decisiones, rondas rápidas y gran interacción estratégica entre control del ritmo, conservación de cartas fuertes y timing.',
        playTitle:'Puntos clave',
        playList:[
          'La primera jugada de la primera ronda debe incluir {{3D}}.',
          'Para responder, la cantidad de cartas debe coincidir: simple, pareja, trío o 5 cartas.',
          'Jerarquía de 5 cartas: Escalera < Color < Full House < Póker < Escalera de color.',
          'A igual rango, el orden de palos es ♦️ < ♣️ < ♥️ < ♠️.',
          'Orden de cartas simples: 2 > A > K > ... > 3 (máxima: ♠️2, mínima: ♦️3).',
          'Tras tres pases seguidos, la iniciativa vuelve al último que jugó.',
          'Con la iniciativa, elige un ritmo que mantenga el control y bloquee salidas.'
        ],
        flowTitle:'Flujo de apertura',
        flowList:[
          'Repartir 13 cartas a cada uno de los 4 jugadores.',
          'El jugador con {{3D}} debe abrir la primera baza.',
          'Los demás superan con la misma cantidad o pasan.',
          'Tras tres pases, el último juego válido reinicia el turno.',
          'La ronda termina en cuanto alguien se queda sin cartas.'
        ],
        guideHowTitle:'Cómo jugar',
        guideHowIntro:'Pasos rápidos para empezar:',
        guideHowList:[
          'Inicia sesión para habilitar salas y ranking.',
          'En Inicio, elige Solo o entra al Lobby para crear/unirte.',
          'En una sala, el anfitrión inicia cuando hay al menos 2 jugadores dentro.',
          'En tu turno, selecciona cartas y pulsa Jugar; Pasa si está permitido.',
          'Usa Sugerir y ordena/arrastra para organizar la mano.'
        ],
        guideGestureTitle:'Gestos',
        guideGestureIntro:'Gestos de juego en móvil:',
        guideGestureList:[
          'Desliza hacia arriba sobre la mesa para abrir el historial de la partida.',
          'Desliza a la derecha para pedir una recomendación.',
          'Desliza hacia abajo para activar el aviso de comida.',
          'Desliza a la izquierda para abrir el selector de emotes.',
          'Desliza hacia arriba sobre las cartas seleccionadas para descartarlas.'
        ],
        guideHomeTitle:'Añadir a la pantalla de inicio',
        guideHomeIntro:'Añádelo a Inicio para abrirlo a pantalla completa como app.',
        guideAndroidTitle:'Android (Chrome)',
        guideAndroidSteps:[
          'Abre este sitio en Chrome.',
          'Toca el menú de tres puntos.',
          'Selecciona Añadir a pantalla de inicio.',
          'Confirma el nombre y pulsa Añadir.'
        ],
        guideIosTitle:'iPhone / iPad (Safari)',
        guideIosSteps:[
          'Abre este sitio en Safari.',
          'Toca Compartir (cuadrado con flecha).',
          'Elige Añadir a pantalla de inicio.',
          'Confirma el nombre y pulsa Añadir.'
        ],
        guideHomeNotes:'Si no aparece la opción, usa Safari/Chrome en lugar de un navegador integrado.',
        howTitle:'Tipos de manos',
        howBody:'Para responder, la cantidad de cartas debe coincidir. En 5 cartas, compara primero la carta más alta, luego las siguientes en orden y usa el palo solo como desempate final.',
        howList:[]
      };
    }
    if(lang==='ja'){
      return{
        btnShow:'ガイド',
        btnHide:'閉じる',
        panelTitle:'ガイド',
        panelSub:'コアルール、役の序列、開局フロー、実戦のセオリーをまとめた公式クイックリファレンス。',
        historyTitle:'概要',
        historyBody:'Big Two（Chō Dai Di）は4人用の出し切り型カードゲームで、ジョーカーなしの標準52枚デッキを使います。各プレイヤーに13枚ずつ配られ、最初に手札を無くした人が勝利です。テンポ管理、強い札の温存、パワーカードのタイミングなど、密度の高い判断が求められるゲームとして知られています。',
        playTitle:'ポイント',
        playList:[
          '最初のラウンドの初手は {{3D}} を含む必要があります。',
          '後出しは同じ枚数で合わせます：単札・ペア・スリー・5枚役。',
          '5枚役の強さ：ストレート < フラッシュ < フルハウス < フォーカード < ストレートフラッシュ。',
          '同ランクの場合、スート順は ♦️ < ♣️ < ♥️ < ♠️。',
          '単札の強さ：2 > A > K > ... > 3（最強：♠️2、最弱：♦️3）。',
          '3人連続パス後、最後に出したプレイヤーが主導権を得ます。',
          '主導権がある時は、テンポと手札温存のバランスで相手の上がりを阻止します。'
        ],
        flowTitle:'開局フロー',
        flowList:[
          '4人に13枚ずつ配ります。',
          '{{3D}} を持つプレイヤーが最初のトリックを開始します。',
          '他のプレイヤーは同じ枚数で上回るかパスします。',
          '3人がパスしたら、直前の勝ち手から再開します。',
          '誰かが手札を出し切った時点でラウンド終了です。'
        ],
        guideHowTitle:'遊び方',
        guideHowIntro:'すぐ始める手順：',
        guideHowList:[
          'サインインしてルーム対戦とランキングを有効にします。',
          'ホームでソロを選ぶか、ロビーからルーム作成/参加します。',
          'ルームでは2人以上でホストが開始できます。',
          '自分の番にカードを選び、プレイをタップ。必要ならパスします。',
          'サジェストで補助し、並び替え/ドラッグで手札を整理します。'
        ],
        guideGestureTitle:'ジェスチャー',
        guideGestureIntro:'モバイルの操作ジェスチャー：',
        guideGestureList:[
          'テーブルを上にスワイプするとゲームログを開きます。',
          '右にスワイプするとおすすめを表示します。',
          '下にスワイプするとフードの吹き出しを出します。',
          '左にスワイプするとエモート選択を開きます。',
          '選択したカードを上にスワイプすると捨てます。'
        ],
        guideHomeTitle:'ホーム画面に追加',
        guideHomeIntro:'ホーム画面に追加すると、アプリのように全画面開起できます。',
        guideAndroidTitle:'Android (Chrome)',
        guideAndroidSteps:[
          'このサイトをChromeで開きます。',
          '右上の三点メニューをタップ。',
          '「ホーム画面に追加」を選択。',
          '名前を確認して追加。'
        ],
        guideIosTitle:'iPhone / iPad (Safari)',
        guideIosSteps:[
          'このサイトをSafariで開きます。',
          '共有（上向き矢印の四角）をタップ。',
          '「ホーム画面に追加」を選択。',
          '名前を確認して追加。'
        ],
        guideHomeNotes:'表示されない場合は、アプリ内ブラウザではなくSafari/Chromeを使用してください。',
        howTitle:'役の種類',
        howBody:'後出しは同じ枚数で合わせる必要があります。5枚勝負では、まず一番高い札、次に続く札を順に比べ、最後の同点判定でだけスートを使います。',
        howList:[]
      };
    }
    return{
      btnShow:'玩法指南',
      btnHide:'關閉',
      panelTitle:'玩法指南',
      panelSub:'提供核心規則、牌型次序、開局流程與實戰節奏的官方速覽。',
      historyTitle:'背景',
      historyBody:'《鋤大D》（Big Two）為四人出清型撲克牌遊戲，使用標準52張牌（不含鬼牌），每位玩家派發13張。玩家的目標是在其他對手之前出清手牌。此遊戲特色在於回合節奏明確、決策密度高，並重視控場、保留關鍵牌與出牌時機的策略取捨。\n\n在香港，《鋤大D》是非常普及的休閒紙牌遊戲，常見於家庭聚會、朋友聚餐及節日活動（例如農曆新年）。許多香港人自小便接觸此遊戲，並在社交場合中用作娛樂和聯誼。遊戲節奏快速且富競技性，因此深受年輕人及成年人歡迎，也逐漸發展出不同地方版本與玩法變化，成為香港流行文化的一部分。',
      playTitle:'玩法重點',
      playList:[
        '首圈開局第一手必須包含 {{3D}}。',
        '跟牌必須跟相同張數：單張／一對／三條／五張牌型。',
        '五張牌型大小：蛇 < 花 < 俘佬 < 四條 < 同花順。',
        '同點數比較花色：♦️< ♣️ < ♥️< ♠️。',
        '單張大小：2 > A > K > ... > 3（最大單張：♠️2；最小單張：♦️3）。',
        '連續三家過牌後，由最後有效出牌者重新話事。',
        '當你話事時，應平衡節奏控制與大牌保留，避免被對手一手出清。'
      ],
      flowTitle:'開局流程',
      flowList:[
        '4 位玩家每人派發 13 張手牌。',
        '持有 {{3D}} 的玩家必須先開第一手。',
        '其餘玩家需以相同張數壓過，或選擇過牌。',
        '連續三家過牌後，回到上一手有效出牌者重新話事。',
        '直至有玩家先出清手牌，該局立即結束。'
      ],
      guideHowTitle:'玩法教學',
      guideHowIntro:'快速上手，以下步驟可完成開局並開始對戰：',
      guideHowList:[
        '登入後可進行房間對戰與排行榜記錄。',
        '主頁選擇「開局」（單人）或進入大堂建立／加入房間。',
        '房主可在至少 2 位玩家進入房間後按「開始」。',
        '輪到你時，選牌後按「出牌」，可過牌時按「過牌」。',
        '需要提示可按「建議」，亦可使用排序或拖曳整理手牌。'
      ],
      guideGestureTitle:'手勢提示',
      guideGestureIntro:'手機遊戲手勢：',
      guideGestureList:[
        '在桌面向上滑動可打開遊戲記錄。',
        '向右滑動可要求推薦出牌。',
        '向下滑動可觸發食物提示。',
        '向左滑動可打開表情選擇。',
        '在已選取的牌上向上滑動即可出牌。'
      ],
      guideHomeTitle:'加到主畫面',
      guideHomeIntro:'加到主畫面後可像 App 一樣全螢幕開啟。',
      guideAndroidTitle:'Android（Chrome）',
      guideAndroidSteps:[
        '用 Chrome 開啟本網站。',
        '點右上角「⋮」選單。',
        '選擇「加到主畫面」。',
        '確認名稱後點「新增」。'
      ],
      guideIosTitle:'iPhone / iPad（Safari）',
      guideIosSteps:[
        '用 Safari 開啟本網站。',
        '點下方「分享」按鈕（方形向上箭頭）。',
        '選擇「加入主畫面」。',
        '確認名稱後點「加入」。'
      ],
      guideHomeNotes:'如看不到相關選項，請確認不是在其他 App 的內置瀏覽器內開啟。',
      howTitle:'牌型',
      howBody:'跟牌時必須符合相同張數。若為五張牌對比，先比較最高點數，再依次比較第2、第3、第4、第5大的點數；只有所有點數都相同時，最後才比花色。',
      howList:[]
    };
  }

  function introHandSamples(){
    const card=(rank,suit)=>{
      const r=ranks.indexOf(rank);
      const s=suits.findIndex((x)=>x.symbol===suit);
      return{rank:Math.max(0,r),suit:Math.max(0,s)};
    };
    const lang=getLanguage();
    if(lang==='en'){
      return[
        {name:'Single',desc:'1 card',cards:[card('A','♠️')]},
        {name:'Pair',desc:'2 same rank',cards:[card('9','♦️'),card('9','♣️')]},
        {name:'Triple',desc:'3 same rank',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
        {name:'Straight (Snake)',desc:'5 consecutive ranks',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
        {name:'Flush (Flower)',desc:'5 same suit',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
        {name:'Full House',desc:'Triple + Pair',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
        {name:'Four of a Kind',desc:'4 same rank + kicker',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
        {name:'Straight Flush',desc:'Same suit + consecutive',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
      ];
    }
    if(lang==='fr'){
      return[
        {name:'Carte',desc:'1 carte',cards:[card('A','♠️')]},
        {name:'Paire',desc:'2 même rang',cards:[card('9','♦️'),card('9','♣️')]},
        {name:'Brelan',desc:'3 même rang',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
        {name:'Suite',desc:'5 rangs consécutifs',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
        {name:'Couleur',desc:'5 même couleur',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
        {name:'Full House',desc:'Brelan + Paire',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
        {name:'Carré',desc:'4 même rang + kicker',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
        {name:'Quinte flush',desc:'Même couleur + suite',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
      ];
    }
    if(lang==='de'){
      return[
        {name:'Einzel',desc:'1 Karte',cards:[card('A','♠️')]},
        {name:'Paar',desc:'2 gleiche Ränge',cards:[card('9','♦️'),card('9','♣️')]},
        {name:'Drilling',desc:'3 gleiche Ränge',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
        {name:'Straße',desc:'5 aufeinanderfolgende Ränge',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
        {name:'Farbe',desc:'5 gleiche Farbe',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
        {name:'Full House',desc:'Drilling + Paar',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
        {name:'Vierling',desc:'4 gleiche Ränge + Beikarte',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
        {name:'Straight Flush',desc:'Gleiche Farbe + Straße',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
      ];
    }
    if(lang==='es'){
      return[
        {name:'Carta',desc:'1 carta',cards:[card('A','♠️')]},
        {name:'Pareja',desc:'2 del mismo rango',cards:[card('9','♦️'),card('9','♣️')]},
        {name:'Trío',desc:'3 del mismo rango',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
        {name:'Escalera',desc:'5 rangos consecutivos',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
        {name:'Color',desc:'5 del mismo palo',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
        {name:'Full House',desc:'Trío + Pareja',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
        {name:'Póker',desc:'4 del mismo rango + kicker',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
        {name:'Escalera de color',desc:'Mismo palo + escalera',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
      ];
    }
    return[
      {name:'單張',desc:'1張牌',cards:[card('A','♠️')]},
      {name:'一對',desc:'2張同點數',cards:[card('9','♦️'),card('9','♣️')]},
      {name:'三條',desc:'3張同點數',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
      {name:'蛇',desc:'5張連續點數',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
      {name:'花',desc:'5張同花色',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
      {name:'俘佬',desc:'三條 + 一對',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
      {name:'四條',desc:'4張同點數 + 腳',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
      {name:'同花順',desc:'同花色 + 連續點數',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
    ];
  }

  function introPanelHtml(){
    return renderIntroPanel({
      intro:introText(),
      language:getLanguage(),
      colorizeSuitText,
      esc,
      withBase,
      appTitle:t('title'),
      renderStaticCard,
      introHandSamples:introHandSamples(),
      showGestureGuide:Boolean(isGestureHelpEnabled?.())
    });
  }

  function coachMarksHtml(){
    return renderCoachMarksPanel({
      intro:introText(),
      esc
    });
  }

  return{
    introText,
    introHandSamples,
    introPanelHtml,
    coachMarksHtml
  };
}

export function createFooterMenuHelpers(deps){
  const {esc,t,withBase,getLanguage}=deps;

  function legalMiniCopy(){
    const lang=getLanguage();
    const zh=lang==='zh-HK';
    const fr=lang==='fr';
    const de=lang==='de';
    const es=lang==='es';
    const ja=lang==='ja';
    const listHtml=(items,ordered=false)=>`${ordered?'<ol>':'<ul>'}${items.map((x)=>`<li>${esc(x)}</li>`).join('')}${ordered?'</ol>':'</ul>'}`;
    const labels=zh
      ?{privacy:'私隱政策',about:'關於我們',contact:'聯絡我們',terms:'使用條款'}
      :fr
        ?{privacy:'Confidentialité',about:'À propos',contact:'Contact',terms:'Conditions'}
        :de
          ?{privacy:'Datenschutz',about:'Über uns',contact:'Kontakt',terms:'Bedingungen'}
          :es
            ?{privacy:'Privacidad',about:'Acerca de',contact:'Contacto',terms:'Términos'}
            :ja
              ?{privacy:'プライバシー',about:'概要',contact:'連絡先',terms:'利用規約'}
              :{privacy:'Privacy',about:'About',contact:'Contact',terms:'Terms'};
    const privacyIntro=zh
      ?'我們重視你的私隱並以最少必要原則處理資料。'
      :fr
        ?'Nous appliquons une collecte minimale pour protéger votre vie privée.'
        :de
          ?'Wir nutzen einen datensparsamen Ansatz zum Schutz deiner Privatsphäre.'
          :es
            ?'Seguimos un enfoque de datos mínimos para proteger tu privacidad.'
            :ja
              ?'プライバシー保護のため、最小限のデータ収集を行います。'
              :'We follow a data-minimal approach to protect your privacy.';
    const privacyCollect=zh
      ?[
        '帳戶資料：顯示名稱、登入電郵',
        '遊戲資料：設定、對戰紀錄、分數與排行榜',
        '技術資料：裝置類型、作業系統、瀏覽器版本、語言、基本錯誤記錄'
      ]
      :fr
        ?[
          'Données de compte : nom d’affichage, e‑mail de connexion',
          'Données de jeu : paramètres, parties, scores, classement',
          'Données techniques : type d’appareil, OS, navigateur, langue, logs d’erreurs basiques'
        ]
        :de
          ?[
            'Kontodaten: Anzeigename, Anmelde‑E‑Mail',
            'Spieldaten: Einstellungen, Spielverläufe, Punkte, Rangliste',
            'Technische Daten: Gerätetyp, OS, Browser, Sprache, einfache Fehlerlogs'
          ]
          :es
            ?[
              'Datos de cuenta: nombre visible, correo de inicio de sesión',
              'Datos de juego: ajustes, partidas, puntuaciones, clasificación',
              'Datos técnicos: tipo de dispositivo, SO, navegador, idioma, registros básicos'
            ]
            :ja
              ?[
                'アカウント情報: 表示名、ログインメール',
                'ゲーム情報: 設定、対戦履歴、スコア、ランキング',
                '技術情報: 端末種別、OS、ブラウザ、言語、基本エラーログ'
              ]
              :[
                'Account data: display name, sign-in email',
                'Game data: settings, match records, scores, leaderboard',
                'Technical data: device type, OS, browser version, language, basic error logs'
              ];
    const privacyUse=zh
      ?[
        '維持登入與偏好設定（Cookies 或同類技術）',
        '遊戲運作、排行榜與統計分析',
        '防止濫用、風險控制與技術維護'
      ]
      :fr
        ?[
          'Maintenir la connexion et les préférences (cookies ou équivalents)',
          'Fonctionnement du jeu, classement et statistiques',
          'Prévention des abus, contrôle des risques et maintenance'
        ]
        :de
          ?[
            'Anmeldung und Einstellungen aufrechterhalten (Cookies o. ä.)',
            'Spielbetrieb, Rangliste und Statistiken',
            'Missbrauchsprävention, Risikokontrolle und Wartung'
          ]
          :es
            ?[
              'Mantener inicio de sesión y preferencias (cookies o similares)',
              'Juego principal, clasificación y estadísticas',
              'Prevención de abuso, control de riesgos y mantenimiento'
            ]
            :ja
              ?[
                'ログインと設定の保持（Cookie等）',
                'ゲーム運営、ランキング、統計',
                '不正防止、リスク管理、保守'
              ]
              :[
                'Maintain sign-in and preferences (cookies or similar)',
                'Core gameplay, leaderboard, and statistics',
                'Abuse prevention, risk control, and maintenance'
              ];
    const privacyNotes=zh
      ?'資料不會出售作第三方行銷用途，並會在合理期限內清理。你可在瀏覽器管理 Cookies；停用後可能影響登入或偏好保存。如需查詢或更正／刪除資料，請透過聯絡方式與我們聯絡。'
      :fr
        ?'Nous ne vendons pas vos données à des tiers et les conservons uniquement le temps nécessaire. Vous pouvez gérer les cookies dans votre navigateur ; leur désactivation peut affecter la connexion ou les préférences. Pour toute question ou demande de correction/suppression, contactez‑nous.'
        :de
          ?'Wir verkaufen keine Daten an Dritte und speichern sie nur so lange wie nötig. Cookies können im Browser verwaltet werden; eine Deaktivierung kann Anmeldung oder Einstellungen beeinträchtigen. Für Auskünfte oder Korrektur/Löschung kontaktiere uns.'
          :es
            ?'No vendemos tus datos a terceros y solo los conservamos el tiempo necesario. Puedes gestionar las cookies en tu navegador; desactivarlas puede afectar el inicio de sesión o las preferencias. Para consultas o corrección/eliminación, contáctanos.'
            :ja
              ?'データは第三者マーケティング目的で販売せず、必要な期間のみ保持します。Cookieはブラウザで管理できますが、無効化するとログインや設定保存に影響する場合があります。お問い合わせや訂正・削除は連絡先からお願いします。'
              :'We do not sell your data for third‑party marketing and retain it only as needed before cleanup. You can manage cookies in your browser; disabling them may affect sign-in or preferences. For questions or correction/removal requests, contact us.';
    const aboutIntro=zh
      ?'《鋤大D（Big Two）》網頁版，專注提供簡潔、順手、跨裝置一致的對局體驗。'
      :fr
        ?'Cette version web de Big Two vise une expérience cohérente sur tous les appareils.'
        :de
          ?'Diese Browser‑Version von Big Two fokussiert auf eine konsistente Geräte‑Erfahrung.'
          :es
            ?'Esta versión web de Big Two se centra en una experiencia consistente entre dispositivos.'
            :ja
              ?'このBig Twoのウェブ版は、デバイス間で一貫した体験を重視しています。'
              :'This browser-based Big Two focuses on consistent play across devices.';
    const aboutList=zh
      ?[
        '支援手機、平板與桌面，開局即玩',
        '提供單人對戰與房間對戰',
        '排行榜、個人設定與成績追蹤',
        '清晰出牌提示、即時狀態與計分明細',
        '房間代碼分享、等待室與即時通知',
        '支援橫向與直向版面，操作一致'
      ]
      :fr
        ?[
          'Démarrage rapide sur mobile, tablette et desktop',
          'Solo et parties en salon',
          'Classement, paramètres personnels, suivi des performances',
          'Indications claires, état en direct et détails de score',
          'Notifications d’objets, effets d’emote et alertes en direct',
          'Disposition responsive en portrait et paysage'
        ]
        :de
          ?[
            'Schnellstart auf Handy, Tablet und Desktop',
            'Solo‑ und Raumspiele',
            'Rangliste, persönliche Einstellungen, Leistungs‑Tracking',
            'Klare Hinweise, Live‑Status und Punktedetails',
            'Food‑Hinweise, Emote‑Effekte und Live‑Meldungen',
            'Responsive Darstellung im Hoch‑ und Querformat'
          ]
          :es
            ?[
              'Inicio rápido en móvil, tableta y escritorio',
              'Partidas en solitario y en sala',
              'Clasificación, ajustes personales, seguimiento de resultados',
              'Indicaciones claras, estado en vivo y detalles de puntuación',
              'Avisos de comida, efectos de emote y notificaciones en vivo',
              'Diseño adaptable en vertical y horizontal'
            ]
            :ja
              ?[
                'スマホ・タブレット・PCで素早く開始',
                'ソロ対戦とルーム対戦',
                'ランキング、個人設定、成績管理',
                '明確な出牌ガイド、リアルタイム状況、計分詳細',
                'フード通知、表情エフェクト、ライブ通知',
                '縦横両対応のレスポンシブレイアウト'
              ]
              :[
                'Fast start on phone, tablet, and desktop',
                'Solo and room matches',
                'Leaderboard, personal settings, performance tracking',
                'Clear play cues, live status, and scoring details',
                'Food callouts, emote effects, and live notifications',
                'Responsive portrait and landscape layouts'
              ];
    const aboutNotes=zh
      ?'我們持續優化效能、互動手感、版面適配與穩定性，並根據玩家回饋調整細節。'
      :fr
        ?'Nous améliorons en continu les performances, le feedback, l’interface et la stabilité selon les retours.'
        :de
          ?'Wir verbessern fortlaufend Performance, Feedback, Layout und Stabilität basierend auf Rückmeldungen.'
          :es
            ?'Mejoramos continuamente el rendimiento, la respuesta, el diseño y la estabilidad según comentarios.'
            :ja
              ?'パフォーマンス、操作感、レイアウト、安定性を継続的に改善しています。'
              :'We continuously improve performance, interaction feedback, responsive layout, and stability based on player feedback.';
    const termsIntro=zh
      ?'使用本網站即表示你同意：'
      :fr
        ?'En utilisant ce site, vous acceptez :'
        :de
          ?'Durch die Nutzung dieser Website stimmst du zu:'
          :es
            ?'Al usar este sitio, aceptas:'
            :ja
              ?'本サイトを利用することで、以下に同意したものとします:'
              :'By using this website, you agree to:';
    const termsList=zh
      ?[
        '合法及公平使用服務，不作弊、濫用或干擾系統',
        '不使用外掛、自動化程式、爬蟲或非正常手段影響對局或排行',
        '帳戶與裝置安全由使用者自行管理',
        '排行榜與戰績以系統記錄為準，異常數據可被修正或移除',
        '維護、安全或法規需要下可調整功能或暫停部分服務',
        '對於網絡、裝置或第三方服務導致的中斷或損失不作保證'
      ]
      :fr
        ?[
          'Utiliser le service légalement et équitablement, sans triche ni abus',
          'Éviter plugins, automatisations, robots ou méthodes non standard affectant parties ou classements',
          'Gérer la sécurité de votre compte/appareil',
          'Les classements se basent sur les logs et peuvent être corrigés',
          'Des fonctionnalités peuvent changer ou être suspendues pour maintenance, sécurité ou obligations légales',
          'Aucune garantie contre interruptions ou pertes dues au réseau/appareil/tiers'
        ]
        :de
          ?[
            'Dienst legal und fair nutzen, ohne Betrug oder Missbrauch',
            'Keine Plugins, Automatisierung, Crawler oder unübliche Methoden, die Spiele/Rankings beeinflussen',
            'Sicherheit von Konto und Gerät selbst verwalten',
            'Ranglisten basieren auf Systemlogs und können korrigiert werden',
            'Funktionen können aus Wartungs-, Sicherheits- oder Rechtsgründen geändert/pausiert werden',
            'Keine Garantie bei Ausfällen oder Verlusten durch Netzwerk/Gerät/Drittanbieter'
          ]
          :es
            ?[
              'Usar el servicio legalmente y con equidad, sin trampas ni abuso',
              'Evitar plugins, automatización, rastreadores o métodos no estándar que afecten partidas o clasificaciones',
              'Gestionar la seguridad de tu cuenta/dispositivo',
              'Las clasificaciones siguen los registros del sistema y pueden corregirse',
              'Funciones pueden cambiar o suspenderse por mantenimiento, seguridad o requisitos legales',
              'Sin garantía ante interrupciones o pérdidas por red/dispositivo/terceros'
            ]
            :ja
              ?[
                '不正や濫用をせず、合法かつ公平に利用する',
                'プラグイン、自動化、クローラー等で対戦やランキングに影響を与えない',
                'アカウント/端末の安全管理は利用者が行う',
                'ランキングや戦績はシステム記録に基づき、異常は修正/削除されることがある',
                '保守・安全・法令上の理由で機能変更や一時停止を行う場合がある',
                'ネットワーク/端末/第三者サービスによる中断や損失は保証しない'
              ]
              :[
                'Use the service lawfully and fairly without cheating or abuse',
                'Avoid plugins, automation, crawlers, or non-standard methods that affect matches or leaderboards',
                'Keep your account/device secure',
                'Leaderboards and records follow system logs and may be corrected for anomalies',
                'Features may change or suspend for maintenance, security, or legal needs',
                'No guarantee against interruptions or data loss from network/device/third-party outages'
              ];
    const termsNotes=zh
      ?'若不同意上述條款，請停止使用本網站。'
      :fr
        ?'Si vous n’acceptez pas ces conditions, veuillez cesser d’utiliser le site.'
        :de
          ?'Wenn du diese Bedingungen nicht akzeptierst, nutze die Website bitte nicht.'
          :es
            ?'Si no aceptas estos términos, deja de usar el sitio.'
            :ja
              ?'同意できない場合はご利用をお控えください。'
              :'Discontinue use if you do not accept these terms.';
    const supportText=zh
      ?'喜歡這個遊戲？歡迎點擊或掃描支持我們一杯咖啡，讓我們持續更新與改善。'
      :fr
        ?'Vous aimez le jeu ? Cliquez ou scannez pour nous offrir un café et soutenir les améliorations.'
        :de
          ?'Gefällt dir das Spiel? Unterstütze uns mit einem Kaffee per Klick oder Scan.'
          :es
            ?'¿Te gusta el juego? Haz clic o escanea para apoyarnos con un café.'
            :ja
              ?'このゲームが気に入ったら、クリックまたはスキャンでコーヒー支援をお願いします。'
              :'Enjoying the game? Click or scan to support us with a coffee so we can keep improving it.';
    const supportHtml=`<div class="bmac-cta"><div class="bmac-msg">${esc(supportText)}</div><div class="bmac-row"><a href="https://www.buymeacoffee.com/4leafx" target="_blank" rel="noopener noreferrer"><img class="bmac-button" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="${esc(t('supportCoffee'))}"></a><img class="bmac-qr" src="${withBase('bmac-qr.png')}" alt="${esc(t('supportCoffeeQr'))}"></div></div>`;
    const contactHtml=zh
      ?'如有查詢，請電郵至 <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>。'
      :fr
        ?'Pour toute demande, écrivez à <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.'
        :de
          ?'Bei Fragen: <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.'
          :es
            ?'Para consultas, escribe a <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.'
            :ja
              ?'お問い合わせは <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a> まで。'
              :'For enquiries, email <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.';
    const contactList=zh
      ?[
        '裝置型號與系統版本',
        '瀏覽器與版本',
        '發生時間與操作步驟',
        '截圖或錄影（如適用）'
      ]
      :fr
        ?[
          'Modèle d’appareil et version du système',
          'Navigateur et version',
          'Heure et étapes de reproduction',
          'Captures d’écran ou enregistrement (si possible)'
        ]
        :de
          ?[
            'Gerätemodell und OS‑Version',
            'Browser und Version',
            'Zeitpunkt und Schritte zur Reproduktion',
            'Screenshots oder Bildschirmaufnahme (falls vorhanden)'
          ]
          :es
            ?[
              'Modelo de dispositivo y versión del SO',
              'Navegador y versión',
              'Hora y pasos para reproducir',
              'Capturas o grabación de pantalla (si aplica)'
            ]
            :ja
              ?[
                '端末機種とOSバージョン',
                'ブラウザとバージョン',
                '発生時刻と再現手順',
                'スクリーンショット/画面録画（可能なら）'
              ]
              :[
                'Device model and OS version',
                'Browser and version',
                'Time and steps to reproduce',
                'Screenshots or screen recording (if any)'
              ];
    return{
      labels,
      closeLabel:t('close'),
      content:{
        privacy:`<h4>${esc(labels.privacy)}</h4><p>${esc(privacyIntro)}</p><p>${esc(zh?'收集資料':fr?'Données collectées':de?'Erhobene Daten':es?'Datos que recopilamos':ja?'収集するデータ':'Data we collect')}</p>${listHtml(privacyCollect)}<p>${esc(zh?'使用目的':fr?'Utilisation des données':de?'Datennutzung':es?'Cómo usamos los datos':ja?'データの利用目的':'How we use data')}</p>${listHtml(privacyUse)}<p>${esc(privacyNotes)}</p>`,
        about:`<h4>${esc(labels.about)}</h4><div class="legal-about-grid"><div class="legal-about-main"><p>${esc(aboutIntro)}</p>${listHtml(aboutList)}<p>${esc(aboutNotes)}</p></div><div class="legal-about-side">${supportHtml}</div></div>`,
        contact:`<h4>${esc(labels.contact)}</h4><p>${contactHtml}</p><p>${esc(zh?'建議提供':fr?'Merci d’inclure':de?'Bitte angeben':es?'Incluye':ja?'可能であれば以下を添付':'Please include')}</p>${listHtml(contactList)}`,
        terms:`<h4>${esc(labels.terms)}</h4><p>${esc(termsIntro)}</p>${listHtml(termsList,true)}<p>${esc(termsNotes)}</p>`
      }
    };
  }

  function mainPageLegalMiniHtml(){
    const legal=legalMiniCopy();
    return`<section class="legal-mini" id="legal-mini"><div class="legal-mini-links"><button type="button" class="legal-mini-link" data-legal="privacy">${legal.labels.privacy}</button><span class="legal-mini-sep">◦</span><button type="button" class="legal-mini-link" data-legal="about">${legal.labels.about}</button><span class="legal-mini-sep">◦</span><button type="button" class="legal-mini-link" data-legal="contact">${legal.labels.contact}</button><span class="legal-mini-sep">◦</span><button type="button" class="legal-mini-link" data-legal="terms">${legal.labels.terms}</button></div><div class="intro-modal legal-modal" id="legal-modal"><button class="intro-backdrop" id="legal-backdrop" aria-label="${legal.closeLabel}"></button><section class="intro-sheet legal-sheet"><header class="intro-head"><div><h3 id="legal-modal-title"></h3></div><button id="legal-close" class="secondary">${legal.closeLabel}</button></header><div class="legal-modal-body" id="legal-modal-body"></div></section></div></section>`;
  }

  return{
    legalMiniCopy,
    mainPageLegalMiniHtml
  };
}

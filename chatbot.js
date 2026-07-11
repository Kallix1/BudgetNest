// BudgetNest — зареждане на чатбота (Botpress Webchat v4.1)
// -----------------------------------------------------------------------------
// Този файл се вика от всички страници чрез <script src="chatbot.js" defer>.
// Целта му е да зареди чатбота НАДЕЖДНО и на компютър, и на телефон.
//
// Botpress се състои от два скрипта:
//   1) inject.js        — самата библиотека, създава глобалния обект window.botpress
//   2) config скриптът  — генериран от таблото на Botpress, вика window.botpress.init(...)
//
// Редът е важен: config скриптът ползва window.botpress, затова той трябва да се
// зареди СЛЕД като inject.js е напълно готов. Затова тук ги веригираме през onload,
// вместо да разчитаме на две отделни <script> тагчета (при което на по-бавни
// мрежи, особено на телефон, config може да тръгне преди библиотеката да е готова).
(function () {
  'use strict';

  // Пази от двойно зареждане (напр. ако скриптът бъде включен два пъти).
  if (window.__budgetnestChatbotInit) return;
  window.__budgetnestChatbotInit = true;

  var INJECT_URL = 'https://cdn.botpress.cloud/desk/webchat/v4.1/inject.js';
  var CONFIG_URL = 'https://files.bpcontent.cloud/2026/07/10/06/20260710062216-ZTFZ1YPG.js';

  // Малки стилови поправки, за да изглежда добре и на телефон:
  // качваме z-index-а на балончето над "sticky" хедъра/менюто и махаме
  // хоризонтално превъртане, ако уиджетът за миг излезе извън екрана.
  function injectStyles() {
    if (document.getElementById('bn-chatbot-style')) return;
    var css =
      '#bp-web-widget-container,[id^="bp-widget"],.bpFab,#bp-widget{z-index:2147483000 !important;}' +
      '@media (max-width:640px){' +
      '#bp-web-widget-container,[id^="bp-widget"]{max-width:100vw !important;}' +
      '}';
    var style = document.createElement('style');
    style.id = 'bn-chatbot-style';
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  // Зарежда един скрипт и връща Promise, който се разрешава при onload.
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Неуспешно зареждане: ' + src)); };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function start() {
    injectStyles();
    loadScript(INJECT_URL)
      .then(function () { return loadScript(CONFIG_URL); })
      .catch(function (err) {
        // Не чупим страницата, ако чатботът не се зареди (напр. без мрежа).
        if (window.console && console.warn) {
          console.warn('[BudgetNest] Чатботът не можа да се зареди:', err && err.message);
        }
      });
  }

  // Изчакваме DOM-а да е готов, за да сме сигурни, че <head>/<body> съществуват.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
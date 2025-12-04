(function victoryDebugLogger() {
  let waited = 0;
  const maxWait = 10000; // 10 seconds

  function startLogger() {
    console.log('[VictoryDebug] Logger started!');
    setInterval(() => {
      if (!window.GameState || !window.GameState.state || !window.UI || !window.CONFIG) {
        console.log('[VictoryDebug] Waiting for game modules...');
        return;
      }
      const ap = GameState.state.alienPoints;
      const apNum = Number(ap);
      const goal = CONFIG.AP_VICTORY_GOAL || 1000000000;
      const hasWon = apNum >= goal;
      const popupShown = UI._victoryPopupShown;
      console.log(
        `[VictoryDebug] AP:`, ap,
        `(type: ${typeof ap})`,
        `| as Number: ${apNum}`,
        `| Goal: ${goal}`,
        `| hasWon: ${hasWon}`,
        `| Popup shown: ${popupShown}`
      );
    }, 1000);
  }

  function waitForGame() {
    if (window.GameState && window.GameState.state && window.UI && window.CONFIG) {
      startLogger();
    } else if (waited < maxWait) {
      if (waited === 0) console.log('[VictoryDebug] Waiting for game modules to load...');
      waited += 500;
      setTimeout(waitForGame, 500);
    } else {
      console.warn('[VictoryDebug] Gave up waiting for game modules after 10 seconds.');
    }
  }

  console.log('[VictoryDebug] Script loaded!');
  waitForGame();
})();

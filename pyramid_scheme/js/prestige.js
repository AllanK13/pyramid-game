const Prestige = {
  // Calculate how much AP the player would get for their current pyramids
  calculateAPGain() {
    const pyramids = GameState.state.pyramids || 0;
    const baseCost = CONFIG.ap_base_pyramid_cost || 1000000;
    
    // Base AP is floor(pyramids / baseCost)
    const baseAP = Math.floor(pyramids / baseCost);
    
    // Apply AP gain bonus from upgrades
    const bonusMultiplier = GameState.state.apUpgrades?.apGainBonus 
      ? (1 + CONFIG.getUpgradeEffect('apGainBonus', GameState.state.apUpgrades.apGainBonus))
      : 1;
    
    return Math.floor(baseAP * bonusMultiplier);
  },

  // Check if player can prestige
  canPrestige() {
    const pyramids = GameState.state.pyramids || 0;
    const baseCost = CONFIG.ap_base_pyramid_cost || 1000000;
    return pyramids >= baseCost;
  },

  // Check if player has won (reached PYRAMID_VICTORY_GOAL)
  hasWon() {
    return (GameState.state.pyramids || 0) >= (CONFIG.PYRAMID_VICTORY_GOAL || 1000000000);
  },

  // Perform prestige - reset everything except AP and upgrades
  performPrestige() {
    if (!this.canPrestige()) {
      console.log('Cannot prestige yet - not enough pyramids');
      return false;
    }

    // Calculate AP to gain
    const apGained = this.calculateAPGain();
    
    if (apGained <= 0) {
      console.log('No AP would be gained from prestige');
      return false;
    }

    console.log(`Prestiging! Gaining ${apGained} AP`);

    // Add AP to total
    GameState.state.alienPoints = (GameState.state.alienPoints || 0) + apGained;

    // Mark the AP Store as unlocked permanently once player has their first AP
    if (!GameState.state.apStoreUnlocked && GameState.state.alienPoints > 0) {
      GameState.state.apStoreUnlocked = true;
      console.log('AP Store permanently unlocked after prestige');
    }

    // Track if player had won before reset
    const wasVictory = this.hasWon();

    // Reset game state (keeps AP and upgrades)
    GameState.prestigeReset();

    // If player has won, set flag and show win popup after reset
    if (wasVictory) {
      GameState.state.hasWon = true;
      setTimeout(() => {
        if (typeof UI !== "undefined" && UI.showPostVictoryResetPopup) {
          UI.showPostVictoryResetPopup();
        }
      }, 300);
    } else {
      GameState.state.hasWon = false;
    }

    // Update UI
    UI.update();

    console.log(`✨ Prestige complete! Total AP: ${GameState.state.alienPoints}`);
    return true;
  },

  // Get upgrade level helper (for backwards compatibility)
  getUpgradeLevel(upgradeId) {
    return GameState.state.apUpgrades?.[upgradeId] || 0;
  }
};

console.log('✅ Prestige module loaded');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Prestige;
}

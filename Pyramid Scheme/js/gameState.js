// Game State Manager
// Central state object for all game data

const GameState = {
  state: {},

  init() {
    console.log('🎮 GameState.init()');
    // Initialize state object with all properties at once
    this.state = {
      // Player progress
      stoneProgress: 0,
      sculptedStones: 0,
      pyramids: 0,
      alienPoints: 0,
      
      // Workers - use numeric keys matching HTML
      workers: {
        1: { tier: 1, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        2: { tier: 2, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        3: { tier: 3, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        4: { tier: 4, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        5: { tier: 5, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 }
      },
      
      // AP upgrades
      apUpgrades: {
        startingStones: 0,
        startingPyramids: 0,
        workerSpeedOnline: 0,
        hireCapacity: 0,
        workerSpeedOffline: 0,
        apGainBonus: 0
      },
      
      // Timestamps
      lastSaveTime: Date.now(),
      lastUpdateTime: Date.now()
    };
    
    console.log('✅ GameState initialized');
  },

  reset() {
    // Keep AP and upgrades, reset everything else
    const savedAP = this.state.alienPoints || 0;
    const savedUpgrades = { ...this.state.apUpgrades };
    
    this.init();
    
    this.state.alienPoints = savedAP;
    this.state.apUpgrades = savedUpgrades;
  },

  // Reset for prestige (keep AP and upgrades)
  prestigeReset() {
    const preservedAP = this.state.alienPoints;
    const preservedUpgrades = { ...this.state.apUpgrades };
    
    // Reset everything
    this.init();
    
    // Restore AP and upgrades
    this.state.alienPoints = preservedAP;
    this.state.apUpgrades = preservedUpgrades;
    
    // Apply starting bonuses from upgrades
    this.applyStartingBonuses();
    
    console.log(`✨ Prestige reset complete. AP: ${preservedAP}, Upgrades:`, preservedUpgrades);
  },

  // Apply bonuses from AP upgrades at start of run
  applyStartingBonuses() {
    if (this.state.apUpgrades.startingStones > 0) {
      const bonus = CONFIG.getUpgradeEffect('startingStones', this.state.apUpgrades.startingStones);
      this.state.sculptedStones += Math.floor(bonus);
    }
    
    if (this.state.apUpgrades.startingPyramids > 0) {
      const bonus = CONFIG.getUpgradeEffect('startingPyramids', this.state.apUpgrades.startingPyramids);
      this.state.pyramids += Math.floor(bonus);
    }
  },

  // Get maximum hires for a given tier
  getMaxHiresForTier(tier) {
    const baseMax = CONFIG.MAX_HIRES_BASE;
    const capacityBonus = this.state.apUpgrades.hireCapacity;
    const decay = CONFIG.HIRE_CAPACITY_DECAY;
    
    // Tier 0 is the player, tier 1 is first worker level, etc.
    const adjustedTier = tier - 1; // Convert to 0-indexed
    
    const maxHires = baseMax + capacityBonus - (decay * adjustedTier);
    return Math.max(1, Math.floor(maxHires)); // At least 1
  },

  // Get worker speed multiplier from upgrades
  getWorkerSpeedMultiplier(isOffline = false) {
    if (isOffline) {
      const offlineBase = CONFIG.OFFLINE_SPEED_MULTIPLIER_BASE;
      const offlineBonus = CONFIG.getUpgradeEffect('workerSpeedOffline', this.state.apUpgrades.workerSpeedOffline);
      return offlineBase + offlineBonus;
    } else {
      const onlineBonus = CONFIG.getUpgradeEffect('workerSpeedOnline', this.state.apUpgrades.workerSpeedOnline);
      return 1.0 + onlineBonus; // 100% base + bonus
    }
  },

  // Get AP gain multiplier from upgrades
  getAPGainMultiplier() {
    const bonus = CONFIG.getUpgradeEffect('apGainBonus', this.state.apUpgrades.apGainBonus);
    return 1.0 + bonus;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameState;
}

console.log('✅ GameState module loaded');

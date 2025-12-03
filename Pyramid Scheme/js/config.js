// Configuration system for Pyramid Game
// All tunable parameters for easy balancing

const CONFIG = {
  // Version
  VERSION: '0.03',
  
  // Core conversion ratios
  CLICKS_PER_STONE: 10,
  STONES_PER_PYRAMID: 10,
  PYRAMIDS_PER_HIRE: 10,
  
  // Worker settings
  BASE_HIRE_CAPACITY: 5, // Base capacity before decay
  MAX_HIRES_BASE: 5,
  WORKER_CLICK_INTERVAL: 1000, // milliseconds (1 second) (change to 1 ms for debug)
  INVESTOR_DECAY_RATE: 0.20, // 20% decay rate for sub-investors
  
  // Game loop & timing
  TICK_RATE: 100, // milliseconds between game updates
  AUTOSAVE_INTERVAL: 60000, // 1 minute in milliseconds
  MAX_OFFLINE_TIME: 86400000, // 24 hours in milliseconds
  
  // Prestige settings
  AP_SELL_BASE_COST: 100000, // Pyramids needed for base AP calculation
  AP_SELL_SCALING: 'logarithmic', // 'linear', 'logarithmic', or 'power'
  AP_STACK_SIZE: 100000, // Pyramids per "stack" for bonus calculation
  AP_VICTORY_GOAL: 1000000000, // AP needed to win
  
  // AP/Prestige settings
  ap_base_pyramid_cost: 1000000,  // Minimum pyramids needed to sell for 1 AP
  
  // Offline mode
  OFFLINE_SPEED_MULTIPLIER_BASE: 0.5, // 50% of online speed when offline
  
  // Debug settings
  debug_mode: true,  // Set to false to hide debug menu
  
  // Worker tier unlock requirements (in pyramids)
  WORKER_UNLOCK_REQUIREMENTS: {
    '1': 10,
    '2': 20,
    '3': 30,
    '4': 40,
    '5': 50
  },

  // Save/Load
  SAVE_KEY: 'pyramidScheme_save',
  
  // AP Upgrades configuration
  UPGRADES: {
    startingStones: {
      name: 'Starting Sculpted Stones',
      description: 'Start each run with bonus Sculpted Stones',
      baseCost: 1,
      costScaling: 1,
      baseEffect: 0,
      effectScaling: 1, // Each level adds +1 stones
      maxLevel: 9
    },
    startingPyramids: {
      name: 'Legacy Pyramids',
      description: 'Start each run with bonus Pyramids',
      baseCost: 50,
      costScaling: 1.2,
      baseEffect: 0,
      effectScaling: 1, // Each level adds +1 pyramids
      maxLevel: 999999 // Effectively unlimited
    },
    hireCapacity: {
      name: 'Increased Hire Capacity',
      description: 'Increases the number of investors you can hire',
      baseCost: 15,
      costScaling: 1.8,
      baseEffect: 1,
      effectScaling: 1, // Each level adds +1 to max hires
      maxLevel: 10
    },
    workerSpeedOnline: {
      name: 'Investor Speed Training',
      description: 'Investors sculpt stones faster while online',
      baseCost: 12,
      costScaling: 1.6,
      baseEffect: 0.01, // 1% speed increase per level
      effectScaling: 0.01,
      maxLevel: 50
    },
    workerSpeedOffline: {
      name: 'Offline Efficiency',
      description: 'Improve investor speed while offline',
      baseCost: 18,
      costScaling: 1.7,
      baseEffect: 0.05, // 5% of online speed per level (added to base 50%)
      effectScaling: 0.05,
      maxLevel: 30
    },
    apGainBonus: {
      name: 'Alien Bargaining',
      description: 'Gain more AP when selling pyramids',
      baseCost: 100,
      costScaling: 2.2,
      baseEffect: 0.1, // 10% more AP per level
      effectScaling: 0.1,
      maxLevel: 20
    },
    investorDecayRate: {
      name: 'Investor Decay Reduction',
      description: 'Reduce the decay rate for sub-investors (improves deep pyramid efficiency)',
      baseCost: 30,
      costScaling: 2.5,
      baseEffect: -0.02, // Reduces decay by 2% per level (e.g., 20% → 18% → 16%)
      effectScaling: -0.02,
      maxLevel: 8, // Max reduction of 16%, bringing decay from 20% down to 4%
    }
  },
  
  // Recursive worker configuration
  RECURSIVE_WORKERS_ENABLED: true,
  WORKER_PYRAMIDS_TO_HIRE_FIRST: 10,  // Pyramids needed for first sub-hire
  WORKER_PYRAMIDS_PER_ADDITIONAL_HIRE: 10, // Additional pyramids per hire after that
  WORKER_MAX_HIRES_PER_TIER: 5, // Max sub-investors each investor can hire (before decay)
  WORKER_DECAY_RATE: 0.20, // Each level produces 20% less (0.20 = 20% decay)
  WORKER_CLICKS_PER_STONE: 10, // Clicks needed for workers to sculpt a stone (same as player)
  WORKER_STONES_PER_PYRAMID: 10, // Stones needed for workers to build a pyramid (same as player)
  WORKER_STOPS_AFTER_MAX_HIRES: true, // Workers stop producing once they've hired max sub-workers
};

// Helper functions for configuration
CONFIG.getUpgradeCost = function(upgradeKey, currentLevel) {
  const upgrade = this.UPGRADES[upgradeKey];
  if (!upgrade) return Infinity;
  if (currentLevel >= upgrade.maxLevel) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScaling, currentLevel));
};

CONFIG.getUpgradeEffect = function(upgradeKey, level) {
  const upgrade = this.UPGRADES[upgradeKey];
  if (!upgrade) return 0;
  return upgrade.baseEffect + (upgrade.effectScaling * level);
};

CONFIG.canPurchaseUpgrade = function(upgradeKey, currentLevel, upgradesOwned) {
  const upgrade = this.UPGRADES[upgradeKey];
  if (!upgrade) return false;
  if (currentLevel >= upgrade.maxLevel) return false;
  
  // Check requirements
  if (upgrade.requires) {
    for (const [reqKey, reqLevel] of Object.entries(upgrade.requires)) {
      if ((upgradesOwned[reqKey] || 0) < reqLevel) {
        return false;
      }
    }
  }
  
  return true;
};

// Get effective decay rate based on AP upgrades
CONFIG.getEffectiveDecayRate = function(apUpgrades) {
  const baseDecay = this.WORKER_DECAY_RATE; // 0.20 (20%)
  const decayReduction = apUpgrades?.investorDecayRate || 0;
  const reduction = decayReduction * -0.02; // Each level reduces by 2%
  
  // Ensure decay rate doesn't go below 0.04 (4%) or above base rate
  const effectiveDecay = Math.max(0.04, Math.min(baseDecay, baseDecay + reduction));
  return effectiveDecay;
};

// Get max hires for a specific tier (applies decay to tier 1 only)
CONFIG.getMaxHiresForTier = function(tier, apUpgrades = {}) {
  const baseCapacity = this.BASE_HIRE_CAPACITY || 5;
  const hireCapacityBonus = apUpgrades?.hireCapacity || 0;
  
  // Tier 1 (the player's direct hires) gets decay applied
  if (tier === 1) {
    const decayRate = this.getEffectiveDecayRate(apUpgrades);
    return Math.floor((baseCapacity + hireCapacityBonus) * (1 - decayRate));
  }
  
  // Higher tiers get full capacity
  return baseCapacity + hireCapacityBonus;
};

// Backwards compatibility aliases
const Config = CONFIG; // Alias for code that uses Config instead of CONFIG

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

console.log('✅ Config module loaded');

// Configuration system for Pyramid Game
// All tunable parameters for easy balancing

const CONFIG = {
  // Version
  VERSION: '0.11',
  
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
  AP_SELL_BASE_COST: 10000, // Pyramids needed for base AP calculation
  // AP_SELL_SCALING: 'logarithmic', // 'linear', 'logarithmic', or 'power'
  // AP_STACK_SIZE: 100000, // Pyramids per "stack" for bonus calculation
  // AP_VICTORY_GOAL: 1000000000, // (legacy, not used for win anymore)
  PYRAMID_VICTORY_GOAL: 1000000000, // Pyramids needed to win
  
  // AP/Prestige settings
  ap_base_pyramid_cost: 10000,  // Minimum pyramids needed to sell for 1 AP
  
  // Offline mode
  OFFLINE_SPEED_MULTIPLIER_BASE: 0.5, // 50% of online speed when offline
  OFFLINE_MIN_TIME_MS: 60000, // Minimum time away (ms) before offline earnings are calculated (default 60s)
  
  // Debug settings
  debug_mode: true,  // Set to false to hide debug menu

  // Mobile UI tweaks
  // Minimum number of investors to show on mobile/small screens to avoid hiding investors due to tight layout
  MOBILE_MIN_VISIBLE_INVESTORS: 5,

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
    hireCapacity: {
      name: 'Increased Hire Capacity',
      description: 'Increases the number of investors you can hire (your investors and sub-investors increase proportionally)',
      baseCost: 50,
      costScaling: 2.0, // Expensive but accessible for active players
      baseEffect: 0,
      effectScaling: 1, // Each level adds +1 to max hires
      maxLevel: 5 // Max +5 additional hires (total: 1,550 AP)
    },
    investorDecayRate: {
      name: 'Investor Decay Reduction',
      description: 'Reduce the decay rate for sub-investors (increases max hires at deeper levels AND improves their production speed)',
      baseCost: 40,
      costScaling: 2.5, // Steep but manageable for active players
      baseEffect: 0, // Reduces decay by 2% per level (e.g., 20% → 18% → 16%)
      effectScaling: -0.02,
      maxLevel: 8, // Max reduction of 16%, bringing decay from 20% down to 4% (total: 24,414 AP)
    },
    workerSpeedOnline: {
      name: 'Investor Speed Training',
      description: 'Investors sculpt stones faster while online',
      baseCost: 1,
      costScaling: 1.05,
      baseEffect: 0, // Start at 0% bonus
      effectScaling: 0.01, // Each level adds +1% speed
      maxLevel: 999999 // Effectively unlimited
    },
    startingStones: {
      name: 'Starting Sculpted Stones',
      description: 'Start each run with bonus Sculpted Stones',
      baseCost: 1,
      costScaling: 1.0, // Flat cost (no scaling)
      baseEffect: 0,
      effectScaling: 1, // Each level adds +1 stones
      maxLevel: 9
    },
    startingPyramids: {
      name: 'Legacy Pyramids',
      description: 'Start each run with bonus Pyramids',
      baseCost: 5,
      costScaling: 1.1, // Very gentle 10% scaling
      baseEffect: 0,
      effectScaling: 1, // Each level adds +1 pyramids
      maxLevel: 500 // Practical limit
    },
    workerSpeedOffline: {
      name: 'Offline Efficiency',
      description: 'Improve investor speed while offline',
      baseCost: 200,
      costScaling: 3.0, // Very expensive - major investment for casual players
      baseEffect: 0,    // Start at 0% at level 0 (base offline multiplier is CONFIG.OFFLINE_SPEED_MULTIPLIER_BASE = 0.4)
      effectScaling: 0.05,
      maxLevel: 8 // Max: 40% + 40% = 80% offline efficiency (total: 218,600 AP)
    },
    apGainBonus: {
      name: 'Alien Bargaining',
      description: 'Gain more AP when selling pyramids',
      baseCost: 10,
      costScaling: 1.4, // Gentle scaling - early game investment
      baseEffect: 0, // Start at 0% bonus
      effectScaling: 0.1, // Each level adds +10%
      maxLevel: 20 // Cap at +200% AP (3x total)
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
  const hireCapacityLevel = apUpgrades?.hireCapacity || 0;
  const hireCapacityBonus = this.getUpgradeEffect('hireCapacity', hireCapacityLevel);
  
  // Tier 1 (the player's direct hires) gets decay applied
  if (tier === 1) {
    const decayRate = this.getEffectiveDecayRate(apUpgrades);
    let effective = Math.floor((baseCapacity + hireCapacityBonus) * (1 - decayRate));

    // Mobile/small-screen detection (safe checks for non-browser environments)
    const isMobileUA = (typeof navigator !== 'undefined') && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSmallWidth = (typeof window !== 'undefined') && window.innerWidth && window.innerWidth < 600;
    const isMobile = isMobileUA || isSmallWidth;

    if (isMobile) {
      // Ensure UI on mobile shows at least the configured minimum visible investors
      const minVisible = this.MOBILE_MIN_VISIBLE_INVESTORS || 5;
      effective = Math.max(effective, minVisible);
    }

    return effective;
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

window.CONFIG = CONFIG;

console.log('✅ Config module loaded');

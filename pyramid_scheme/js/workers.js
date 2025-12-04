// Worker System - Pure Mathematical Calculations
// No individual worker objects, just aggregate production math

const Workers = {
  // Calculate total clicks per tick from all workers
  calculateTotalWorkerClicks: function(deltaTime, speedMultiplier = 1.0) {
    const ticksPerSecond = 1000 / CONFIG.WORKER_CLICK_INTERVAL;
    const secondsElapsed = deltaTime / 1000;
    const baseClicksPerWorker = ticksPerSecond * secondsElapsed * speedMultiplier;
    
    let totalClicks = 0;
    
    // Calculate clicks from each tier
    for (let tier = 1; tier <= 10; tier++) {
      const workerCount = GameState.workers[`tier${tier}`];
      if (workerCount > 0) {
        totalClicks += workerCount * baseClicksPerWorker;
      }
    }
    
    return totalClicks;
  },
  
  // Process worker production and conversions
  processWorkerProduction: function(deltaTime, speedMultiplier = 1.0) {
    const totalClicks = this.calculateTotalWorkerClicks(deltaTime, speedMultiplier);
    
    if (totalClicks <= 0) return;
    
    // Distribute clicks across tiers proportionally
    const tierDistribution = this.calculateTierDistribution();
    
    for (let tier = 1; tier <= 10; tier++) {
      const tierKey = `tier${tier}`;
      const workerCount = GameState.workers[tierKey];
      
      if (workerCount > 0) {
        const tierClicks = totalClicks * tierDistribution[tier];
        this.processClicksForTier(tier, tierClicks);
      }
    }
  },
  
  // Calculate what percentage of total clicks each tier contributes
  calculateTierDistribution: function() {
    const distribution = {};
    let totalWorkers = 0;
    
    for (let tier = 1; tier <= 10; tier++) {
      totalWorkers += GameState.workers[`tier${tier}`];
    }
    
    if (totalWorkers === 0) {
      for (let tier = 1; tier <= 10; tier++) {
        distribution[tier] = 0;
      }
      return distribution;
    }
    
    for (let tier = 1; tier <= 10; tier++) {
      const workerCount = GameState.workers[`tier${tier}`];
      distribution[tier] = workerCount / totalWorkers;
    }
    
    return distribution;
  },
  
  // Process clicks for a specific tier
  processClicksForTier: function(tier, clicks) {
    const tierKey = `tier${tier}`;
    const stonesKey = `${tierKey}Stones`;
    const pyramidsKey = `${tierKey}Pyramids`;
    
    // Add clicks to stone production for this tier
    let remainingClicks = clicks;
    
    while (remainingClicks >= CONFIG.CLICKS_PER_STONE) {
      // Complete a stone
      GameState.workerProduction[stonesKey]++;
      GameState.stats.totalStonesCompleted++;
      remainingClicks -= CONFIG.CLICKS_PER_STONE;
      
      // Check if we can form a pyramid
      if (GameState.workerProduction[stonesKey] >= CONFIG.STONES_PER_PYRAMID) {
        GameState.workerProduction[stonesKey] -= CONFIG.STONES_PER_PYRAMID;
        GameState.workerProduction[pyramidsKey]++;
        GameState.resources.pyramids++;
        GameState.stats.totalPyramidsBuilt++;
      }
    }
    
    // Store fractional clicks for next tick (optional, for precision)
    // For now, we'll discard fractional clicks
  },
  
  // Check if any tier can hire new workers and do so
  processWorkerHiring: function() {
    for (let tier = 1; tier <= 9; tier++) { // Tier 10 can't hire (max depth)
      const tierKey = `tier${tier}`;
      const pyramidsKey = `${tierKey}Pyramids`;
      const nextTierKey = `tier${tier + 1}`;
      
      const workerCount = GameState.workers[tierKey];
      if (workerCount === 0) continue; // No workers at this tier
      
      const pyramidsProduced = GameState.workerProduction[pyramidsKey];
      const maxHires = GameState.getMaxHiresForTier(tier + 1);
      const currentHires = GameState.workers[nextTierKey];
      
      // Check if this tier has produced enough pyramids to hire
      // Each worker at this tier can hire independently
      const pyramidsPerHire = CONFIG.PYRAMIDS_PER_HIRE;
      const possibleHires = Math.floor(pyramidsProduced / pyramidsPerHire);
      
      if (possibleHires > 0 && currentHires < maxHires * workerCount) {
        // Calculate how many we can actually hire
        const maxPossibleHires = (maxHires * workerCount) - currentHires;
        const hiresToMake = Math.min(possibleHires, maxPossibleHires);
        
        if (hiresToMake > 0) {
          // Hire workers
          GameState.workers[nextTierKey] += hiresToMake;
          GameState.workerProduction[pyramidsKey] -= hiresToMake * pyramidsPerHire;
        }
      }
    }
  },
  
  // Get total worker count across all tiers
  getTotalWorkerCount: function() {
    let total = 0;
    for (let tier = 1; tier <= 10; tier++) {
      total += GameState.workers[`tier${tier}`];
    }
    return total;
  },
  
  // Get production rate summary for display
  getProductionRates: function() {
    const speedMultiplier = GameState.getWorkerSpeedMultiplier(false);
    const clicksPerSecond = this.calculateTotalWorkerClicks(1000, speedMultiplier);
    const stonesPerSecond = clicksPerSecond / CONFIG.CLICKS_PER_STONE;
    const pyramidsPerSecond = stonesPerSecond / CONFIG.STONES_PER_PYRAMID;
    
    return {
      clicksPerSecond: clicksPerSecond,
      stonesPerSecond: stonesPerSecond,
      pyramidsPerSecond: pyramidsPerSecond
    };
  },
  
  // Check if player can hire a tier 1 worker
  canHireTier1Worker: function() {
    const cost = CONFIG.PYRAMIDS_PER_HIRE;
    const maxHires = GameState.getMaxHiresForTier(1);
    const currentHires = GameState.workers.tier1;
    
    return GameState.resources.pyramids >= cost && currentHires < maxHires;
  },
  
  // Hire a tier 1 worker (player action)
  hireTier1Worker: function() {
    if (this.canHireTier1Worker()) {
      const cost = CONFIG.PYRAMIDS_PER_HIRE;
      GameState.resources.pyramids -= cost;
      GameState.workers.tier1++;
      return true;
    }
    return false;
  },
  
  // Workers production logic will go here
  processProduction: function() {
    // Production logic here
  },

  // Get total hired workers recursively for a worker
  getTotalHiredRecursive(workerId) {
    const worker = GameState.state.workers[workerId];
    if (!worker || !worker.hired) return 0;
    
    let total = worker.hiredWorkers || 0;
    
    // Add sub-workers recursively
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        total += this.getTotalHiredRecursive(subWorker.id);
      }
    }
    
    return total;
  },

  // Get total pyramids recursively for a worker
  getTotalPyramidsRecursive(workerId) {
    const worker = GameState.state.workers[workerId];
    if (!worker || !worker.hired) return 0;
    
    let total = worker.pyramids || 0;
    
    // Add sub-worker pyramids recursively
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        total += this.getTotalPyramidsRecursive(subWorker.id);
      }
    }
    
    return total;
  },

  // Create a new sub-worker for a parent worker
  createSubWorker(parentWorkerId, tier) {
    const subWorkerId = `${parentWorkerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subWorker = {
      id: subWorkerId,
      tier: tier,
      parentId: parentWorkerId,
      hired: true,
      hiredWorkers: 0,
      stoneProgress: 0,
      sculptedStones: 0,
      pyramids: 0,
      subWorkers: [],
      lastUpdate: Date.now()
    };
    
    return subWorker;
  },

  // Check if a worker can hire a sub-worker
  canHireSubWorker(worker) {
    if (!CONFIG.RECURSIVE_WORKERS_ENABLED) return false;
    if (!worker || !worker.hired) return false;
    
    const totalPyramids = worker.pyramids || 0;
    const currentHired = worker.hiredWorkers || 0;
    const maxHires = this.getMaxHires(worker.tier);
    
    // Need WORKER_PYRAMIDS_TO_HIRE pyramids for first hire, then increments of maxHires * 10
    const pyramidsNeeded = CONFIG.WORKER_PYRAMIDS_TO_HIRE + (currentHired * maxHires * 10);
    
    return totalPyramids >= pyramidsNeeded && currentHired < maxHires;
  },

  // Get max hires for a tier (same as player unlock requirements / 10)
  getMaxHires(tier) {
    const baseCost = CONFIG.WORKER_BASE_COST;
    const costMult = CONFIG.WORKER_COST_MULT;
    const unlockRequirement = Math.floor(baseCost * Math.pow(costMult, tier - 1));
    return Math.max(5, Math.floor(unlockRequirement / 10)); // Default 5, or unlock/10
  },

  // Hire a sub-worker for a worker
  hireSubWorker(worker) {
    if (!this.canHireSubWorker(worker)) return false;
    
    const nextTier = worker.tier + 1;
    const subWorker = this.createSubWorker(worker.id, nextTier);
    
    if (!worker.subWorkers) {
      worker.subWorkers = [];
    }
    
    worker.subWorkers.push(subWorker);
    worker.hiredWorkers = (worker.hiredWorkers || 0) + 1;
    
    console.log(`Worker ${worker.id} (tier ${worker.tier}) hired sub-worker ${subWorker.id} (tier ${nextTier})`);
    
    return true;
  },

  // Update a worker's production (stones -> pyramids)
  updateWorkerProduction(worker, deltaTime) {
    if (!worker || !worker.hired) return;
    
    const clicksPerSecond = this.getWorkerSpeed(worker.tier);
    const clicks = clicksPerSecond * (deltaTime / 1000);
    
    // Add to stone progress
    worker.stoneProgress = (worker.stoneProgress || 0) + clicks;
    
    // Convert stone progress to sculpted stones
    const clicksPerStone = CONFIG.WORKER_CLICKS_PER_STONE || 10;
    while (worker.stoneProgress >= clicksPerStone) {
      worker.stoneProgress -= clicksPerStone;
      worker.sculptedStones = (worker.sculptedStones || 0) + 1;
    }
    
    // Convert sculpted stones to pyramids
    const stonesPerPyramid = CONFIG.WORKER_STONES_PER_PYRAMID || 10;
    while (worker.sculptedStones >= stonesPerPyramid) {
      worker.sculptedStones -= stonesPerPyramid;
      worker.pyramids = (worker.pyramids || 0) + 1;
    }
    
    // Try to hire sub-workers
    while (this.canHireSubWorker(worker)) {
      this.hireSubWorker(worker);
    }
    
    // Update sub-workers recursively
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        this.updateWorkerProduction(subWorker, deltaTime);
      }
    }
  },

  // Get worker speed (clicks per second)
  getWorkerSpeed(tier) {
    // Base speed increases with tier
    const baseSpeed = 1 + (tier * 0.5);
    
    // Apply AP upgrades
    const onlineBonus = Prestige.getUpgradeEffect('workerSpeedOnline');
    
    return baseSpeed * (1 + onlineBonus);
  },

  getWorkerProduction(tier) {
    const workerState = GameState.state.workers[tier];
    if (!workerState || workerState.count === 0) return 0;
    
    const config = CONFIG.WORKER_TIERS[tier];
    if (!config) return 0;
    
    // Base production from workers at this tier
    let production = workerState.count * config.productionRate;
    
    // Apply online speed bonus
    const onlineBonus = Prestige.getUpgradeLevel('workerSpeedOnline');
    if (onlineBonus > 0) {
      production *= (1 + onlineBonus * 0.01);
    }
    
    // For tier 2+, add production from recruited sub-workers (with decay)
    if (tier > 1 && workerState.subWorkerCount > 0) {
      const decayRate = this.getCurrentDecayRate();
      const effectiveSubWorkers = workerState.subWorkerCount * (1 - decayRate);
      
      // Each sub-worker produces at the rate of tier-1
      const subWorkerProduction = this.getWorkerProduction(tier - 1);
      production += effectiveSubWorkers * subWorkerProduction;
    }
    
    return production;
  },

  getCurrentDecayRate() {
    const baseDecay = CONFIG.INVESTOR_DECAY_RATE || 0.2;
    const reduction = Prestige.getUpgradeLevel('investorDecayRate');
    return Math.max(0, baseDecay - (reduction * 0.02));
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Workers;
}

console.log('✅ Workers module loaded');

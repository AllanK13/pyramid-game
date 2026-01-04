// Game Engine - Main game loop and logic

const GameEngine = {
  tickInterval: null,
  lastUpdate: Date.now(), // Track last update time for delta calculations

  // Start the game loop
  start() {
    console.log('⚙️ GameEngine.start()');
    
    // Start game loop (runs every 100ms)
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 100);
    
    console.log('✅ GameEngine started');
  },

  // Stop the game loop
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  },

  // Main game tick
  tick() {
    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    // Update worker production
    this.updateWorkerProduction();

    // Convert player's stones to pyramids
    this.convertStonesToPyramids();

    // Update UI
    UI.update();
  },

  // Player clicks the main sculpt button
  clickStone() {
    GameState.state.stoneProgress = (GameState.state.stoneProgress || 0) + 1;
    
    const required = CONFIG.CLICKS_PER_STONE || 10;
    
    // Automatically convert excess stone progress to sculpted stones
    while (GameState.state.stoneProgress >= required) {
      GameState.state.stoneProgress -= required;
      GameState.state.sculptedStones = (GameState.state.sculptedStones || 0) + 1;
    }
    
    this.convertStonesToPyramids();
    UI.update();
  },

  // Convert player's sculpted stones to pyramids
  convertStonesToPyramids() {
    const stonesPerPyramid = CONFIG.STONES_PER_PYRAMID || 10;
    const sculptedStones = GameState.state.sculptedStones || 0;
    
    if (sculptedStones >= stonesPerPyramid) {
      const pyramidsToAdd = Math.floor(sculptedStones / stonesPerPyramid);
      GameState.state.pyramids = (GameState.state.pyramids || 0) + pyramidsToAdd;
      GameState.state.sculptedStones = sculptedStones % stonesPerPyramid;
      UI.update();
    }
  },

  updateWorkerProduction() {
    if (!GameState.state.workers) return;
    
    const now = Date.now();
    
    // Get max investors based on upgrades
    const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
    const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
    const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
    const maxInvestors = baseCapacity + hireCapacityBonus;
    
    // Process each top-level worker tier
    for (let i = 1; i <= maxInvestors; i++) {
      const workerId = i.toString();
      const worker = GameState.state.workers[workerId];
      
      if (!worker || !worker.unlocked) continue;
      
      // Update this worker and all sub-workers recursively
      this.updateWorkerRecursive(worker, now);
    }
  },

  // Compute offline production for a single worker (and its subtree) using closed-form math
  // This avoids per-second simulation and calculates aggregate production over the full time period
  computeOfflineForWorkerAggregate(worker, effectiveSeconds, speedMultiplier, depth = 0) {
    if (!worker || !worker.unlocked) {
      return { pyramidsGained: 0, finalState: null };
    }

    const clicksPerStone = CONFIG.CLICKS_PER_STONE || 10;
    const stonesPerPyramid = CONFIG.STONES_PER_PYRAMID || 10;
    const decayRate = CONFIG.getEffectiveDecayRate(GameState.state.apUpgrades);
    const decayMultiplier = Math.pow(1 - decayRate, depth + 1);
    
    // Calculate max hires with decay
    const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
    const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
    const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
    const baseMaxHires = baseCapacity + hireCapacityBonus;
    const maxHires = Math.floor(baseMaxHires * decayMultiplier);
    
    // Check if worker should stop producing (has maxed out hires)
    const currentSubWorkers = worker.subWorkers?.length || 0;
    const hasReachedMaxHires = currentSubWorkers >= maxHires;
    
    let totalPyramidsGained = 0;
    
    // If worker has maxed hires and stops after max, only compute subtree production
    if (CONFIG.WORKER_STOPS_AFTER_MAX_HIRES && hasReachedMaxHires && maxHires > 0) {
      // Worker doesn't produce, but sub-workers do
      if (worker.subWorkers && worker.subWorkers.length > 0) {
        for (let subWorker of worker.subWorkers) {
          const subResult = this.computeOfflineForWorkerAggregate(subWorker, effectiveSeconds, speedMultiplier, depth + 1);
          totalPyramidsGained += subResult.pyramidsGained;
        }
      }
      return { pyramidsGained: totalPyramidsGained, finalState: worker };
    }
    
    // Compute production for this worker
    const workerClickInterval = CONFIG.WORKER_CLICK_INTERVAL || 1000;
    const clicksPerSecond = (1000 / workerClickInterval) * decayMultiplier * speedMultiplier;
    const totalClicks = clicksPerSecond * effectiveSeconds;
    
    // Add existing progress
    let stoneProgress = (worker.stoneProgress || 0) + totalClicks;
    let sculptedStones = worker.sculptedStones || 0;
    let pyramids = worker.pyramids || 0;
    
    // Convert stone progress to sculpted stones
    const stonesProduced = Math.floor(stoneProgress / clicksPerStone);
    stoneProgress = stoneProgress % clicksPerStone;
    sculptedStones += stonesProduced;
    
    // Convert sculpted stones to pyramids
    const pyramidsProduced = Math.floor(sculptedStones / stonesPerPyramid);
    sculptedStones = sculptedStones % stonesPerPyramid;
    pyramids += pyramidsProduced;
    
    totalPyramidsGained += pyramidsProduced;
    
    // Update worker state
    worker.stoneProgress = stoneProgress;
    worker.sculptedStones = sculptedStones;
    worker.pyramids = pyramids;
    worker.decayMultiplier = decayMultiplier;
    worker.depth = depth;
    
    // Handle hiring of sub-workers (simplified - hire all at once based on pyramids)
    if (maxHires > 0 && !hasReachedMaxHires) {
      const pyramidsPerHire = CONFIG.WORKER_PYRAMIDS_PER_ADDITIONAL_HIRE || 10;
      const shouldHaveSubWorkers = Math.min(
        Math.floor(pyramids / pyramidsPerHire),
        maxHires
      );
      
      // Create any missing sub-workers
      if (!worker.subWorkers) worker.subWorkers = [];
      while (worker.subWorkers.length < shouldHaveSubWorkers) {
        const newSubWorker = {
          tier: (worker.tier || 1) + 1,
          parentId: worker.id || 'unknown',
          unlocked: true,
          hires: 0,
          pyramids: 0,
          stoneProgress: 0,
          sculptedStones: 0,
          lastTickTime: Date.now(),
          subWorkers: [],
          id: `${worker.tier || 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          depth: depth + 1,
          decayMultiplier: Math.pow(1 - decayRate, depth + 2)
        };
        worker.subWorkers.push(newSubWorker);
      }
      worker.hires = worker.subWorkers.length;
    }
    
    // Recursively compute production for existing sub-workers
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        const subResult = this.computeOfflineForWorkerAggregate(subWorker, effectiveSeconds, speedMultiplier, depth + 1);
        totalPyramidsGained += subResult.pyramidsGained;
      }
    }
    
    return { pyramidsGained: totalPyramidsGained, finalState: worker };
  },

  // Calculate offline progress - simulates production at 50% efficiency
  calculateOfflineProgress(timeAwayMs) {
    // Cap offline time to 24 hours
    const cappedTimeMs = Math.min(timeAwayMs, CONFIG.MAX_OFFLINE_TIME || 86400000);
    
    // Get offline speed multiplier from base + upgrades
    const offlineSpeedLevel = GameState.state.apUpgrades?.workerSpeedOffline || 0;
    const offlineBonus = CONFIG.getUpgradeEffect('workerSpeedOffline', offlineSpeedLevel);
    const offlineMultiplier = CONFIG.OFFLINE_SPEED_MULTIPLIER_BASE + offlineBonus;
    
    // Calculate effective time with offline multiplier
    const effectiveTimeMs = cappedTimeMs * offlineMultiplier;
    const effectiveSeconds = effectiveTimeMs / 1000;
    
    let pyramidsGained = 0;
    const initialPyramids = GameState.state.pyramids || 0;
    
    // Get worker speed multiplier
    const workerSpeedLevel = GameState.state.apUpgrades?.workerSpeedOnline || 0;
    const speedBonus = CONFIG.getUpgradeEffect('workerSpeedOnline', workerSpeedLevel);
    const speedMultiplier = 1.0 + speedBonus;
    
    // Get max investors
    const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
    const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
    const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
    const maxInvestors = baseCapacity + hireCapacityBonus;
    
    // Use closed-form aggregate calculation (fast path)
    if (!CONFIG.DEBUG_OFFLINE_PARITY) {
      // Process each top-level worker using analytic formula
      for (let i = 1; i <= maxInvestors; i++) {
        const workerId = i.toString();
        const worker = GameState.state.workers[workerId];
        
        if (!worker || !worker.unlocked) continue;
        
        // Compute production for this worker and its entire subtree
        const result = this.computeOfflineForWorkerAggregate(worker, effectiveSeconds, speedMultiplier, 0);
        pyramidsGained += result.pyramidsGained;
      }
      
      // Collect all pyramids from workers after offline calculation
      this.collectAllWorkerPyramids();
    } else {
      // DEBUG MODE: Use old per-second simulation for comparison
      console.warn('⚠️ DEBUG_OFFLINE_PARITY enabled - using slow per-second simulation');
      
      const secondsToSimulate = Math.floor(effectiveSeconds);
      const workerSnapshot = JSON.parse(JSON.stringify(GameState.state.workers || {}));
      
      for (let i = 0; i < secondsToSimulate; i++) {
        const now = Date.now() - (secondsToSimulate - i) * 1000;
        
        for (let j = 1; j <= maxInvestors; j++) {
          const workerId = j.toString();
          const worker = GameState.state.workers[workerId];
          
          if (!worker || !worker.unlocked) continue;
          
          this.updateWorkerRecursive(worker, now);
        }
        
        this.collectAllWorkerPyramids();
      }
      
      pyramidsGained = (GameState.state.pyramids || 0) - initialPyramids;
      console.log(`DEBUG: Per-second simulation gave ${pyramidsGained} pyramids`);
    }
    
    return {
      timeAway: cappedTimeMs,
      pyramidsGained: pyramidsGained,
      offlineMultiplier: offlineMultiplier
    };
  },

  // Collect all pyramids from workers and add to player total
  collectAllWorkerPyramids() {
    if (!GameState.state.workers) return;
    
    const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
    const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
    const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
    const maxInvestors = baseCapacity + hireCapacityBonus;
    
    for (let i = 1; i <= maxInvestors; i++) {
      const workerId = i.toString();
      const worker = GameState.state.workers[workerId];
      
      if (!worker || !worker.unlocked) continue;
      
      // Collect from this worker and all sub-workers recursively
      this.collectWorkerPyramidsRecursive(worker);
    }
  },

  // Recursively collect pyramids from a worker and its sub-workers
  collectWorkerPyramidsRecursive(worker) {
    if (!worker) return;
    
    // Add worker's pyramids to player total
    if (worker.pyramids && worker.pyramids > 0) {
      GameState.state.pyramids = (GameState.state.pyramids || 0) + worker.pyramids;
      worker.pyramids = 0;
    }
    
    // Collect from sub-workers
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        this.collectWorkerPyramidsRecursive(subWorker);
      }
    }
  },

  updateWorkerRecursive(worker, now, depth = 0) {
    if (!worker) return;
    
    const clicksPerStone = CONFIG.CLICKS_PER_STONE || 10;
    const stonesPerPyramid = CONFIG.STONES_PER_PYRAMID || 10;
    
    // Use effective decay rate from AP upgrades
    const decayRate = CONFIG.getEffectiveDecayRate(GameState.state.apUpgrades);
    
    // Calculate decay multiplier - tier 1 (depth 0) STARTS at 80% efficiency
    // This means depth 0 gets (1-0.2)^1 = 0.8, depth 1 gets (1-0.2)^2 = 0.64, etc.
    const decayMultiplier = Math.pow(1 - decayRate, depth + 1);
    
    // Store the decay multiplier on the worker for display purposes
    worker.decayMultiplier = decayMultiplier;
    worker.depth = depth;
    
    // Calculate max hires with decay - use upgraded capacity
    const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
    const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
    const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
    const baseMaxHires = baseCapacity + hireCapacityBonus;
    const maxHires = Math.floor(baseMaxHires * decayMultiplier);
    
    // Check if worker should stop producing
    const currentSubWorkers = worker.subWorkers?.length || 0;
    const hasReachedMaxHires = currentSubWorkers >= maxHires;
    
    // If WORKER_STOPS_AFTER_MAX_HIRES is enabled and worker has maxed out hires
    if (CONFIG.WORKER_STOPS_AFTER_MAX_HIRES && hasReachedMaxHires && maxHires > 0) {
      // Worker has hired all possible sub-workers, STOP producing
      // Only update sub-workers recursively
      if (worker.subWorkers && worker.subWorkers.length > 0) {
        for (let subWorker of worker.subWorkers) {
          this.updateWorkerRecursive(subWorker, now, depth + 1);
        }
      }
      return; // Exit here - don't produce anything
    }
    
    // If maxHires is 0, this worker is at the bottom and CAN work (but can't hire)
    if (maxHires === 0) {
      // Worker at bottom of pyramid - still produces but cannot hire
      const deltaTime = now - (worker.lastTickTime || now);
      worker.lastTickTime = now;
      
      const workerSpeedLevel = GameState.state.apUpgrades?.workerSpeedOnline || 0;
      const speedBonus = CONFIG.getUpgradeEffect('workerSpeedOnline', workerSpeedLevel);
      const speedMultiplier = 1.0 + speedBonus;
      const workerClickInterval = CONFIG.WORKER_CLICK_INTERVAL || 1000;
      const clicksPerSecond = (1000 / workerClickInterval) * decayMultiplier;
      
      const secondsElapsed = deltaTime / 1000;
      const clicksToAdd = secondsElapsed * clicksPerSecond * speedMultiplier;
      
      worker.stoneProgress = (worker.stoneProgress || 0) + clicksToAdd;
      
      while (worker.stoneProgress >= clicksPerStone) {
        worker.stoneProgress -= clicksPerStone;
        worker.sculptedStones = (worker.sculptedStones || 0) + 1;
      }
      
      while (worker.sculptedStones >= stonesPerPyramid) {
        worker.sculptedStones -= stonesPerPyramid;
        worker.pyramids = (worker.pyramids || 0) + 1;
      }
      
      // No sub-workers can be hired, so return
      return;
    }
    
    // If we reach here, worker has NOT maxed out and CAN still produce
    const deltaTime = now - (worker.lastTickTime || now);
    worker.lastTickTime = now;
    
    // Get speed multiplier from AP upgrades
    const workerSpeedLevel = GameState.state.apUpgrades?.workerSpeedOnline || 0;
    const speedBonus = CONFIG.getUpgradeEffect('workerSpeedOnline', workerSpeedLevel);
    const speedMultiplier = 1.0 + speedBonus;
    
    // Workers click based on WORKER_CLICK_INTERVAL, modified by decay
    const workerClickInterval = CONFIG.WORKER_CLICK_INTERVAL || 1000;
    const clicksPerSecond = (1000 / workerClickInterval) * decayMultiplier;
    
    // Calculate clicks for this worker
    const secondsElapsed = deltaTime / 1000;
    const clicksToAdd = secondsElapsed * clicksPerSecond * speedMultiplier;
    
    // Add clicks to stone progress
    worker.stoneProgress = (worker.stoneProgress || 0) + clicksToAdd;
    
    // Convert stone progress to sculpted stones
    while (worker.stoneProgress >= clicksPerStone) {
      worker.stoneProgress -= clicksPerStone;
      worker.sculptedStones = (worker.sculptedStones || 0) + 1;
    }
    
    // Convert sculpted stones to pyramids
    while (worker.sculptedStones >= stonesPerPyramid) {
      worker.sculptedStones -= stonesPerPyramid;
      worker.pyramids = (worker.pyramids || 0) + 1;
    }
    
    // Check if this worker can hire a sub-worker (with decayed max)
    this.checkAndHireSubWorkers(worker, maxHires, depth);
    
    // Update all sub-workers recursively (increment depth)
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        this.updateWorkerRecursive(subWorker, now, depth + 1);
      }
    }
  },

  checkAndHireSubWorkers(worker, maxHires, depth = 0) {
    if (!CONFIG.RECURSIVE_WORKERS_ENABLED) return;
    if (!worker.subWorkers) worker.subWorkers = [];
    
    // Calculate effective max hires based on decay
    // For depth 0 (player's direct hire, tier 1), apply decay: floor(5 * 0.8) = 4
    let effectiveMaxHires = maxHires;
    
    // If this is a tier 1 worker (player's direct hire) at depth 0
    if (worker.tier === 1 && depth === 0) {
      const decayRate = CONFIG.getEffectiveDecayRate(GameState.state.apUpgrades);
      const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
      const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
      const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
      effectiveMaxHires = Math.floor((baseCapacity + hireCapacityBonus) * (1 - decayRate));
      
      // Store this on the worker for display purposes
      worker.maxHires = effectiveMaxHires;
      
      console.log(`Tier 1 investor (depth 0) max hires after decay: ${effectiveMaxHires} (base: ${baseCapacity}, decay: ${(decayRate * 100).toFixed(0)}%)`);
    }
    
    const currentSubWorkers = worker.subWorkers.length;
    
    // If already at max hires for this depth, stop
    if (currentSubWorkers >= effectiveMaxHires) {
      return;
    }
    
    const ownPyramids = worker.pyramids || 0;
    
    // Calculate how many sub-workers they should have based on pyramids
    // Formula: floor(pyramids / 10), capped at effectiveMaxHires
    const pyramidsPerHire = CONFIG.WORKER_PYRAMIDS_PER_ADDITIONAL_HIRE || 10;
    const shouldHaveSubWorkers = Math.min(
      Math.floor(ownPyramids / pyramidsPerHire),
      effectiveMaxHires  // Enforce the decayed cap
    );
    
    // Hire ONE new sub-worker if needed (not all at once)
    if (currentSubWorkers < shouldHaveSubWorkers && currentSubWorkers < effectiveMaxHires) {
      // Use effective decay rate from AP upgrades
      const decayRate = CONFIG.getEffectiveDecayRate(GameState.state.apUpgrades);
      const decayMultiplier = Math.pow(1 - decayRate, depth + 1);
      
      const newSubWorker = {
        tier: (worker.tier || 1) + 1,
        parentId: worker.id || 'unknown',
        unlocked: true,
        hires: 0,
        pyramids: 0,
        stoneProgress: 0,
        sculptedStones: 0,
        lastTickTime: Date.now(),
        subWorkers: [],
        id: `${worker.tier || 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        depth: depth + 1,
        decayMultiplier: decayMultiplier
      };
      
      worker.subWorkers.push(newSubWorker);
      const percentageEfficiency = (decayMultiplier * 100).toFixed(1);
      const nextDepthMaxHires = Math.floor((CONFIG.WORKER_MAX_HIRES_PER_TIER || 5) * decayMultiplier);
      console.log(`🎉 Investor tier ${worker.tier} (depth ${depth}, ${(worker.decayMultiplier * 100).toFixed(1)}% eff) hired sub-investor #${worker.subWorkers.length}/${effectiveMaxHires} at depth ${depth + 1} (${percentageEfficiency}% eff, max ${nextDepthMaxHires} future hires, ${ownPyramids} pyramids)`);
    }
    
    // Update hires count to match actual sub-workers
    worker.hires = worker.subWorkers.length;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}

console.log('✅ GameEngine module loaded');

// UI System - Display updates and user interactions

// MARK: - Initialization & Setup

const UI = {
  // DOM element references (cached for performance)
  elements: {},
  
  // session flag to prevent duplicate popups
  _victoryPopupShown: false,

  // Initialize UI
  init: function() {
    console.log('🎨 UI.init()');
    
    // Set up tab switching
    this.setupTabs();
    
    // Set up main stone button
    this.setupMainStoneButton();
    
    // Set up worker hire buttons
    this.setupWorkerHireButtons();
    
    // Set up prestige button
    this.setupPrestigeButton();
    
    // Set up AP upgrade purchase buttons
    this.setupAPUpgradeButtons();
    
    // Set up collect pyramids button
    this.setupCollectPyramidsButton();
    
    // Set up debug display toggle
    this.setupDebugDisplayToggle();
    
    // Initial render
    this.update();
    
    console.log('✅ UI initialized');
  },

  setupTabs() {
    const tabs = document.querySelectorAll('.top-tab');
    const screens = document.querySelectorAll('.tab-screen');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab-target');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active screen
        screens.forEach(screen => {
          if (screen.id === `${targetId}-screen`) {
            screen.classList.add('active');
          } else {
            screen.classList.remove('active');
          }
        });
      });
    });
  },

  setupMainStoneButton() {
    const btn = document.getElementById('btn-main-sculpt');
    if (btn) {
      btn.addEventListener('click', () => {
        if (GameEngine && GameEngine.clickStone) {
          GameEngine.clickStone();
        }
      });
    }
  },

  setupWorkerHireButtons() {
    // Get maximum possible investors based on upgrades
    const maxInvestors = this.getMaxInvestorSlots();
    
    for (let i = 1; i <= maxInvestors; i++) {
      const hireBtn = document.getElementById(`btn-hire-worker${i}`);
      if (hireBtn && !hireBtn.dataset.listenerAttached) {
        // Mark as having listener attached to avoid duplicates
        hireBtn.dataset.listenerAttached = 'true';
        
        hireBtn.addEventListener('click', () => {
          const workerId = i.toString();
          
          // Ensure workers object exists
          if (!GameState.state.workers) {
            GameState.state.workers = {};
          }
          
          // Initialize worker if it doesn't exist
          if (!GameState.state.workers[workerId]) {
            GameState.state.workers[workerId] = {
              unlocked: false,
              hires: 0,
              pyramids: 0,
              stoneProgress: 0,
              sculptedStones: 0,
              lastTickTime: Date.now(),
              subWorkers: [] // Initialize empty subWorkers array
            };
          }
          
          // Mark as unlocked (hired) but start with 0 sub-workers
          GameState.state.workers[workerId].unlocked = true;
          GameState.state.workers[workerId].hires = 0;
          GameState.state.workers[workerId].lastTickTime = Date.now();
          GameState.state.workers[workerId].tier = i;
          
          // Calculate max hires using the config function
          // For tier 1, this will apply decay: Math.floor(5 * 0.8) = 4
          const maxHires = CONFIG.getMaxHiresForTier(1, GameState.state.apUpgrades);
          GameState.state.workers[workerId].maxHires = maxHires;
          
          // Hide hire button immediately
          const workerRow = document.querySelector(`.worker-row[data-worker="${i}"]`);
          if (workerRow) {
            workerRow.classList.remove('locked');
            const hireSection = workerRow.querySelector('.worker-section-hire');
            if (hireSection) {
              hireSection.style.display = 'none';
            }
          }
          
          this.update();
          
          console.log(`Investor ${i} hired with max ${maxHires} sub-investors (decay applied for tier 1)`);
        });
      }
    }
  },

  getMaxInvestorSlots() {
    const baseCapacity = CONFIG.BASE_HIRE_CAPACITY || 5;
    const hireCapacityLevel = GameState.state.apUpgrades?.hireCapacity || 0;
    const hireCapacityBonus = CONFIG.getUpgradeEffect('hireCapacity', hireCapacityLevel);
    return baseCapacity + hireCapacityBonus;
  },

  ensureInvestorRowsExist() {
    const workersScroll = document.getElementById('workers-scroll');
    if (!workersScroll) return;
    
    const maxInvestors = this.getMaxInvestorSlots();
    const existingRows = workersScroll.querySelectorAll('.worker-row');
    const existingCount = existingRows.length;
    
    // Create additional rows if needed
    if (existingCount < maxInvestors) {
      for (let i = existingCount + 1; i <= maxInvestors; i++) {
        const pyramidsRequired = i * 10;
        const workerRow = this.createInvestorRow(i, pyramidsRequired);
        workersScroll.appendChild(workerRow);
      }
      
      // Only re-setup hire buttons if we added new rows
      this.setupWorkerHireButtons();
    }
  },

  createInvestorRow(investorNum, pyramidsRequired) {
    const div = document.createElement('div');
    div.className = 'worker-row locked';
    div.setAttribute('data-worker', investorNum);
    div.setAttribute('data-unlock-requirement', pyramidsRequired);
    
    div.innerHTML = `
      <div class="worker-section worker-section-hire">
        <button class="worker-hire-btn" id="btn-hire-worker${investorNum}">
          Hire
        </button>
      </div>
      <div class="worker-section worker-section-avatar">
        <div class="worker-avatar">
          <span class="worker-avatar-label">Investor ${investorNum}</span>
        </div>
      </div>
      <div class="worker-section-connector left">
        <span class="connector-text">who recruited</span>
      </div>
      <div class="worker-section worker-section-hires">
        <div class="worker-hires-box">
          <span class="worker-hires-count" id="worker${investorNum}-hires">0</span>
        </div>
        <span class="worker-hires-label">Investors</span>
      </div>
      <div class="worker-section-connector right">
        <span class="connector-text">and combined made</span>
      </div>
      <div class="worker-section worker-section-pyramids">
        <div class="worker-pyramids-box">
          <span class="worker-pyramids-count" id="worker${investorNum}-pyramids">0</span>
        </div>
        <span class="worker-pyramids-label">Pyramids</span>
      </div>
      <div class="worker-locked-overlay">
        <span class="locked-text">🔒 Locked (need ${pyramidsRequired} 🔺)</span>
      </div>
    `;
    
    return div;
  },

  setupPrestigeButton() {
    const prestigeBtn = document.getElementById('btn-prestige');
    if (prestigeBtn) {
      prestigeBtn.addEventListener('click', () => {
        if (Prestige && Prestige.canPrestige()) {
          // Confirm before prestiging
          const apGain = Prestige.calculateAPGain();
          const confirm = window.confirm(
            `Reset everything for +${apGain} Alien Points?\n\n` +
            `You will keep:\n` +
            `- Your Alien Points\n` +
            `- Your AP Upgrades\n\n` +
            `You will lose:\n` +
            `- All pyramids\n` +
            `- All investors\n` +
            `- All progress`
          );
          
          if (confirm) {
            Prestige.performPrestige();
          }
        }
      });
    }
  },

  setupAPUpgradeButtons() {
    const cards = document.querySelectorAll('.ap-upgrade-card');
    cards.forEach(card => {
      const buyBtn = card.querySelector('.ap-upgrade-buy');
      const upgradeId = card.getAttribute('data-upgrade-id');
      
      if (buyBtn && upgradeId) {
        buyBtn.addEventListener('click', () => {
          const currentLevel = GameState.state.apUpgrades?.[upgradeId] || 0;
          const cost = CONFIG.getUpgradeCost(upgradeId, currentLevel);
          const canAfford = (GameState.state.alienPoints || 0) >= cost;
          const canPurchase = CONFIG.canPurchaseUpgrade(upgradeId, currentLevel, GameState.state.apUpgrades || {});
          
          if (canAfford && canPurchase && cost !== Infinity) {
            // Deduct AP cost
            GameState.state.alienPoints -= cost;
            
            // Increment upgrade level
            if (!GameState.state.apUpgrades) {
              GameState.state.apUpgrades = {};
            }
            GameState.state.apUpgrades[upgradeId] = (GameState.state.apUpgrades[upgradeId] || 0) + 1;
            
            const newLevel = GameState.state.apUpgrades[upgradeId];
            const upgradeName = CONFIG.UPGRADES[upgradeId]?.name || upgradeId;
            
            console.log(`✅ Purchased ${upgradeName} level ${newLevel} for ${cost} AP`);
            
            // Update UI
            this.update();
            
            // Save game
            SaveLoad.save();
          } else {
            // Show why purchase failed
            if (!canAfford) {
              console.log(`❌ Cannot afford ${upgradeId} - need ${cost} AP, have ${GameState.state.alienPoints}`);
            } else if (!canPurchase) {
              console.log(`❌ Cannot purchase ${upgradeId} - requirements not met`);
            }
          }
        });
      }
    });
  },

  setupCollectPyramidsButton() {
    const btn = document.getElementById('btn-collect-pyramids');
    if (btn && !btn.dataset.listenerAttached) {
      btn.dataset.listenerAttached = 'true';
      btn.addEventListener('click', () => {
        if (typeof GameEngine !== 'undefined' && GameEngine.collectAllWorkerPyramids) {
          GameEngine.collectAllWorkerPyramids();
          this.update();
        }
      });
    }
  },

  setupDebugDisplayToggle() {
    const debugDisplay = document.getElementById('debug-display');
    const toggle = document.getElementById('debug-display-toggle');
    if (debugDisplay && toggle) {
      toggle.addEventListener('click', () => {
        debugDisplay.classList.toggle('collapsed');
      });
    }
  },

  updatePrestigeButton() {
    const canPrestige = Prestige.canPrestige();
    const prestigeArea = document.getElementById('alien-arrival-area');
    const prestigeBackdrop = document.getElementById('alien-arrival-backdrop');
    // Show the alien pyramid (prestige) button if player has at least the minimum pyramids for 1 AP
    const showPrestige = (GameState.state.pyramids || 0) >= (CONFIG.ap_base_pyramid_cost || 10000);
    const hasWon = Number(GameState.state.pyramids || 0) >= (CONFIG.PYRAMID_VICTORY_GOAL || 1000000000);

    if (showPrestige) {
      // Show prestige button
      if (prestigeArea) prestigeArea.classList.add('visible');
      if (prestigeBackdrop) prestigeBackdrop.classList.add('visible');
      
      // Update prestige display values
      const pyramids = GameState.state.pyramids || 0;
      const apGain = Prestige.calculateAPGain();
      
      const pyramidCountEl = document.getElementById('prestige-pyramid-count');
      const apAmountEl = document.getElementById('prestige-ap-amount');
      const prestigeSellEl = document.querySelector('#btn-prestige .prestige-sell');
      const prestigeTitleEl = document.querySelector('#alien-arrival-area .prestige-title');

      if (hasWon) {
        if (prestigeSellEl) {
          // "Join the aliens" with each word on a new line, font size 12px
          prestigeSellEl.innerHTML = "Join<br>the<br>aliens";
          prestigeSellEl.style.fontSize = "14px";
        }
        if (prestigeTitleEl) prestigeTitleEl.textContent = "🚀 Ascend to the stars! 🚀";
      } else {
        if (prestigeSellEl) {
          prestigeSellEl.textContent = "SELL";
          prestigeSellEl.style.fontSize = ""; // Reset to default
        }
        if (prestigeTitleEl) prestigeTitleEl.textContent = "🛸 Aliens have arrived! 🛸";
      }

      if (pyramidCountEl) pyramidCountEl.textContent = pyramids.toExponential(2);
      if (apAmountEl) apAmountEl.textContent = apGain;
    } else {
      // Hide prestige button
      if (prestigeArea) prestigeArea.classList.remove('visible');
      if (prestigeBackdrop) prestigeBackdrop.classList.remove('visible');
    }
  },

  updateWorkerUnlockStates() {
    const pyramidCount = GameState.state.pyramids || 0;
    const maxInvestors = this.getMaxInvestorSlots();
    
    // Ensure all investor rows exist
    this.ensureInvestorRowsExist();
    
    // Check each worker row
    for (let i = 1; i <= maxInvestors; i++) {
      const workerRow = document.querySelector(`.worker-row[data-worker="${i}"]`);
      if (!workerRow) continue;
      
      const unlockRequirement = parseInt(workerRow.getAttribute('data-unlock-requirement'));
      const worker = GameState.state.workers?.[i.toString()];
      const isUnlocked = worker?.unlocked || false;
      
      // If already unlocked (hired), keep it unlocked and hide hire button
      if (isUnlocked) {
        workerRow.classList.remove('locked');
        
        // Hide the hire button section once hired
        const hireSection = workerRow.querySelector('.worker-section-hire');
        if (hireSection) {
          hireSection.style.display = 'none';
        }
        continue;
      }
      
      // Check if player has enough pyramids to show hire button
      if (pyramidCount >= unlockRequirement) {
        workerRow.classList.remove('locked');
        
        // Show hire button section
        const hireSection = workerRow.querySelector('.worker-section-hire');
        if (hireSection) {
          hireSection.style.display = 'block';
        }
      } else {
        // Not enough pyramids - keep locked
        if (!workerRow.classList.contains('locked')) {
          workerRow.classList.add('locked');
        }
        
        // Hide hire button section when locked
        const hireSection = workerRow.querySelector('.worker-section-hire');
        if (hireSection) {
          hireSection.style.display = 'none';
        }
      }
    }
  },

  // MARK: - Helper Functions

  // Helper: Calculate total hires recursively
  getTotalHiresRecursive(worker) {
    if (!worker) return 0;
    
    let total = worker.subWorkers?.length || 0;
    
    // Add sub-workers' hires recursively
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let sub of worker.subWorkers) {
        total += this.getTotalHiresRecursive(sub);
      }
    }
    
    return total;
  },

  // Helper: Calculate total pyramids recursively
  getTotalPyramidsRecursive(worker) {
    if (!worker) return 0;
    
    let total = worker.pyramids || 0;
    
    // Add sub-workers' pyramids recursively
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let sub of worker.subWorkers) {
        total += this.getTotalPyramidsRecursive(sub);
      }
    }
    
    return total;
  },

  // Helper: Format large numbers
  formatNumber(num) {
    if (num >= 1000) {
      return num.toExponential(2);
    }
    return Math.floor(num).toString();
  },

  // Helper: Update DOM element
  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  },

  // MARK: - Main Update Functions

  // Main update function
  update: function() {
    if (!GameState || !GameState.state) return;
    
    var state = GameState.state;
    var stonesPerPyramid = CONFIG.STONES_PER_PYRAMID || 10;
    var clicksPerStone = CONFIG.CLICKS_PER_STONE || 10;
    
    // Update stone progress
    var stoneProgress = document.getElementById('current-stone-progress');
    var stoneMax = document.getElementById('current-stone-max');
    if (stoneProgress) stoneProgress.textContent = state.stoneProgress || 0;
    if (stoneMax) stoneMax.textContent = clicksPerStone;
    
    // Update sculpted stones
    var sculptedCount = document.getElementById('sculpted-stones-count');
    var stonesPerPyramidEl = document.getElementById('stones-per-pyramid');
    if (sculptedCount) sculptedCount.textContent = state.sculptedStones || 0;
    if (stonesPerPyramidEl) stonesPerPyramidEl.textContent = stonesPerPyramid;
    
    // Update pyramids - use scientific notation if >= 1000
    var pyramidsCount = document.getElementById('pyramids-count');
    if (pyramidsCount) {
      const pyramids = state.pyramids || 0;
      pyramidsCount.textContent = this.formatNumber(pyramids);
    }
    
    // Update AP
    var apBalance = document.getElementById('ap-balance-amount');
    if (apBalance) apBalance.textContent = state.alienPoints || 0;
    
    // Update AP displays on Production and Stats screens
    this.updateAPDisplays();

    // Update worker counts with recursive totals
    const maxInvestors = this.getMaxInvestorSlots();
    for (let i = 1; i <= maxInvestors; i++) {
      const workerId = i.toString();
      const worker = GameState.state.workers?.[workerId];
      
      if (worker && worker.unlocked) {
        const hiresEl = document.getElementById(`worker${i}-hires`);
        const pyramidsEl = document.getElementById(`worker${i}-pyramids`);
        
        const totalHires = this.getTotalHiresRecursive(worker);
        const totalPyramids = this.getTotalPyramidsRecursive(worker);
        
        if (hiresEl) hiresEl.textContent = this.formatNumber(totalHires);
        if (pyramidsEl) pyramidsEl.textContent = this.formatNumber(totalPyramids);
      }
    }

    // Update worker unlock states
    this.updateWorkerUnlockStates();

    // Update AP upgrade cards
    this.updateAPUpgradeCards();

    // Update debug display
    this.updateDebugDisplay();
    
    // Update stats tab
    this.updateStatsTab();

    // Update pyramids per second
    this.updatePyramidsPerSecond();

    // Update prestige button visibility and values
    this.updatePrestigeButton();

    // Show victory popup if AP goal is reached and popup not shown (single source of truth)
    const hasWon = Number(GameState.state.pyramids || 0) >= (CONFIG.PYRAMID_VICTORY_GOAL || 1000000000);
    if (hasWon && !this._victoryPopupShown) {
      GameState.state.hasWon = true;
      this._victoryPopupShown = true;
      setTimeout(() => this.showVictoryPopup(), 100);
    }

    // Update AP Store tab visibility
    this.updateAPStoreTabVisibility();
  },

  updateAPStoreTabVisibility() {
    const pyramids = GameState.state.pyramids || 0;
    const apStoreTab = document.getElementById('ap-store-tab');

    // Reveal the AP Store tab if:
    // - player has reached the pyramid unlock threshold, OR
    // - player has earned AP (prestiged at least once), OR
    // - the unlocked flag was previously set (persisted in save)
    const hasAP = (GameState.state.alienPoints || 0) > 0;
    const unlockedFlag = GameState.state.apStoreUnlocked === true;

    if (!apStoreTab) return;

    if (pyramids >= 100000 || hasAP || unlockedFlag) {
      if (apStoreTab.classList.contains('hidden')) {
        apStoreTab.classList.remove('hidden');
        console.log('🎉 AP Store unlocked!');
      }

      // Persist the unlocked state so it stays visible after reloads
      if (!GameState.state.apStoreUnlocked) {
        GameState.state.apStoreUnlocked = true;
      }
    }
  },

  // Show offline progress popup
  showOfflineProgressPopup(offlineData) {
    if (!offlineData || offlineData.pyramidsGained <= 0) return;
    
    const popup = document.getElementById('offline-progress-popup');
    if (!popup) return;
    
    // Format time away
    const timeAwaySeconds = Math.floor(offlineData.timeAway / 1000);
    let timeAwayText = '';
    if (timeAwaySeconds < 60) {
      timeAwayText = `${timeAwaySeconds} seconds`;
    } else if (timeAwaySeconds < 3600) {
      timeAwayText = `${Math.floor(timeAwaySeconds / 60)} minutes`;
    } else {
      const hours = Math.floor(timeAwaySeconds / 3600);
      const minutes = Math.floor((timeAwaySeconds % 3600) / 60);
      timeAwayText = `${hours}h ${minutes}m`;
    }
    
    // Update popup content
    document.getElementById('offline-time-away').textContent = timeAwayText;
    document.getElementById('offline-pyramids-gained').textContent = this.formatNumber(offlineData.pyramidsGained);
    document.getElementById('offline-efficiency').textContent = `${Math.floor(offlineData.offlineMultiplier * 100)}%`;
    
    // Show popup
    popup.classList.remove('hidden');
    
    // Close button
    const closeBtn = document.getElementById('offline-popup-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        popup.classList.add('hidden');
      };
    }
  },

  updateAPDisplays() {
    const ap = GameState.state.alienPoints || 0;
    const apStoreUnlocked = GameState.state.apStoreUnlocked === true;

    // Show AP displays if player has earned any AP or AP Store is unlocked
    if (ap > 0 || apStoreUnlocked) {
      // Production screen AP badge
      const productionBadge = document.getElementById('production-ap-badge');
      const productionAmount = document.getElementById('production-ap-amount');
      if (productionBadge && !productionBadge.classList.contains('visible')) {
        productionBadge.classList.add('visible');
      }
      if (productionAmount) productionAmount.textContent = ap;

      // Stats screen AP section
      const statsSection = document.getElementById('stats-ap-section');
      const statsAmount = document.getElementById('stats-ap-amount');
      if (statsSection) statsSection.style.display = '';
      if (statsAmount) statsAmount.textContent = ap;
    }
  },

  updatePyramidsPerSecond() {
    let totalStonesPerSecond = 0;
    const maxInvestorsPPS = this.getMaxInvestorSlots();
    
    // Calculate production from all worker tiers
    for (let tier = 1; tier <= maxInvestorsPPS; tier++) {
      const workerId = tier.toString();
      const worker = GameState.state.workers?.[workerId];
      
      if (!worker || !worker.unlocked) continue;
      
      totalStonesPerSecond += this.calculateWorkerProductionRecursive(worker, 0);
    }
    
    const pyramidsPerSecond = totalStonesPerSecond / CONFIG.STONES_PER_PYRAMID;
    
    this.updateElement('stats-pyramids-per-second', pyramidsPerSecond.toFixed(2));
  },

  calculateWorkerProductionRecursive(worker, depth = 0) {
    if (!worker) return 0;
    
    const clicksPerSecond = 1000 / (CONFIG.WORKER_CLICK_INTERVAL || 1000);
    const clicksPerStone = CONFIG.CLICKS_PER_STONE || 10;
    const stonesPerSecond = clicksPerSecond / clicksPerStone;
    
    const baseDecay = CONFIG.INVESTOR_DECAY_RATE || 0.2;
    let decayRate = baseDecay;
    if (typeof Prestige !== 'undefined' && Prestige.getUpgradeLevel) {
      const decayReduction = Prestige.getUpgradeLevel('investorDecayRate');
      decayRate = Math.max(0, baseDecay - (decayReduction * 0.02));
    }
    
    const decayMultiplier = Math.pow(1 - decayRate, depth + 1);
    const baseMaxHires = CONFIG.WORKER_MAX_HIRES_PER_TIER || 5;
    const maxHires = Math.floor(baseMaxHires * decayMultiplier);
    
    const currentSubWorkers = worker.subWorkers?.length || 0;
    const hasMaxedOut = currentSubWorkers >= maxHires && maxHires > 0;
    
    let totalProduction = 0;
    
    if (!hasMaxedOut || maxHires === 0) {
      let production = stonesPerSecond * decayMultiplier;
      if (typeof Prestige !== 'undefined' && Prestige.getUpgradeLevel) {
        const onlineBonus = Prestige.getUpgradeLevel('workerSpeedOnline');
        if (onlineBonus > 0) {
          production *= (1 + onlineBonus * 0.01);
        }
      }
      totalProduction += production;
    }
    
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let subWorker of worker.subWorkers) {
        totalProduction += this.calculateWorkerProductionRecursive(subWorker, depth + 1);
      }
    }
    
    return totalProduction;
  },

  // MARK: - Tab-Specific Update Functions

  updateStatsTab: function() {
    const state = GameState.state;
    const clicksPerStone = CONFIG.CLICKS_PER_STONE || 10;
    const stonesPerPyramid = CONFIG.STONES_PER_PYRAMID || 10;

    // Calculate total pyramids
    let totalPyramids = state.pyramids || 0;
    const maxInvestors = this.getMaxInvestorSlots();
    for (let i = 1; i <= maxInvestors; i++) {
      const worker = state.workers?.[i.toString()];
      if (worker && worker.unlocked) {
        totalPyramids += this.getTotalPyramidsRecursive(worker);
      }
    }

    // Calculate pyramids per second (rough estimate)
    const workerSpeedLevel = GameState.state.apUpgrades?.workerSpeedOnline || 0;
    const speedBonus = CONFIG.getUpgradeEffect('workerSpeedOnline', workerSpeedLevel);
    const speedMultiplier = 1.0 + speedBonus;
    const workerClickInterval = CONFIG.WORKER_CLICK_INTERVAL || 1000;
    const clicksPerSecond = 1000 / workerClickInterval;
    
    // Count total active workers (simplified)
    let totalWorkers = 0;
    const maxInvestorsForStats = this.getMaxInvestorSlots();
    for (let i = 1; i <= maxInvestorsForStats; i++) {
      const worker = state.workers?.[i.toString()];
      if (worker && worker.unlocked) {
        totalWorkers += this.countActiveWorkersRecursive(worker);
      }
    }
    
    const stonesPerSecond = (totalWorkers * clicksPerSecond * speedMultiplier) / clicksPerStone;
    const pyramidsPerSecond = stonesPerSecond / stonesPerPyramid;

    // Update total pyramids
    const totalPyramidsEl = document.getElementById('stats-total-pyramids');
    if (totalPyramidsEl) totalPyramidsEl.textContent = totalPyramids.toLocaleString();

    // Update pyramids per second
    const pyramidsPerSecEl = document.getElementById('stats-pyramids-per-second');
    if (pyramidsPerSecEl) {
      if (pyramidsPerSecond < 0.01) {
        pyramidsPerSecEl.textContent = pyramidsPerSecond.toExponential(2);
      } else if (pyramidsPerSecond < 1) {
        pyramidsPerSecEl.textContent = pyramidsPerSecond.toFixed(3);
      } else {
        pyramidsPerSecEl.textContent = pyramidsPerSecond.toFixed(2);
      }
    }

    // Update player stats
    const playerStoneProgress = document.getElementById('stats-player-stone-progress');
    const playerSculpted = document.getElementById('stats-player-sculpted');
    const playerPyramids = document.getElementById('stats-player-pyramids');

    if (playerStoneProgress) {
      playerStoneProgress.textContent = `${Math.floor(state.stoneProgress || 0)}/${clicksPerStone}`;
    }
    if (playerSculpted) {
      playerSculpted.textContent = `${(state.sculptedStones || 0)}/${stonesPerPyramid}`;
    }
    if (playerPyramids) {
      playerPyramids.textContent = (state.pyramids || 0).toLocaleString();
    }

    // Update investors list
    const investorsList = document.getElementById('stats-investors-list');
    if (investorsList) {
      investorsList.innerHTML = '';
      const maxInvestorsForList = this.getMaxInvestorSlots();
      
      for (let tier = 1; tier <= maxInvestorsForList; tier++) {
        const workerId = tier.toString();
        const worker = state.workers?.[workerId];
        
        if (!worker || !worker.unlocked) continue;

        const directHires = worker.subWorkers?.length || 0;
        const totalHires = this.getTotalHiresRecursive(worker);
        const totalPyramids = this.getTotalPyramidsRecursive(worker);

        const investorDiv = document.createElement('div');
        investorDiv.className = 'stats-investor';
        investorDiv.innerHTML = `
          <div class="stats-investor-title">Investor ${tier}</div>
          <div class="stats-row">
            <span>Direct Hires:</span>
            <span class="stats-value">${directHires}</span>
          </div>
          <div class="stats-row">
            <span>Total Downline:</span>
            <span class="stats-value">${totalHires}</span>
          </div>
          <div class="stats-row">
            <span>Total Pyramids:</span>
            <span class="stats-value">${totalPyramids}</span>
          </div>
        `;
        investorsList.appendChild(investorDiv);
      }
    }
  },

  // MARK: - Debug Display

  // Helper: Count active workers with decay consideration
  countActiveWorkersRecursive(worker) {
    if (!worker) return 0;
    
    const decayMultiplier = worker.decayMultiplier || 1.0;
    let total = decayMultiplier; // This worker contributes based on their efficiency
    
    // Add sub-workers' contribution recursively
    if (worker.subWorkers && worker.subWorkers.length > 0) {
      for (let sub of worker.subWorkers) {
        total += this.countActiveWorkersRecursive(sub);
      }
    }
    
    return total;
  },

  // Update debug display
  updateDebugDisplay: function() {
    if (!CONFIG.debug_mode) return;

    const state = GameState.state;
    const clicksPerStone = CONFIG.CLICKS_PER_STONE || 10;
    const stonesPerPyramid = CONFIG.STONES_PER_PYRAMID || 10;

    // Calculate total pyramids
    let totalPyramids = state.pyramids || 0;
    const maxInvestorsDebug = this.getMaxInvestorSlots();
    for (let i = 1; i <= maxInvestorsDebug; i++) {
      const worker = state.workers?.[i.toString()];
      if (worker && worker.unlocked) {
        totalPyramids += worker.pyramids || 0;
      }
    }

    // Update total pyramids
    const totalPyramidsEl = document.getElementById('debug-total-pyramids');
    if (totalPyramidsEl) totalPyramidsEl.textContent = totalPyramids;

    // Update player stats
    const playerStoneProgress = document.getElementById('debug-player-stone-progress');
    const playerSculpted = document.getElementById('debug-player-sculpted');
    const playerPyramids = document.getElementById('debug-player-pyramids');

    if (playerStoneProgress) {
      playerStoneProgress.textContent = `${(state.stoneProgress || 0).toFixed(2)}/${clicksPerStone}`;
    }
    if (playerSculpted) {
      playerSculpted.textContent = `${(state.sculptedStones || 0)}/${stonesPerPyramid}`;
    }
    if (playerPyramids) {
      playerPyramids.textContent = state.pyramids || 0;
    }

    // Update investor stats
    const investorsList = document.getElementById('debug-investors-list');
    if (investorsList) {
      let html = '';
      const maxInvestorsDebugList = this.getMaxInvestorSlots();
      
      for (let i = 1; i <= maxInvestorsDebugList; i++) {
        const workerId = i.toString();
        const worker = state.workers?.[workerId];
        
        if (worker && worker.unlocked) {
          const stoneProgress = (worker.stoneProgress || 0).toFixed(2);
          const sculptedStones = worker.sculptedStones || 0;
          const pyramids = worker.pyramids || 0;
          const hires = worker.hires || 0;

          html += `
            <div class="debug-investor">
              <div class="debug-investor-title">Investor ${i}</div>
              <div class="debug-row">
                <span>Sub-Investors:</span>
                <span class="debug-value">${hires}</span>
              </div>
              <div class="debug-row">
                <span>Stone Progress:</span>
                <span class="debug-value">${stoneProgress}/${clicksPerStone}</span>
              </div>
              <div class="debug-row">
                <span>Sculpted Stones:</span>
                <span class="debug-value">${sculptedStones}/${stonesPerPyramid}</span>
              </div>
              <div class="debug-row">
                <span>Pyramids:</span>
                <span class="debug-value">${pyramids}</span>
              </div>
            </div>
          `;
        }
      }
      
      investorsList.innerHTML = html || '<div style="color: #666; font-style: italic;">No investors hired yet</div>';
    }
  },

  // MARK: - AP Upgrade Cards

  // Update AP upgrade cards
  updateAPUpgradeCards() {
    // Ensure investor rows exist based on current hireCapacity
    this.ensureInvestorRowsExist();
    
    const cards = document.querySelectorAll('.ap-upgrade-card');
    cards.forEach(card => {
      const upgradeId = card.getAttribute('data-upgrade-id');
      const currentLevel = GameState.state.apUpgrades?.[upgradeId] || 0;
      
      // Update level display
      const levelEl = card.querySelector('.ap-level');
      if (levelEl) levelEl.textContent = currentLevel;
      
      // Update cost display (cost for NEXT level)
      const costEl = card.querySelector('.ap-cost');
      if (costEl) {
        const nextCost = CONFIG.getUpgradeCost(upgradeId, currentLevel);
        const isMaxed = nextCost === Infinity;
        
        // Update the cost value
        costEl.textContent = isMaxed ? 'MAXED' : nextCost;
        
        // Hide/show the " AP" text after the cost
        const costContainer = costEl.parentElement;
        if (costContainer) {
          const textNodes = Array.from(costContainer.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
          textNodes.forEach(node => {
            if (node.textContent.includes('AP')) {
              node.textContent = isMaxed ? '' : ' AP';
            }
          });
        }
      }
      
      // Update effect display (effect at CURRENT level)
      const effectEl = card.querySelector('.effect-value');
      if (effectEl) {
        const currentEffect = CONFIG.getUpgradeEffect(upgradeId, currentLevel);
        const upgrade = CONFIG.UPGRADES[upgradeId];
        
        if (upgrade) {
          // Format based on upgrade type
          if (upgradeId === 'workerSpeedOnline' || upgradeId === 'workerSpeedOffline' || upgradeId === 'apGainBonus') {
            // Percentage bonuses
            effectEl.textContent = `+${(currentEffect * 100).toFixed(0)}%`;
          } else if (upgradeId === 'investorDecayRate') {
            // Decay reduction (negative value, show as reduction)
            effectEl.textContent = `${(Math.abs(currentEffect) * 100).toFixed(0)}%`;
          } else {
            // Flat values
            effectEl.textContent = `+${Math.floor(currentEffect)}`;
          }
        }
      }
      
      // Update current decay rate display
      if (upgradeId === 'investorDecayRate') {
        const currentDecayEl = card.querySelector('#current-decay-rate');
        if (currentDecayEl) {
          const effectiveDecay = CONFIG.getEffectiveDecayRate(GameState.state.apUpgrades);
          currentDecayEl.textContent = `${(effectiveDecay * 100).toFixed(0)}%`;
        }
      }
      
      // Update button state
      const buyBtn = card.querySelector('.ap-upgrade-buy');
      if (buyBtn) {
        const canAfford = (GameState.state.alienPoints || 0) >= CONFIG.getUpgradeCost(upgradeId, currentLevel);
        const canPurchase = CONFIG.canPurchaseUpgrade(upgradeId, currentLevel, GameState.state.apUpgrades || {});
        const isMaxed = currentLevel >= CONFIG.UPGRADES[upgradeId]?.maxLevel;
        
        buyBtn.disabled = !canAfford || !canPurchase || isMaxed;
        buyBtn.textContent = isMaxed ? 'MAX LEVEL' : 'Purchase';
      }
    });
  },

  // Show the victory popup after winning or after post-victory reset
  showVictoryPopup(isPostVictory = false) {
    if (!isPostVictory && this._victoryPopupShown) return;
    if (!isPostVictory) this._victoryPopupShown = true;

    // Remove any existing popup
    let existing = document.getElementById(isPostVictory ? 'post-victory-popup' : 'victory-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = isPostVictory ? 'post-victory-popup' : 'victory-popup';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = isPostVictory ? '10002' : '10001';

    const container = document.createElement('div');
    container.style.background = 'linear-gradient(135deg, #222 60%, #ffe082 100%)';
    container.style.border = '2px solid #ffe082';
    container.style.borderRadius = '18px';
    container.style.padding = '36px 28px';
    container.style.maxWidth = '420px';
    container.style.width = '90%';
    container.style.boxShadow = '0 12px 48px #000b, 0 0 30px #ffe08255';
    container.style.textAlign = 'center';

    if (!isPostVictory) {
      const title = document.createElement('h2');
      title.textContent = "You have ascended!";
      title.style.color = '#ffe082';
      title.style.marginBottom = '18px';
      container.appendChild(title);
    }

    const msg = document.createElement('div');
    msg.style.fontSize = '18px';
    msg.style.color = '#fff8e1';
    msg.style.marginBottom = '24px';
    msg.textContent = "With so many pyramids at your command, you have ascended to the stars. Join the aliens and take even more pyramids from other planets!";
    container.appendChild(msg);

    const btn = document.createElement('button');
    btn.textContent = "Continue";
    btn.style.padding = '12px 28px';
    btn.style.fontSize = '16px';
    btn.style.fontWeight = 'bold';
    btn.style.background = '#ffe082';
    btn.style.color = '#222';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      overlay.remove();
    };

    container.appendChild(btn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  },

  // Show the post-victory reset popup (calls the unified function)
  showPostVictoryResetPopup() {
    this.showVictoryPopup(true);
  },

};

console.log('✅ UI module loaded');

window.UI = UI;

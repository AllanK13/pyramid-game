// Save/Load System - Manages game persistence

const SaveLoad = {
  autosaveInterval: null,

  // Save game state to localStorage
  save() {
    if (!GameState || !GameState.state) {
      console.warn('Cannot save - GameState not initialized');
      return false;
    }

    try {
      const saveData = {
        version: '0.03',
        timestamp: Date.now(),
        
        // Always save AP and upgrades (NEVER reset)
        alienPoints: GameState.state.alienPoints || 0,
        apUpgrades: { ...GameState.state.apUpgrades } || {},
        
        // Current run progress
        stoneProgress: GameState.state.stoneProgress || 0,
        sculptedStones: GameState.state.sculptedStones || 0,
        pyramids: GameState.state.pyramids || 0,
        workers: this.serializeWorkers(GameState.state.workers),
        
        // Metadata
        lastSaveTime: Date.now(),
        // UI state
        apStoreUnlocked: GameState.state.apStoreUnlocked === true
      };

      const saveString = JSON.stringify(saveData);
      localStorage.setItem(CONFIG.SAVE_KEY, saveString);
      
      console.log('💾 Game saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Save failed:', error);
      return false;
    }
  },

  // Load game state from localStorage
  load() {
    try {
      const saveString = localStorage.getItem(CONFIG.SAVE_KEY);
      
      if (!saveString) {
        console.log('No save file found');
        return { loaded: false, offlineData: null };
      }

      const saveData = JSON.parse(saveString);
      
      // Restore AP and upgrades (ALWAYS preserved)
      GameState.state.alienPoints = saveData.alienPoints || 0;
      GameState.state.apUpgrades = saveData.apUpgrades || {
        startingStones: 0,
        startingPyramids: 0,
        workerSpeedOnline: 0,
        hireCapacity: 0,
        workerSpeedOffline: 0,
        apGainBonus: 0,
        investorDecayRate: 0
      };
      
      // Restore current run progress
      GameState.state.stoneProgress = saveData.stoneProgress || 0;
      GameState.state.sculptedStones = saveData.sculptedStones || 0;
      GameState.state.pyramids = saveData.pyramids || 0;
      GameState.state.workers = this.deserializeWorkers(saveData.workers);
      
      // Restore timestamps
      GameState.state.lastSaveTime = saveData.lastSaveTime || Date.now();
      // Restore AP Store unlocked state (persisted after first prestige)
      GameState.state.apStoreUnlocked = saveData.apStoreUnlocked === true;
      GameState.state.lastUpdateTime = Date.now();
      
      console.log('📂 Game loaded successfully');
      console.log(`   AP: ${GameState.state.alienPoints}`);
      console.log(`   Pyramids: ${GameState.state.pyramids}`);
      console.log(`   Upgrades:`, GameState.state.apUpgrades);
      
      // Calculate offline progress
      const now = Date.now();
      const lastSave = saveData.lastSaveTime || now;
      const timeAway = now - lastSave;
      
      // Only calculate offline progress if away longer than configured minimum
      const minOfflineMs = CONFIG.OFFLINE_MIN_TIME_MS || 60000;
      let offlineData = null;
      if (timeAway > minOfflineMs && GameState.state.workers) {
        console.log(`⏰ Time away: ${Math.floor(timeAway / 1000 / 60)} minutes`);
        offlineData = GameEngine.calculateOfflineProgress(timeAway);
        console.log(`   Offline pyramids gained: ${offlineData.pyramidsGained}`);
      }
      
      return { loaded: true, offlineData: offlineData };
    } catch (error) {
      console.error('❌ Load failed:', error);
      return { loaded: false, offlineData: null };
    }
  },

  // Serialize workers for saving
  serializeWorkers(workers) {
    if (!workers) return {};
    
    const serialized = {};
    for (let key in workers) {
      serialized[key] = { ...workers[key] };
    }
    return serialized;
  },

  // Deserialize workers from save
  deserializeWorkers(workersData) {
    if (!workersData) {
      return {
        1: { tier: 1, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        2: { tier: 2, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        3: { tier: 3, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        4: { tier: 4, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        5: { tier: 5, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 }
      };
    }
    
    return workersData;
  },

  // Export save as downloadable text file
  exportSaveFile() {
    if (!GameState || !GameState.state) {
      console.warn('Cannot export - GameState not initialized');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const saveData = {
      gameVersion: '0.02',
      exportDate: new Date().toISOString(),
      
      // Permanent progress (NEVER reset)
      alienPoints: GameState.state.alienPoints || 0,
      apUpgrades: GameState.state.apUpgrades || {},
      
      // Current run progress
      pyramids: GameState.state.pyramids || 0,
      sculptedStones: GameState.state.sculptedStones || 0,
      stoneProgress: GameState.state.stoneProgress || 0,
      
      // Metadata
      lastSaveTime: GameState.state.lastSaveTime || Date.now(),
      // UI state
      apStoreUnlocked: GameState.state.apStoreUnlocked === true
    };

    const saveText = this.formatSaveAsText(saveData);
    const blob = new Blob([saveText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pyramid-scheme-save-${timestamp}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('📤 Save file exported');
  },

  // Format save data as readable text
  formatSaveAsText(saveData) {
    const lines = [];
    lines.push('='.repeat(50));
    lines.push('PYRAMID SCHEME - SAVE FILE');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Export Date: ${saveData.exportDate}`);
    lines.push(`Game Version: ${saveData.gameVersion}`);
    lines.push('');
    lines.push('-'.repeat(50));
    lines.push('PERMANENT PROGRESS (Never Reset)');
    lines.push('-'.repeat(50));
    lines.push(`Alien Points (AP): ${saveData.alienPoints}`);
    lines.push('');
    lines.push('AP Upgrades Purchased:');
    for (let [key, value] of Object.entries(saveData.apUpgrades)) {
      if (value > 0) {
        const upgradeName = CONFIG.UPGRADES[key]?.name || key;
        lines.push(`  - ${upgradeName}: Level ${value}`);
      }
    }
    lines.push('');
    lines.push('-'.repeat(50));
    lines.push('CURRENT RUN PROGRESS');
    lines.push('-'.repeat(50));
    lines.push(`Pyramids: ${saveData.pyramids}`);
    lines.push(`Sculpted Stones: ${saveData.sculptedStones}`);
    lines.push(`Stone Progress: ${saveData.stoneProgress.toFixed(2)}`);
    lines.push('');
    lines.push('-'.repeat(50));
    lines.push('SAVE DATA (for import)');
    lines.push('-'.repeat(50));
    lines.push(JSON.stringify(saveData, null, 2));
    lines.push('');
    lines.push('='.repeat(50));
    
    return lines.join('\n');
  },

  // Import save from text (looks for JSON in the text)
  importSaveFile(fileContent) {
    try {
      // Try to find JSON in the file
      const jsonMatch = fileContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in file');
      }

      const saveData = JSON.parse(jsonMatch[0]);
      
      // Restore permanent progress
      GameState.state.alienPoints = saveData.alienPoints || 0;
      GameState.state.apUpgrades = saveData.apUpgrades || {};
      
      // Restore current run
      GameState.state.pyramids = saveData.pyramids || 0;
      GameState.state.sculptedStones = saveData.sculptedStones || 0;
      GameState.state.stoneProgress = saveData.stoneProgress || 0;
      
      // Save to localStorage
      this.save();
      // Restore AP Store unlocked flag if present in imported save
      GameState.state.apStoreUnlocked = saveData.apStoreUnlocked === true;
      
      console.log('📥 Save file imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Import failed:', error);
      alert('Failed to import save file. Please check the file format.');
      return false;
    }
  },

  // Delete save (WARNING: Permanent!)
  deleteSave() {
    const confirm = window.confirm(
      'Are you sure you want to delete your save?\n\n' +
      'This will reset EVERYTHING including AP and upgrades!\n\n' +
      'This action cannot be undone!'
    );
    
    if (!confirm) return false;
    
    const doubleConfirm = window.confirm(
      'FINAL WARNING!\n\n' +
      'You will lose ALL progress including:\n' +
      `- ${GameState.state.alienPoints} Alien Points\n` +
      '- All AP upgrades\n' +
      '- All pyramids and progress\n\n' +
      'Delete save file?'
    );
    
    if (!doubleConfirm) return false;
    
    // Zero out all values instead of deleting
    GameState.state = {
      // Player progress - all zeroed
      stoneProgress: 0,
      sculptedStones: 0,
      pyramids: 0,
      alienPoints: 0,
      
      // Workers - reset to default state
      workers: {
        1: { tier: 1, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        2: { tier: 2, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        3: { tier: 3, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        4: { tier: 4, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 },
        5: { tier: 5, unlocked: false, hires: 0, pyramids: 0, stoneProgress: 0, sculptedStones: 0, lastTickTime: Date.now(), subWorkers: [], depth: 0, decayMultiplier: 1.0 }
      },
      
      // AP upgrades - all zeroed
      apUpgrades: {
        startingStones: 0,
        startingPyramids: 0,
        workerSpeedOnline: 0,
        hireCapacity: 0,
        workerSpeedOffline: 0,
        apGainBonus: 0,
        investorDecayRate: 0
      },

      // UI state
      apStoreUnlocked: false,
      
      // Timestamps
      lastSaveTime: Date.now(),
      lastUpdateTime: Date.now()
    };
    
    // Save the zeroed state to localStorage
    this.save();
    console.log('🗑️ Save file reset to zero');
    
    // Reload page to start fresh
    window.location.reload();
    return true;
  },

  // Start autosave interval
  startAutosave() {
    // Save every minute
    this.autosaveInterval = setInterval(() => {
      this.save();
    }, CONFIG.AUTOSAVE_INTERVAL || 60000);
    
    console.log('⏰ Autosave enabled (every 60 seconds)');
  },

  // Stop autosave
  stopAutosave() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
      console.log('⏰ Autosave disabled');
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SaveLoad;
}

console.log('✅ SaveLoad module loaded');

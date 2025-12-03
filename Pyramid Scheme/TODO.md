# Pyramid Scheme - Development TODO

## 📋 Version 0.03 Roadmap

### High Priority (For v0.03)
- [x] **Make AP Upgrades Purchasable**
  - ✅ Add click handlers to purchase buttons
  - ✅ Deduct AP cost and increment level
  - ✅ Apply effects immediately
  - ✅ Show purchase confirmation/feedback
  - ✅ Update UI to reflect new bonuses
  - ✅ Fix upgrade effect calculations (hireCapacity, workerSpeedOnline)

- [x] **Offline Progress System**
  - ✅ Track time away from game (lastSaveTime)
  - ✅ Calculate production during offline period
  - ✅ Apply offline speed multiplier (50% base + upgrades)
  - ✅ Show "Welcome Back" summary popup with gains
  - ✅ Cap offline time to 24 hours max
  - ✅ Simulates worker production accurately
  - ✅ Activated `workerSpeedOffline` upgrade

- [ ] **Implement Remaining Upgrade Functionality**
  - [ ] `startingStones` - Give bonus sculpted stones on prestige reset
  - [ ] `startingPyramids` - Give bonus pyramids on prestige reset
  - ✅ `apGainBonus` - Already implemented in Prestige.calculateAPGain()
  - ✅ `workerSpeedOffline` - Applied in offline calculations

- [x] **Economy Balancing**
  - ✅ Adjusted prestige requirement to 100,000 pyramids
  - ✅ Set AP upgrade costs based on power analysis
  - ✅ Balanced for 1-week completion timeline
  - ✅ Victory goal set to 1 billion pyramids

- [x] **Progressive UI Reveals**
  - ✅ Hide AP Store tab until 100k pyramids
  - ✅ Show AP displays after first prestige
  - ✅ Dynamic investor rows (6-10) based on hireCapacity

- Fix AP Store visibility upon prestige

- [ ] **Visual/Audio Feedback**
  - [ ] Add particle effects when pyramids complete
  - [ ] Add notification when investor hired
  - [ ] Add sound effects (optional, can be toggled)
  - [ ] Flash/highlight when milestone reached

## 🚀 Medium Priority

- [ ] Balance production rates and pyramid requirements
  - Current: 10 clicks → 1 stone, 10 stones → 1 pyramid, 10 pyramids → 1 hire
  - May need tuning for proper game pacing

- [ ] Add artwork
  - Custom avatar sprite
  - Stone/sculpted stone graphics
  - Pyramid model/icon
  - Alien ship graphic
  - Investor avatars

- [ ] Settings Tab/Panel
  - Toggle autosave on/off
  - Adjust autosave frequency
  - Toggle debug mode
  - Toggle sound effects
  - Volume controls

## 🎮 Nice-to-Have Features

- [ ] Achievements System
  - First pyramid built
  - First investor hired
  - Reach 1,000 pyramids
  - Reach 1,000,000 pyramids (prestige threshold)
  - Max out an investor's hires
  - Complete a full pyramid chain (5+ depth)
  - Earn first AP
  - Max out an AP upgrade

- [ ] Statistics Enhancements
  - Lifetime total pyramids built
  - Total time played
  - Total prestiges performed
  - Deepest pyramid chain achieved
  - Most productive investor (all-time)

- [ ] Quality of Life
  - Hotkeys for common actions (space to click stone, etc.)
  - Tooltips explaining mechanics
  - Tutorial/help system
  - Pyramid chain visualizer (tree diagram)

## 🔧 Code Quality & Refactoring

- [ ] Remove duplicate Config objects
  - CONFIG vs Config in config.js
  - Consolidate to single object

- [ ] Clean up unused worker.js module
  - Currently has old tier-based logic
  - Either remove or repurpose for new system

- [ ] Add JSDoc comments
  - Document all public functions
  - Add parameter and return type info

- [ ] Performance Optimization
  - Reduce UI update frequency for elements that don't change often
  - Optimize recursive calculations
  - Add requestAnimationFrame for animations

## 🐛 Known Issues to Fix

- [ ] Debug menu collapse requires re-initialization after page load
- [ ] Large numbers (e^notation) may not display consistently
- [ ] Deep pyramid chains (10+ levels) may cause performance issues

## 🎯 Future Versions (v0.04+)

- [ ] Multiple prestige layers
- [ ] Automation upgrades (auto-click, auto-hire, etc.)
- [ ] Different game modes/challenges
- [ ] Cloud save support
- [ ] Leaderboards
- [ ] Themed skins/visual customization

---

## Development Notes

### Current Version: 0.03
- Focus: AP upgrades functionality + offline progress
- Target: Make the core progression loop fully functional

### Testing Checklist for v0.03
- [ ] AP upgrade purchases work correctly
- [ ] AP costs scale properly
- [ ] Upgrade effects apply immediately
- [ ] Offline progress calculates accurately
- [ ] Welcome back popup shows correct gains
- [ ] Save/load preserves all AP upgrades
- [ ] Debug menu collapse works on page load

### Quick Debug Commands
```javascript
// Add AP for testing
GameState.state.alienPoints += 100;
UI.update();

// Add pyramids
GameState.state.pyramids += 1000000;
UI.update();

// Test offline progress (simulate 1 hour)
SaveLoad.save();
// Wait or manually modify lastUpdateTime
// Reload page
```

---

## Version History
- **v0.01** - Initial release with core gameplay
- **v0.02** - Prestige system, recursive investors, save/load
- **v0.03** - **[CURRENT]** AP upgrades functional, offline progress, QoL improvements

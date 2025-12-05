# Pyramid Scheme - Development TODO

## 📋 Version 0.11 Roadmap

### High Priority (For v0.11)

- check when speed is possible for 24 hours to beat game - 11,500/second?

- [ ] **Visual/Audio Feedback**
  - [ ] Add particle effects when pyramids complete
  - [ ] Add notification when investor hired
  - [ ] Add sound effects (optional, can be toggled)
  - [ ] Flash/highlight when milestone reached

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

## 🚀 Medium Priority

- [ ] Achievements System
  - First pyramid built
  - First investor hired
  - Reach 1,000 pyramids
  - Reach 10,000 pyramids (prestige threshold)
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

## 🎮 Nice-to-Have Features



## 🔧 Code Quality & Refactoring

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

## 🎯 Future Versions (v1.0+)

- [ ] Multiple prestige layers
- [ ] Automation upgrades (auto-click, auto-hire, etc.)
- [ ] Different game modes/challenges
- [ ] Cloud save support
- [ ] Leaderboards
- [ ] Themed skins/visual customization

---

## Development Notes

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
- **v0.03** - AP upgrades functional, offline progress, QoL improvements
- **v0.10** - **[CURRENT]** 

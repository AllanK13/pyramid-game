# Changelog

All notable changes to Pyramid Scheme will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### To Do
- Make AP upgrade purchase buttons functional
- Add offline progress calculation
- Add visual feedback for hiring and pyramid creation
- Add sound effects
- Add achievements system
- Add artwork for game elements (avatars, stones, pyramids, alien ship)

---

## [0.03] - 2025-01-XX (In Development)

### Added
- **Debug Menu Improvements**
  - Debug menu is now collapsible with click-to-toggle functionality
  - Arrow indicator (▼) shows collapsed/expanded state with smooth rotation animation
  - Menu content smoothly animates in/out when toggled
  - Saves screen space when collapsed while keeping menu accessible

### Changed
- Version bumped to 0.03
- Debug menu now starts expanded by default but can be collapsed

### Fixed
- Debug menu collapse toggle now works correctly
- Arrow indicator properly rotates on click

### In Progress
- AP upgrade purchase functionality
- Offline progress calculation

---

## [0.02] - 2025-01-XX

### Added
- **Prestige System (Functional)**
  - Alien prestige button appears in sky when player has 1,000,000+ pyramids
  - Purple pyramid-shaped button with glowing animation and floating effect
  - Shows current pyramid count and AP gain amount
  - Confirmation dialog before prestiging
  - Complete game reset while preserving AP and upgrades
  - AP calculation: floor(pyramids / 1,000,000) with bonus multipliers

- **Recursive Investor System**
  - Investors now automatically hire sub-investors when they build enough pyramids
  - Each investor can hire up to 5 sub-investors (affected by decay)
  - Sub-investors hire their own sub-investors, creating a pyramid structure
  - Sub-investors produce at reduced efficiency based on depth (20% decay per level)
  - Investors stop producing once they reach maximum sub-investor count
  - Infinite depth theoretically possible (limited by decay making deep levels ineffective)

- **Investor Decay Mechanic**
  - Base decay rate: 20% per tier depth
  - Tier 1 (player's direct hires): 80% efficiency, max 4 sub-investors
  - Tier 2 (sub-investors): 64% efficiency, max 3 sub-investors
  - Tier 3: 51.2% efficiency, max 2 sub-investors
  - Tier 4+: Rapidly diminishing returns
  - Decay affects both production speed AND max hire capacity
  - "Investor Decay Reduction" AP upgrade reduces decay by 2% per level (max 8 levels)

- **Save/Load System (Functional)**
  - Autosave every 60 seconds to localStorage
  - Manual save on page unload
  - Export save as downloadable .txt file with human-readable format
  - Import save from .txt file
  - Delete save with double confirmation dialog
  - Save preserves: AP, AP upgrades, current run progress, investor states
  - Save version tracking (v0.02)

- **AP Upgrades Display**
  - All 6 upgrade cards now show correct values
  - Real-time cost calculation for next level
  - Effect values display at current level
  - Purchase buttons show enabled/disabled states based on affordability
  - "MAX LEVEL" indicator when upgrade is maxed
  - Current decay rate shown in Investor Decay Reduction card

### Changed
- **UI/UX Improvements**
  - Debug display moved from top-left to bottom-right corner
  - Debug menu repositioned to top-right corner
  - Desert sand strip height increased from 33% to 50% for better visual balance
  - Removed unused "Sell pyramids for AP" UI element from desert
  - Alien prestige button text positioning fine-tuned

### Fixed
- Save file now correctly preserves AP and upgrades across prestiges
- Investor hire buttons now properly hide after hiring
- Worker unlock states update correctly based on pyramid count
- Scientific notation for large pyramid counts (1000+)
- Decay calculation now consistent across all depth levels

### Technical Details
- **New Configuration Options**:
  - `AP_SELL_BASE_COST`: 1,000,000 pyramids for 1 AP
  - `INVESTOR_DECAY_RATE`: 0.20 (20% decay)
  - `WORKER_STOPS_AFTER_MAX_HIRES`: true
  - `WORKER_PYRAMIDS_PER_ADDITIONAL_HIRE`: 10
  - `AUTOSAVE_INTERVAL`: 60000ms (1 minute)

- **Save File Format**:
  - Version: "0.02"
  - Timestamp: Unix timestamp
  - Permanent: alienPoints, apUpgrades
  - Current Run: stoneProgress, sculptedStones, pyramids, workers
  - Metadata: lastSaveTime, lastUpdateTime

- **Prestige Bonuses Applied**:
  - Starting Sculpted Stones: +1 per level
  - Legacy Pyramids: +1 per level
  - Bonuses apply immediately after prestige reset

### Developer Notes
- Debug mode enabled by default (`CONFIG.debug_mode = true`)
- Set `WORKER_CLICK_INTERVAL = 1` for fast testing
- Use "+100,000 Pyramids" debug button to quickly test prestige
- Export save before testing risky features
- Decay math: `efficiency = (1 - decayRate)^(depth + 1)`
- Max hires formula: `floor(baseCapacity * efficiency)`

### Known Issues
- AP upgrade purchase buttons not yet functional (display only)
- Offline progress not calculated when returning to game
- No visual/audio feedback for investor hiring events
- Deep pyramid chains (5+ levels) provide minimal benefit due to decay
- No achievement tracking yet

---

## [0.01] - 2025-11-30 (Initial Release)

### Added
- **Core Gameplay**
  - Manual stone sculpting by clicking the stone button
  - Automatic conversion: 10 clicks → 1 stone → 10 stones = 1 pyramid
  - 5 investor tiers with unlock requirements (10, 20, 30, 40, 50 pyramids)
  - Investors automatically sculpt stones when hired
  - Investors hire invisible sub-workers (0-5 max) based on pyramid count
  - Investors stop producing once they reach 5 sub-workers

- **User Interface**
  - Three-tab navigation: Production, Stats, AP Store
  - **Production Tab**:
    - Sky section with animated sun and rays
    - Desert section with player character and stone button
    - Sculpted stones display (progress toward next pyramid)
    - Pyramid counter
    - Workers panel showing 5 investor rows with hire buttons
    - Each investor row displays: avatar, sub-workers count, pyramids made
  - **Stats Tab**:
    - Total pyramids across all investors
    - Real-time pyramids per second calculation
    - Player progress (stone progress, sculpted stones, pyramids)
    - Individual investor statistics in 2-column grid
    - All stats update live (10 times per second)
  - **AP Store Tab**:
    - 6 upgrades available (currently not purchasable):
      - Starting Sculpted Stones
      - Legacy Pyramids
      - Investor Speed Training
      - Increased Hire Capacity
      - Offline Efficiency
      - Alien Bargaining
    - Displays cost, current level, and effects for each upgrade

- **Visual Design**
  - Dark theme with blue/purple gradients
  - Golden accent color for important elements
  - Animated sun with rays in sky section
  - Desert gradient background
  - Styled cards and boxes with shadows and gradients
  - Responsive design for mobile and desktop

- **Debug Features**
  - Debug menu with quick-add buttons (enabled by default)
  - Debug display showing live game state
  - Buttons to add: stone clicks, sculpted stones, pyramids, AP
  - Real-time monitoring of all investors

- **Game Systems**
  - Modular JavaScript architecture (7 separate modules)
  - Configuration system (CONFIG object) with all tunable parameters
  - Game state management with centralized state object
  - Game loop running at 100ms intervals (10 ticks per second)
  - Autosave system (every 60 seconds)
  - localStorage persistence

- **Configuration**
  - 10 clicks = 1 sculpted stone
  - 10 sculpted stones = 1 pyramid
  - 10 pyramids = 1 sub-worker hire
  - Maximum 5 sub-workers per investor
  - 1 second interval per investor click (configurable)
  - Worker speed affected by AP upgrades (1% per level)

### Technical Details
- **Files**:
  - `index.html` - Main game file with embedded CSS
  - `js/config.js` - Configuration and constants
  - `js/gameState.js` - Central state management
  - `js/gameEngine.js` - Game loop and production logic
  - `js/workers.js` - Worker calculation system (legacy, unused)
  - `js/prestige.js` - Prestige system (placeholder)
  - `js/saveLoad.js` - Save/load system (placeholder)
  - `js/ui.js` - UI updates and event handlers
  - `TODO.md` - Development task tracker
  - `CHANGELOG.md` - This file

- **Browser Compatibility**: Modern browsers with ES6 support
- **No Dependencies**: Pure vanilla JavaScript, no frameworks required

### Known Issues
- AP upgrade purchases not yet implemented
- Prestige/AP selling system not yet functional
- Offline progress calculation not implemented
- No sound effects
- Workers module contains unused legacy code
- Duplicate CONFIG/Config objects consolidated but some references may remain

### Notes
- Initial proof-of-concept implementation
- Focus on core gameplay loop and visual design
- Debug mode enabled for testing and balancing
- Game is playable but lacks progression depth

---

## Version History Summary

- **v0.01** - Initial implementation with core gameplay, UI, and investor system
- **v0.02** - Added prestige system, recursive investors, save/load functionality, AP upgrade display fixes, and various balance and UI improvements
- **v0.03** - Debug menu improvements, version bump, and preparation for next development phase

[Unreleased]: https://github.com/yourusername/pyramid-scheme/compare/v0.03...HEAD
[0.03]: https://github.com/yourusername/pyramid-scheme/releases/tag/v0.03
[0.02]: https://github.com/yourusername/pyramid-scheme/releases/tag/v0.02
[0.01]: https://github.com/yourusername/pyramid-scheme/releases/tag/v0.01

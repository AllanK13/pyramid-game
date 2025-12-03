# Pyramid Game

A web-based incremental clicker game where you build pyramids and eventually become the aliens!

## How to Play

1. **Open `index.html`** in any modern web browser (Chrome, Firefox, Edge, etc.)
2. **Click the stone button** to sculpt stones
3. **10 clicks** completes one Sculpted Stone
4. **10 Sculpted Stones** automatically combine into 1 Pyramid
5. **10 Pyramids** allows you to hire your first worker
6. **Workers automate production** - they click stones automatically at 1 click per second
7. **Workers hire more workers** - when they produce 10 pyramids, they hire sub-workers automatically
8. **Sell pyramids for Alien Points (AP)** when you have enough pyramids (100,000+)
9. **Spend AP on permanent upgrades** that carry over when you prestige

## Game Features

### Core Mechanics
- **Manual clicking** to start production
- **Automated workers** that follow the same rules as you
- **Multi-tier worker system** - workers hire their own workers recursively (pure math, no individual objects)
- **Resource conversions** - Clicks → Stones → Pyramids
- **Prestige system** - Sell pyramids for Alien Points and reset

### Prestige (Alien Points)
- Sell large quantities of pyramids to gain AP
- AP persists through resets
- Spend AP on permanent upgrades:
  - **Starting Sculpted Stones** - Begin runs with bonus stones
  - **Legacy Pyramids** - Begin runs with pyramids already built
  - **Increased Hire Capacity** - Hire more workers per tier
  - **Worker Speed Training** - Workers click faster while online
  - **Offline Efficiency** - Improve worker production while offline
  - **Alien Bargaining** - Gain more AP when selling pyramids

### Offline Progress
- Game auto-saves every 10 minutes
- Workers continue producing while you're offline (at reduced speed)
- Progress is calculated when you return
- Offline time capped at 24 hours

### Victory Condition
- Accumulate **1,000,000 Alien Points**
- Become the aliens and depart in your mega-pyramid!

## Configuration

All game balance parameters can be adjusted in `js/config.js`:

- **CLICKS_PER_STONE** - Clicks needed to complete a stone (default: 10)
- **STONES_PER_PYRAMID** - Stones needed for a pyramid (default: 10)
- **PYRAMIDS_PER_HIRE** - Pyramids needed to hire a worker (default: 10)
- **MAX_HIRES_BASE** - Maximum workers you can hire at tier 1 (default: 5)
- **WORKER_CLICK_INTERVAL** - Time between worker clicks in ms (default: 1000)
- **AP_SELL_BASE_COST** - Pyramids needed for AP conversion (default: 100,000)
- **AP_VICTORY_GOAL** - AP needed to win (default: 1,000,000)
- And many more...

## File Structure

```
Pyramid Scheme - JavaScript/
├── index.html          # Main game file with UI
├── js/
│   ├── config.js       # Configuration and tunable parameters
│   ├── gameState.js    # Game state management
│   ├── workers.js      # Worker production calculations
│   ├── gameEngine.js   # Main game loop
│   ├── prestige.js     # AP system and upgrades
│   ├── saveLoad.js     # Save/load and offline progress
│   └── ui.js           # UI updates and interactions
└── README.md           # This file
```

## Technical Details

- **Pure JavaScript** - No frameworks required
- **localStorage** for save data
- **Modular architecture** - Easy to extend and modify
- **Background math** - Workers are simulated mathematically, not as individual objects
- **Configurable** - All game values easily adjustable
- **Offline compatible** - Works completely offline once loaded

## Tips

1. **Click manually** at the start to get your first pyramids
2. **Hire your first worker** as soon as you can (10 pyramids)
3. **Workers are exponential** - they hire their own workers automatically
4. **Check the AP Store** to see what upgrades are available
5. **Don't prestige too early** - wait until you can get a meaningful amount of AP
6. **Offline progress** lets the game run while you're away
7. **Victory requires patience** - reaching 1,000,000 AP is the ultimate goal

## Troubleshooting

**Game not loading?**
- Make sure you're opening `index.html` directly in a browser
- Check the browser console (F12) for errors

**Save not working?**
- Ensure your browser allows localStorage
- Try a different browser

**Offline progress not calculating?**
- Save data is only loaded on page refresh
- Check that autosave is working (saves every 10 minutes)

**Want to reset everything?**
- Open browser console (F12)
- Type: `SaveLoad.deleteSave()`
- Refresh the page

## Future Enhancements (Not Yet Implemented)

- Visual worker animations
- Achievement system
- More detailed statistics
- Sound effects and music
- Mobile optimization
- Cloud save support

---

Enjoy building your pyramid empire! 🔺👽

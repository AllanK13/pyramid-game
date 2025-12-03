# Pyramid Game – Economy & Progression Design Doc

## 1. High-Level Overview

**Working title:** Pyramid Game / Stone-to-Pyramid Clicker  
**Platform:** Web browser (runs locally in the browser)  
**Core fantasy:** Start with a single rough stone block and, through clicking and automation, build vast numbers of pyramids. Trade pyramids to mysterious aliens for **Alien Points (AP)**, then use AP to break the limits of production and eventually *become* the aliens yourself.

The game is an incremental/idle clicker with:
- A **simple, readable core loop**
- Strong emphasis on **tunable parameters** (all key values are configurable)
- **Prestige layer** via Alien Points (AP)
- Support for **offline progress** through periodic autosaves

---

## 2. Core Player Loop

1. **Click to sculpt stone.**
   - The player starts with a single unsculpted stone block and a button to “Sculpt Stone.”
   - Each click applies 1 “sculpting progress” to the current stone.

2. **Complete a stone.**
   - After **10 clicks** (default), the stone becomes a **Sculpted Stone**.
   - The Sculpted Stone is added to the **Sculpted Stone Pile**.
   - A new **unsculpted stone** appears to be sculpted.

3. **Form pyramids from stones.**
   - Once there are **10 Sculpted Stones** (default) in the pile, they automatically combine into **1 Pyramid**.
   - The Sculpted Stone count decreases by 10; Pyramid count increases by 1.

4. **Accumulate pyramids to unlock hires.**
   - Once the player has **10 Pyramids** (default), they unlock the ability to **hire workers**.
   - Additional workers cost more pyramids (see below).

5. **Hire workers for automation.**
   - Hires automatically click their own stones at a fixed interval.
   - Workers follow the same rules as the player for sculpting and building pyramids.
   - As pyramids accumulate, they can be sold to aliens for **Alien Points (AP)** to progress the meta layer.

This loop repeats, with the player gradually shifting from **manual clicking** to **managing automation and prestige upgrades**.

---

## 3. Resources & Entities

### 3.1 Resources

- **Unsculpted Stone**
  - Not stored as a count; conceptually “the current stone being worked on.”
  - Tracks progress via a “click count” toward completion.

- **Sculpted Stones**
  - Integer count representing completed stone blocks.
  - Automatically convert into pyramids when enough are present.

- **Pyramids**
  - Mid-tier resource generated from Sculpted Stones.
  - Used to:
    - Unlock and hire workers
    - Eventually **sell to aliens** for **Alien Points (AP)**

- **Alien Points (AP)**
  - Prestige currency gained by “selling” large batches of pyramids.
  - Persist across resets.
  - Spent in an **AP Upgrade Store** to permanently improve various aspects of the game.

---

### 3.2 Workers

There are conceptually multiple **tiers** of workers, even if only the first tier is explicitly visualized.

- **Player (Tier 0)**
  - Manual clicking on a stone.
  - Rate: player-driven (no fixed interval).

- **Workers (Tier 1 and above)**
  - Each worker:
    - Clicks their own stone block **once per second** (default).
    - After **10 clicks**, they produce **1 Sculpted Stone**.
    - When their pool reaches **10 Sculpted Stones**, these combine into **1 Pyramid**.
    - After they have produced **10 Pyramids**, they are eligible to hire **their own worker**, following the same rules as the player.
  - **Tier 1 workers** are visible to the player. Higher-tier workers (Tier 2+) may exist only as **background calculations**, not visually represented.

Workers effectively form a **production tree**:
- The player hires Tier 1 workers.
- Tier 1 workers can hire Tier 2 workers.
- Tier 2 workers can hire Tier 3 workers, and so on.

(Exact depth and representation can be tuned in implementation.)

---

## 4. Hiring Rules & Limits

### 4.1 Base Hire Costs

**Default parameters:**
- **Clicks per Stone:** 10
- **Sculpted Stones per Pyramid:** 10
- **Pyramids per Hire:** 10
- **Max Hires (base):** 5
- **Worker Click Interval:** 1.0 second per click

#### Tier-0 (Player) Hire Cap
- The player can initially hire up to **5 workers** (default).
- Each worker costs **10 Pyramids**, so:
  - 1st worker: 10 Pyramids
  - 2nd worker: 20 Pyramids total (or individually defined, depending on implementation)
  - … up to 5 workers = 50 Pyramids total if linear

> Note: Exact pricing model (linear, exponential, etc.) is left as a tunable design detail.

#### Worker Auto-Hiring
- Each worker tracks their own pyramid production.
- After a worker has produced **10 Pyramids**, that worker can hire **one new worker** of the next tier (if under their hire cap).
- Upper tiers may be simulated mathematically rather than explicitly instantiated as game objects.

---

## 5. Configurable Parameters

All numbers below are considered **default values** and should be **easily modifiable** via a configuration system.

| Parameter                              | Description                                       | Default |
|----------------------------------------|---------------------------------------------------|---------|
| `clicks_per_stone`                     | Number of clicks to sculpt 1 stone               | 10      |
| `stones_per_pyramid`                   | Sculpted Stones needed for 1 Pyramid             | 10      |
| `pyramids_per_hire`                    | Pyramids required to unlock/hire a worker        | 10      |
| `max_hires_base`                       | Max hires the player can directly hire           | 5       |
| `worker_click_interval`                | Time between worker clicks (seconds)             | 1.0     |
| `autosave_interval`                    | Time between auto-saves (minutes)                | 10      |
| `offline_mode_enabled`                 | Whether offline progress is simulated            | true    |
| `ap_threshold_for_prestige`            | Min pyramids required to sell for 1 AP           | 100,000+ (tunable) |
| `ap_goal_to_win`                       | AP amount required to “become the aliens”        | 1,000,000 (example) |

Future configs might include:
- Pyramid stack multipliers for AP sales
- Per-upgrade scaling curves
- Tier-based worker efficiency modifiers

---

## 6. Prestige: Alien Points (AP)

### 6.1 Converting Pyramids to AP

Once the player has amassed a **large number of Pyramids** (e.g., 100,000 or 1,000,000+), they can **sell** them to the aliens:

- Selling pyramids:
  - **Consumes all pyramids** (resets pyramid count to 0).
  - **Fires all workers** (resets hires and worker tiers).
  - Essentially **restarts** the production layer.

In exchange, the player gains **Alien Points (AP)**:
- AP awarded can be based on:
  - Total pyramids sold
  - Number of “stacks” of pyramids (see multi-stack sales below)
  - A scaling formula (e.g., logarithmic, power-based, or piecewise).

### 6.2 Multi-Stack Sales

As production scales up, the player can earn AP more efficiently by selling **multiple stacks** of pyramids at once.

- Example:
  - A “stack” might be defined as 100,000 pyramids.
  - If the player has 500,000 pyramids, they can sell 5 stacks at once.
  - Each stack grants some amount of AP; selling multiple stacks increases AP in a meaningful but balanced way.

Exact stack size and AP conversion rates are tunable.

### 6.3 AP Persistence & Meta-Progression

- AP is **not reset** when pyramids and workers are wiped.
- AP can be spent on permanent **Upgrades** that boost future runs.
- The long-term goal is to reach a target AP (e.g., **1,000,000 AP**) to unlock the **final transformation**.

---

## 7. AP Upgrade Store

AP is spent to permanently improve various aspects of the game. All upgrade values and scaling should be easily modifiable.

### 7.1 Planned Upgrades

1. **Starting Sculpted Stones**
   - Effect: After selling pyramids (prestige), the next run **starts with X Sculpted Stones** already in your pile.
   - Benefit: Skips the earliest grind and accelerates ramp-up.

2. **Starting Pyramids**  
   *(Depends on the “Starting Stones” upgrade)*
   - Effect: After prestige, start with **X Pyramids** already completed.
   - Note: This upgrade might be locked until a certain rank of “Starting Sculpted Stones” is purchased.
   - Benefit: Rapidly unlock early workers in new runs.

3. **Increased Hire Capacity**
   - Effect: Increases the number of hires you and your workers can have.
     - Example: Increase max hires from 5 → 6 at the player level.
   - Design twist: As hire capacity increases at the top, **each lower tier’s hire capacity decreases very slightly**.
     - Example:
       - Player hire cap: 6
       - Tier 1 worker hire cap: 5.9
       - Tier 2 worker hire cap: 5.8
       - etc.
   - This introduces interesting balancing: more breadth at the top, slightly less branching per tier below.

4. **Worker Speed (Online)**
   - Effect: Decreases the **worker click interval**, increasing their speed.
     - Example: 1.0 s → 0.99 s → 0.98 s per click, etc.
   - Progression can be small incremental improvements, possibly with diminishing returns.

5. **Worker Speed (Offline Mode)**
   - Effect: Increases effective worker speed **while the game is offline**.
   - This may be a separate multiplier from the online speed to carefully balance offline vs online play.

### 7.2 Upgrade Design Notes

- Each upgrade should have:
  - A **base cost** in AP
  - A **cost scaling rule** (e.g., multiplicative)
  - A **maximum level** or asymptotic limit, if desired

- All of this should be data-driven/configurable, not hard-coded, for easy tuning.

---

## 8. Offline Progress & Saving

### 8.1 Autosave System

- The game should **run locally in a web browser**.
- An autosave is created every **10 minutes** (default).
- Data is stored locally (e.g., in `localStorage`, IndexedDB, or a local file-like approach).

### 8.2 Offline Progress Calculation

When the player opens the game:
1. Load the **last saved state**.
2. Compute the **time difference** between:
   - `last_save_time`
   - `current_time`
3. Simulate the game’s worker activity over that interval, applying:
   - Worker counts & speeds
   - Offline mode speed multipliers
   - Conversions from clicks → stones → pyramids

4. Update all resources (stones, pyramids, etc.) accordingly.

This ensures the player feels rewarded for coming back while keeping the simulation tractable.

---

## 9. Future Expansions (Not in v1, but planned concepts)

These are ideas for later versions or sequels and are **not required** in the initial implementation.

1. **Manual Pyramid Assembly**
   - Instead of pyramids forming automatically at 10 Sculpted Stones, the player (or a specialized worker) must **click on the stone pile** to assemble a Pyramid.
   - Adds a second “clicker” layer once the game is more advanced.

2. **Dedicated Pyramid Assembler Workers**
   - A second worker type whose job is to convert Sculpted Stones into Pyramids, possibly with:
     - Their own speed upgrades
     - Specialized AP upgrades

3. **Planetary-Scale Pyramid Collection (Sequel Hook)**
   - Once the player reaches the AP goal (e.g., 1,000,000 AP) and **becomes the aliens**, they depart in a **mega-pyramid** to other planets.
   - Follow-up systems could include:
     - Collecting pyramids **by the mass** from multiple planets
     - Planet-based modifiers and unique challenges
     - Multi-planet resource management

---

## 10. Endgame & Victory Condition

- **Goal:** Accumulate a very large amount of AP, such as **1,000,000 Alien Points**.
- Upon reaching this target:
  - The player is revealed to **become the aliens**.
  - They leave their world in a **mega-pyramid**.
  - Narrative payoff: they now travel to other planets to take their pyramids.

This can function as:
- A **soft ending** (roll credits, unlock sandbox mode)
- A **transition to a sequel** or extended content path

---

## 11. Summary

The design centers on a very clear and tunable structure:

- **Click → Sculpt Stone → Sculpted Stones → Pyramid → Hire Workers → AP Prestige → Upgrades → Repeat**

All key values (click counts, conversion rates, hire caps, worker speeds, AP thresholds, etc.) are:
- Set with sensible **default values**
- Intended to be **easily configurable** for balance and experimentation

This document should serve as the reference blueprint for implementing and iterating on the Pyramid Game’s economy and progression systems.

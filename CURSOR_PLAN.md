# Bloomly Match-3 — Cursor Prompt Planı

## Sıra: Her birini ayrı Cursor session'ında ver. Push YOK, her adımda test et.

---

## ADIM 1: Match-3 Engine + Game Screen

```
Read GAME_DESIGN_DOC.md first.

Create the core match-3 game engine and game screen using @shopify/react-native-skia (already installed).

1. Create src/game/engine.ts:
   - 8x8 grid with 5 flower types (rose, tulip, daisy, orchid, lavender)
   - Swap logic (adjacent only)
   - Match detection (3+ horizontal/vertical)
   - Cascade/gravity (pieces fall down, new ones spawn)
   - Combo multiplier (chain reactions)
   - Score calculation

2. Create src/game/GameScreen.tsx:
   - Skia Canvas rendering the 8x8 grid
   - Each flower: stylized 2.5D look with gradients and shadows (Skia Path + LinearGradient)
   - Touch gesture: drag to swap
   - Smooth animations: swap, match (scale+fade), fall (spring)
   - Score display, moves remaining, level target
   - Top bar: gold, diamond, lives display

3. Create src/game/types.ts — all game types

4. Add navigation: new tab or button from home to GameScreen

DO NOT commit or push. Keep existing app structure intact.
Use Zustand for game state. Use react-native-reanimated for gesture handling with Skia.
```

---

## ADIM 2: Level System + Progression

```
Continue the match-3 game. Add level system:

1. Create src/game/levels.ts:
   - 20 levels with increasing difficulty
   - Each level: { id, type, target, maxMoves, gridConfig }
   - Types: score_target, collect_flowers, break_ice
   - Ice blocks: overlay on cells, need 2 matches adjacent to break
   - Level 1-5: easy (generous moves), 6-15: medium, 16-20: hard

2. Create src/game/LevelSelectScreen.tsx:
   - Scrollable map view (like Candy Crush level map)
   - Nodes connected by path, locked/unlocked/completed states
   - Stars (1-3) shown on completed levels
   - Current level highlighted

3. Update GameScreen.tsx:
   - Show level objective on start (modal)
   - Win condition check after each move
   - Win screen: stars earned, gold reward, "Next Level" button
   - Lose screen: "Try Again" or "Buy +5 moves"

4. Create src/game/store.ts (Zustand):
   - currentLevel, completedLevels, stars per level
   - Persist with AsyncStorage

DO NOT commit or push.
```

---

## ADIM 3: Economy + Boosters + Lives

```
Continue the match-3 game. Add economy, boosters, and lives:

1. Update src/game/store.ts:
   - gold: number (start 500)
   - diamonds: number (start 50)
   - lives: number (max 5, regenerate 1 every 30 min)
   - lastLifeRegenTime: timestamp
   - boosters: { hammer: number, colorBomb: number, extraMoves: number, shuffle: number }

2. Create src/game/Boosters.tsx:
   - Bottom bar during gameplay showing available boosters
   - Hammer: tap any cell to remove it (costs 3 diamonds)
   - Color Bomb: removes all of one color (costs 5 diamonds)
   - +5 Moves: adds 5 moves (costs 3 diamonds)
   - Shuffle: randomize board (costs 2 diamonds)
   - Activation: tap booster → tap target cell

3. Create src/game/LivesSystem.tsx:
   - Heart display with countdown timer to next life
   - "No lives" modal: wait or buy (5 diamonds = 1 life, 20 diamonds = full)
   - Life lost on level fail

4. Create src/game/Shop.tsx:
   - Gold packages, Diamond packages, Booster bundles
   - Use RevenueCat product IDs (placeholder for now)
   - Beautiful UI cards with Skia gradients

5. Gold rewards on level completion:
   - 1 star: 10 gold, 2 stars: 25 gold, 3 stars: 50 gold
   - Bonus: first clear = +20 gold

DO NOT commit or push.
```

---

## ADIM 4: Daily Rewards + Engagement Hooks

```
Continue the match-3 game. Add daily engagement features:

1. Create src/game/DailyReward.tsx:
   - 7-day calendar grid (shows today highlighted)
   - Day 1: 50 gold, Day 2: 1 hammer, Day 3: 100 gold, Day 4: 5 diamonds,
     Day 5: 2 color bombs, Day 6: 200 gold, Day 7: 20 diamonds + mystery box
   - Claim button with confetti animation
   - Auto-show on app open if not claimed today
   - Streak tracking: miss a day = reset to day 1

2. Create src/game/SpinWheel.tsx:
   - Skia animated wheel with 8 segments (gold, diamonds, boosters, extra life)
   - Free spin every 4 hours, extra spin = 10 diamonds
   - Smooth rotation animation, lands on random weighted segment

3. Create src/game/DailyMissions.tsx:
   - 3 daily missions: "Complete 3 levels", "Use 2 boosters", "Score 10000 points"
   - Progress bar for each
   - Reward: completion of all 3 = mystery box (random: gold/diamonds/booster)

4. Push notifications setup (expo-notifications):
   - "Your lives are full! 🌸" when lives regenerate to 5
   - "Don't lose your streak! Claim your Day X reward" at 10:00
   - "New daily missions available!" at 09:00
   - NO notifications between 22:00-08:00

DO NOT commit or push.
```

---

## ADIM 5: 3D Garden Scene (Meta-game)

```
Continue the match-3 game. Add the isometric garden scene:

1. Create src/garden/GardenScene.tsx:
   - Skia Canvas with isometric 2.5D garden view
   - Green grass base with tile grid
   - Decoratable slots (flowers, trees, bench, fountain, lights)
   - Tap item to place/upgrade
   - Pinch to zoom, drag to pan

2. Create src/garden/GardenStore.ts (Zustand):
   - unlockedItems: array of placed decorations
   - gardenLevel: increases with items placed
   - availableItems: unlocked by level progression

3. Create src/garden/GardenShop.tsx:
   - Categories: Flowers, Trees, Structures, Animals, Lighting
   - Items cost gold or diamonds
   - Preview before purchase
   - Seasonal items (tagged, cosmetic only)

4. Integration with match-3:
   - Every 5 levels passed → unlock new garden item for free
   - Garden level shown on profile
   - Beautiful transition between game and garden tabs

5. Isometric rendering:
   - Use Skia transforms for isometric projection
   - Layered rendering (ground → items → shadows → UI)
   - Ambient particles (butterflies, leaves falling)

DO NOT commit or push.
```

---

## TEST SONRASI

Berko her adımda `npx expo start` ile test eder.
Beğenirse → ben commit + push + EAS build yaparım.
Beğenmezse → Cursor'a fix prompt veririz.

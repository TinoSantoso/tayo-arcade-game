# Arcade Games - Tayo Bus Road Dash

A level-based arcade lane runner featuring Tayo characters.  
The game is built with React + TypeScript + Zustand and currently includes full core gameplay, level progression, stats persistence, difficulty/audio settings, and mobile-friendly controls.

## Current Status

Core milestones are complete:
- Character select -> Level select -> Gameplay -> Victory/Game Over flow
- 3-lane movement system with keyboard + touch controls
- Obstacle spawning, collision detection, and finish-line victory logic
- Level unlock progression with best-run stats in localStorage
- Settings modal (audio on/off + difficulty)
- UI polish pass (lane animation, tap-to-steer, responsive HUD)
- Performance refinements (frame delta cap + reduced render churn)

Open optional enhancements:
- Achievements / badges
- Time trial mode
- Endless mode after campaign
- Bus customization (skins/decals)

## Gameplay Features

- 4 playable buses: Tayo, Gani, Lani, Rogi
- 3 themed levels: City Street, Main Road, Highway
- Dynamic difficulty (`easy`, `normal`, `hard`) affecting speed and spawn pacing
- Star rating based on completion time and obstacle avoidance
- Victory confetti and game-over VFX
- Lightweight synthesized music/SFX via Web Audio API

## Controls

- Desktop:
  - `ArrowLeft`: move left lane
  - `ArrowRight`: move right lane
- Mobile:
  - Swipe left/right in the playfield
  - Tap lane area to steer toward that lane
  - On-screen left/right buttons

## Tech Stack

- React 19 + TypeScript
- Zustand (global state)
- Tailwind CSS
- requestAnimationFrame game loop
- Web Audio API (music + SFX)
- Vite

## Project Structure

- `tayo-bus-game/` - React + TypeScript game app
- `tasks.md` - development tracker and completion notes
- `tayo_game_plan.md` - original design and implementation plan

## Run Locally

From repo root:

```bash
cd tayo-bus-game
npm install
npm run dev
```

Build and checks:

```bash
npm run lint
npm run build
```

## Assets

- Character portraits: `tayo-bus-game/src/assets/characters/`
- Top-down player sprites: `tayo-bus-game/src/assets/topdown/`
- Obstacle sprites: `tayo-bus-game/src/assets/obstacles/`

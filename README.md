# Twenty Lock

Twenty Lock is a lightweight web-based darts training game focused on one job: building consistency in the 20 segment. Each visit is three darts, and the app rewards grouped hits in the 20 bed, streaks of successful visits, and repeatable practice habits rather than match-style scoring.

## What the game does

- Lets you record three darts per visit using fast tap targets
- Tracks score, current streak, best streak, visit count, and recent history
- Measures qualifying-hit accuracy, visit success rate, and average points per visit
- Saves the current session and personal best streak in `localStorage`
- Supports multiple rule presets for different practice goals

## Game modes

### Standard
- `S20`, `D20`, and `T20` all count
- 2 qualifying hits in a visit = success and `+1`
- 3 qualifying hits = perfect visit and `+3`
- Every 3rd successful streak adds `+1` bonus

### Strict
- Only `D20` and `T20` count
- 2 qualifying hits = success and `+1`
- 3 qualifying hits = perfect visit and `+3`
- Every 3rd successful streak adds `+1` bonus

### Precision
- Requires at least one `T20` plus one other 20 hit
- 2 qualifying hits with a `T20` = success and `+1`
- 3 qualifying hits with a `T20` = perfect visit and `+3`
- Every 3rd successful streak adds `+1` bonus

### Endurance
- Uses the Standard hit logic
- Runs as a focused 12-visit block
- Tracks score and best streak across the block

## Input flow

- Tap one button per dart: `S20`, `D20`, `T20`, `Other`, or `Miss`
- After the third dart, the visit is scored automatically
- Use undo to remove the last dart entered or revert the most recent visit
- Use reset game to clear the current mode while keeping your personal best
- Use new session to clear persisted session data and start fresh

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview the build

```bash
npm run preview
```

## Project structure

```text
src/
  components/
    DartPad.tsx
    ModeSelector.tsx
    StatCard.tsx
    VisitHistory.tsx
  lib/
    gameEngine.ts
    gameModes.ts
  types/
    game.ts
  App.tsx
  index.css
  main.tsx
```

## Deployment

### Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Keep the default build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

### GitHub Pages

1. Push the repo to GitHub.
2. Add a workflow or deploy using a static hosting action that runs:

```bash
npm ci
npm run build
```

3. Publish the generated `dist` folder.

If you want a quick manual option, you can also deploy the `dist` output with any static host such as Netlify, Cloudflare Pages, or Surge.

## Notes for future extension

- Add sound or haptic feedback for successful streaks
- Add a session summary modal after Endurance mode completes
- Add more focused drills for switching between `20`, `19`, and doubles
- Add optional theme switching or expanded personal best tracking

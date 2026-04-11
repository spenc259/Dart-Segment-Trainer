# Twenty Lock

Twenty Lock is a lightweight web-based darts training game focused on building consistency on a chosen board segment. Each visit is three darts, and the app rewards grouped hits, successful streaks, and repeatable practice habits rather than match-style scoring.

## What the game does

- Guides the player through an intro, segment selection, practice, and results flow
- Lets you record three darts per visit using fast tap targets
- Tracks score, current streak, best streak, visit count, and recent history
- Measures qualifying-hit accuracy, visit success rate, and average points per visit
- Saves the current session and personal best streak in `localStorage`
- Supports multiple rule presets for different practice goals
- Includes a floating options panel for theme selection

## Game modes

### Standard
- Singles, doubles, and trebles on the selected segment all count
- 2 qualifying hits in a visit = success and `+1`
- 3 qualifying hits = perfect visit and `+3`
- Every 3rd successful streak adds `+1` bonus

### Strict
- Only singles and trebles on the selected segment count
- 2 qualifying hits = success and `+1`
- 3 qualifying hits = perfect visit and `+3`
- Every 3rd successful streak adds `+1` bonus

### Precision
- Requires at least one treble plus one other hit on the selected segment
- 2 qualifying hits with a treble = success and `+1`
- 3 qualifying hits with a treble = perfect visit and `+3`
- Every 3rd successful streak adds `+1` bonus

### Endurance
- Uses the Standard hit logic
- Runs as a focused 10-visit block
- Ends immediately if a miss is recorded during the visit
- Tracks score and best streak across the block

## User journey

- Start on an intro screen with the current mode selection and board picture
- Choose the target segment on a dedicated selection step
- Record the session from the main practice screen with summary, visit slots, controls, progress, and history
- Finish on a results screen with the session stats and quick restart actions
- Open the bottom-right options button to change the app theme

## Input flow

- Tap one button per dart: `Single`, `Double`, `Treble`, or `Miss`
- Use `Advance` to complete the rest of a partial visit as off-target darts
- After the third dart, the visit is scored automatically
- Use undo to remove the last dart entered or revert the most recent visit
- Use reset to restart the current segment while keeping your personal best
- Use new session to clear persisted session data and return to the start

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

## End-to-end testing

### 1. Install Playwright browsers

```bash
npx playwright install chromium webkit
```

### 2. Run the mobile-first E2E suite

```bash
npm run test:e2e
```

### 3. Useful local debugging commands

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

The suite runs against local Chromium and WebKit mobile device profiles. GitHub Actions also runs the same Playwright suite automatically on pushes and pull requests.

## Project structure

```text
e2e/
  helpers.ts
  mode-rules.spec.ts
  persistence-and-options.spec.ts
  session-controls.spec.ts
  standard-flow.spec.ts
src/
  components/
    DartboardOutline.tsx
    DartPad.tsx
    ModeSelector.tsx
    VisitHistory.tsx
  lib/
    gameEngine.ts
    gameModes.ts
  types/
    game.ts
  App.tsx
  index.css
  main.tsx
playwright.config.ts
.github/workflows/e2e.yml
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

# AGENTS.md

This file is the standing project brief for work in this repository. Read it before making changes.

## Project Intent

- `DartScorer` is a lightweight darts training app focused on fast input, clear feedback, and a strong mobile-first practice flow.
- Changes should improve the user journey without overcomplicating the app.
- Prefer iterative improvements that preserve working behavior over broad rewrites.

## Working Agreement

- Never work directly on `main`.
- Create a new branch before making code changes.
- Use the `codex/` prefix for Codex-created branches unless the user asks for a different naming scheme.
- Treat one roadmap item as one branch by default.
- If a task starts expanding into a redesign or touching multiple concerns, pause and realign before continuing.

## Collaboration Defaults

- Start each task by checking the current branch and worktree state.
- Assume the repository may contain user changes; do not revert unrelated work.
- Summarize what is about to change before editing files.
- When a decision has non-obvious product or structural tradeoffs, confirm direction before committing to it.
- Keep explanations concise and practical.

## Code Style

- Use React function components and TypeScript throughout.
- Keep business logic in `src/lib` where practical.
- Keep presentational concerns in components and CSS rather than mixing too much logic into the UI.
- Prefer straightforward state and helper functions over clever abstractions.
- Use descriptive names and early returns.
- Add comments sparingly, only when a block would otherwise be hard to parse quickly.

## UI and UX Guidelines

- Preserve the existing mobile-first approach.
- Keep the visual language intentional and cohesive with the current app rather than introducing a completely unrelated style.
- Favor clear hierarchy, strong spacing, and obvious primary actions.
- Maintain fast tap-friendly controls and simple session flow.
- For larger UX changes, think in terms of complete user journeys, not isolated panels.

## Styling Conventions

- Keep shared styling in `src/index.css` unless the project structure changes intentionally.
- Reuse existing CSS variables and add new variables when introducing repeatable colors or surfaces.
- Prefer extending existing class patterns over one-off styling unless the new UI truly needs a new pattern.
- Make sure layouts work on small screens first, then scale up for larger viewports.

## State and Persistence

- Preserve `localStorage` compatibility where possible.
- If stored session shape changes, add safe hydration or migration handling rather than breaking old sessions silently.
- Avoid resetting user progress unexpectedly.

## Validation

- Run `npm run build` after substantive code changes unless blocked.
- If something cannot be verified, say so clearly in the handoff.
- Flag any stale documentation noticed during implementation.

## Documentation

- Update `README.md` when user-facing behavior, setup steps, or feature descriptions materially change.
- Keep documentation aligned with the actual codebase structure.

## Git Hygiene

- Do not amend commits unless explicitly requested.
- Do not use destructive git commands unless explicitly requested.
- Keep commits focused and intentional.

## Current Known Process Notes

- This repository has been evolving through small feature branches merged back into `main`.
- Existing history suggests a preference for scoped changes such as modes, stats, segment selection, theme support, and mobile flow refinements.
- Continue that pattern unless the user explicitly asks for a larger refactor.

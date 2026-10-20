---
name: read-gdd
description: Read the game's design document (GDD) and turn it into a build plan, with no code. Use when the user runs /read-gdd, mentions or attaches a GDD / game design document / game doc (e.g. docs/GDD.md, a .pdf or .docx), or asks to start building a new game from its design.
---

# Read the GDD and plan the game

Goal: understand the game design, map it onto this template, and agree a plan with the developer **before any code is written**.

**Do not write or change game code in this step.** The only file you write is `docs/PLAN.md`.

## 1. Find the GDD

- If the user named or attached a file, use that one.
- Otherwise look for, in this order: `docs/GDD.md`, `docs/GDD.pdf`, `docs/GDD.docx`, then any file in `docs/` or the project
  root whose name contains `gdd` or `design` (any case).
- Found several? List them and ask which one. Found none? Tell the user to put the GDD at `docs/GDD.md`
  (Google Docs: File → Download → Markdown) and stop.
- `.docx` or `.pdf` you cannot read well? Say so and ask for a Markdown export.

## 2. Read the project rules

Read `AGENTS.md` fully, then `docs/CUSTOMIZE-UI.md`, `src/game/game.config.ts` and `content/levels.json`.
For the core API read only `src/core/index.ts` and `src/core/config.ts`; do not browse the rest of `src/core/`.
The template already provides: splash, main menu, level selection, pause, settings, Game Over / Game Completed,
tutorial and hint overlays, toolbar buttons, progress saving, sound settings, debug panel.

## 3. Reply with this, in order

1. **The game in brief**: core loop, how a level is won and lost, number of levels, orientation, learning goal.
   Your own words, at most 8 lines.
2. **Already in the template**: which GDD items core covers (so nobody rebuilds them), and how they are configured
   (`game.config.ts` fields: tutorial, mainMenu, levelSelection, theme, typography, buttonStyle).
3. **To build in `src/game/`**: the gameplay classes (small, one job each, under 400 lines), what each does,
   and how they use `ctx` (`setHud`, `win`, `lose`, `showHint`, `showTutorial`, `audio`).
4. **Data**: the shape of `content/*.json` for levels, questions and items, with one short example entry.
5. **Assets**: a table of images and audio (key, file name under `public/assets/game/`, size, used for).
   Mark which ones we don't have yet; the plan uses named placeholder shapes for them.
6. **Build steps**: 4 to 8 small steps, each one ends in something playable in the browser.
   Step 1 is always config + data + placeholders; step 2 is the core loop for level 1 only.
7. **Conflicts with the template rules**: anything in the GDD that would need a locked change
   (moving toolbar buttons, a custom pause screen, a different splash…). Suggest the allowed alternative.
8. **Questions**: everything unclear, missing or contradictory in the GDD, numbered so the user can answer by number.

Keep it short and concrete. No code blocks except the JSON example.

## 4. Save the plan

Write the same content to `docs/PLAN.md` in this shape, so any later chat can continue from it alone:

```
Status: draft (waiting for answers)
GDD: docs/GDD.md

## Next session
Start with step 1. (2-3 lines: what is done, what is next, anything to watch out for.)

## Steps
- [ ] 1. Config, data and placeholders ...
- [ ] 2. Core loop, level 1 only ...

## Game summary / Template coverage / Classes / Data / Assets / Conflicts / Answers
...
```

When the user answers, update `docs/PLAN.md` (answers in, status `agreed`) and tell them to commit it.
Then stop. Building starts when the user asks for step 1.

## Rules for later steps (follow them, and remind the user once)

- **`docs/PLAN.md` is the source of truth.** A new chat reads `docs/PLAN.md` first, not the whole GDD.
  Open `docs/GDD.md` only for the section the current step needs.
- **One step per chat**, e.g. "Do step 2 from docs/PLAN.md". Long chats re-send everything and waste tokens:
  after a step is committed, start a new chat for the next one.
- **After each step:** `npm run typecheck`, the user plays it, Inspect shows `✓ all named`. Then tick the step
  (`- [x]`) and rewrite "Next session" in `docs/PLAN.md`, and tell the user to commit.
- **When the design changes:** update `docs/GDD.md` and `docs/PLAN.md` first, then the code.

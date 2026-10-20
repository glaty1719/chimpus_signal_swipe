# Creating a new CV game

A step-by-step guide for developers. Every CV game starts from the **cv-game-template** repository
(Phaser 3 + TypeScript + Vite) and lives in its own repository in the **ChimpVine-Games** GitHub organization.

---

## 1. Before you start (one time per computer)

> **Required: you must be a member of the ChimpVine-Games GitHub organization.** The template is private.
> Ask the lead to invite you, then accept the email invite.
> Test: open https://github.com/ChimpVine-Games/cv-game-template while logged in. If you see it, you are ready.

| You need | Check with | Get it |
|---|---|---|
| Node.js 20 or newer | `node -v` | https://nodejs.org (LTS) |
| Git | `git --version` | https://git-scm.com |
| VS Code (recommended) | | https://code.visualstudio.com |

Git for Windows signs you in to GitHub in the browser the first time it needs to (or use an SSH key).

---

## 2. Create the game

Pick a name that follows our convention, for example `Grade3-Smart-Sorter`, `KG-Farm-Animal-Parade`.
You also need the game's **ChimpVine game ID** (a number from the backend; use `0` if you don't have it yet).

### Option A (recommended): GitHub website

1. Open https://github.com/ChimpVine-Games/cv-game-template.
2. Click **Use this template** (top right) → **Create a new repository**.
3. Owner **ChimpVine-Games**, name `Grade3-Smart-Sorter`, visibility **Private** → **Create repository**.
4. Clone it and run setup:

```
cd D:\CV-Phaser
git clone https://github.com/ChimpVine-Games/Grade3-Smart-Sorter.git
cd Grade3-Smart-Sorter
npm run setup
```

### Option B: command line (npx)

Creates a local folder from the newest template in one command:

```
cd D:\CV-Phaser
npx github:ChimpVine-Games/cv-game-template
```

To create from a specific template version, add `--template v0.1.0` (versions are listed under **Tags** on GitHub).
This makes a folder only. To put it on GitHub, create an empty private repository in ChimpVine-Games, then:

```
git init
git add -A
git commit -m "Set up Grade3 Smart Sorter"
git remote add origin https://github.com/ChimpVine-Games/Grade3-Smart-Sorter.git
git push -u origin main
```

### Alternative: GitHub CLI (`gh`)

`gh` is GitHub's own command-line tool. It is a separate install, not part of Git
(`winget install GitHub.cli`, then `gh auth login`). It does Option A in one command:

```
gh repo create ChimpVine-Games/Grade3-Smart-Sorter --template ChimpVine-Games/cv-game-template --private --clone
cd Grade3-Smart-Sorter
npm run setup
```

### The three questions

Setup asks three questions:

```
? Project name: Grade3 Smart Sorter
? Orientation (↑/↓ then Enter)
❯ Landscape 1920 × 1080
  Portrait 1080 × 1920
? ChimpVine game ID (number) (0): 138
```

| Question | What it sets |
|---|---|
| Project name | Folder name (`Grade3-Smart-Sorter`), package name, game id (`grade3-smart-sorter`), title shown in the browser |
| Orientation | Canvas size: landscape 1920×1080 or portrait 1080×1920 |
| Game ID | Backend game ID and the storage prefix `cv_game_<id>_` |

Made a mistake? Run `npm run setup` again inside the project. It shows the current values; press Enter to keep them.

To skip the questions (for scripts): `--name "Grade3 Smart Sorter" --orientation portrait --game-id 138`.

---

## 3. Run it

```
npm ci
npm run dev
```

`npm ci` installs the exact tested versions and never changes `package-lock.json`.

Open **http://localhost:8080**. You will see the template's demo game:
Main Menu → Level Selection → a bubble-popping level, with pause, settings, tutorial, hints and the
Game Over / Game Completed panels already working.

The panel on the right is the **debug panel** (only in `npm run dev`, or by adding `?debug` to the URL).
Press the backtick key ( ` ) to hide it. It remembers its tab, open sections and hidden state between reloads.

If your game has a GitHub repository, commit and push your first change as usual:

```
git add -A
git commit -m "Set up Grade3 Smart Sorter"
git push
```

---

## 4. Build your game

**Read `AGENTS.md` and `docs/CUSTOMIZE-UI.md` in the project first.** `AGENTS.md` holds the rules for developers and AI
tools; `CUSTOMIZE-UI.md` shows what you can change and how. The short version: you work in three places only.

| Where | What you do there |
|---|---|
| `src/game/game.config.ts` | The game: title, levels, tutorial text, theme (colors, fonts), assets, music, button style, main menu (background, Play button, title) and level selection (grid, card design) |
| `src/game/` | Your gameplay code. Replace `DemoGameplay.ts` with your own logic |
| `content/*.json` | Levels, questions, items: data, not code |
| `public/assets/game/` | Your images and audio |
| `public/assets/backgrounds/`, `ui/` | Shared art. To reskin, replace a PNG **with the same file name** |
| Everything else | 🔒 **Locked**: `src/core/` (menus, panels, HUD, audio, saving, API), the splash screen and `public/assets/loading/`, `src/main.ts`, build config, `tools/`. AI tools stop with a warning if asked to change it |

Rules you must follow (details in `AGENTS.md`):

- **Never rebuild** the menu, level selection, pause, settings, game over or tutorial screens. They come from core.
- **Never move, resize or re-layer** the top-left Back / Pause / Settings buttons or the bottom-left studio logo.
  Core puts them back and logs `[layout-lock]` in the console.
- **Every object has a name**: `.setName('scoreText')`. The debug panel's Inspect section must show `✓ all named`.
- **No hardcoded colors or fonts.** Use the theme. **No raw depth numbers.** Use `UILayers`.
- **All sound through `ctx.audio`.** Never wait for a voice line to finish before moving the game on.
- **No file over 400 lines.**

How your gameplay talks to core:

```ts
ctx.setHud('Score 3 / 10');          // text at the top of the screen
ctx.showHint('Drag the apple!');     // hint bubble
ctx.win({ score: 300, stars: 3 });   // level complete: core saves progress and shows the panel
ctx.lose({ score: 120 });            // level failed
```

### Start with the design document

Put the GDD at `docs/GDD.md` (Google Docs: **File → Download → Markdown**; add `docs/GDD.pdf` for pictures) and commit it.
Then run **`/read-gdd`** in your AI tool. It writes no code: it plans the game against the template, saves the plan to
`docs/PLAN.md` and asks you questions. After you answer, build **one step per chat** ("Do step 1 from docs/PLAN.md"):
play it, commit, then start a new chat. The AI ticks the step and leaves a "Next session" note in `docs/PLAN.md`,
so the new chat continues from the plan instead of re-reading everything (long chats waste tokens).

### Useful debug tools

- **Inspect** (key `I`): click any element to select it. Its name is copied to your clipboard.
  Drag it or use the arrow keys to move it, then **💾 Save** (top of the debug panel) writes the new position to `tuning.json`.
  Locked elements (toolbar buttons, studio logo) show 🔒 and cannot be moved.
- **Copy reference for AI** gives one line you can paste to an AI tool so it finds the exact element.
- **Change markers**: a yellow dot marks a value you changed but have not saved, a purple dot a saved value that
  differs from the code default. Click **↺** next to it to go back to the default.
- **💾 Save** opens a list of your changes grouped by file. Untick anything you do not want to keep yet; it stays
  unsaved (yellow dot) and the page does not reload. **Commit `tuning.json`** afterwards: it ships with your game.
- **Actions**: restart the scene, unlock all levels, reset progress.
- **Button styles**: open `http://localhost:8080/dev/animation-lab.html` to try them all, then set
  `buttonStyle` in `game.config.ts` (default `popSparkle`).
- **Text styles**: open `http://localhost:8080/dev/typography-lab.html`, then set `typography` in `game.config.ts`
  (default `candyFredokaBold`). Your own text: `addText(scene, 'name', x, y, 'Text', { style: 'hud' })`.
- **Look** in the debug panel: switch typography and button style live in your real game. **💾 Save** (top of the debug panel)
  writes your choice into `src/game/game.config.ts` (it asks first); **📋 Copy config lines** copies them instead.

### When an AI tool says "LOCKED"

Claude, Codex, Cursor and Antigravity refuse to change locked files and show a **⚠️ LOCKED** warning instead.
That is expected: games never need core changes. If you believe the template itself needs a fix, tell the lead.
The lead (or whoever maintains the template) can unlock for 30 minutes in their own terminal:

```
node .agents/splash-lock/splash-lock.mjs status    # what is locked
node .agents/splash-lock/splash-lock.mjs unlock    # type UNLOCK SPLASH to confirm
node .agents/splash-lock/splash-lock.mjs lock      # lock again when done
```

---

## 5. Build for release

```
npm run build
```

This checks types and creates the `dist/` folder. **`dist/` is what goes to the server.**
Zip it and hand it to the person responsible for uploading. Never commit `dist/` to git.

Before handing over:

- `npm run build` finishes without errors.
- You played every level, in the browser, at least once.
- Inspect shows `✓ all named`.
- `gameId` in `src/game/game.config.ts` is the real ChimpVine ID, not `0`.

---

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| `Could not download ChimpVine-Games/cv-game-template` | You are not in the organization yet, or git is not signed in to GitHub. Ask the lead; sign in when the browser opens. |
| No **ChimpVine-Games** owner when creating the repository | You cannot create repositories in the organization. Ask an organization owner, or use Option B. |
| `gh: command not found` | Install the GitHub CLI, or use Option A or B. |
| `Folder "..." already exists and is not empty` | Choose another name or remove the old folder. |
| `Port 8080 is in use` | Another dev server is running. Stop it, or use the port Vite prints. |
| `Failed to resolve import` after changing dependencies | Stop the dev server, delete `node_modules/.vite`, run `npm run dev` again. |
| The orientation list shows as a typed question | Your terminal is not interactive. Type `landscape` or `portrait`, or pass `--orientation`. |

---

## 7. Template versions

- The template is versioned with git tags (`v0.1.0`, `v0.2.0`...). Your game records the version it was created
  from in `package.json` → `cvTemplate`.
- A game keeps its own copy of the template. Template updates do **not** change existing games.
- To report a bug or request a change in core (menus, panels, HUD...), tell the lead. `src/core/` is locked in your
  game: the fix belongs in **cv-game-template** so every new game gets it.

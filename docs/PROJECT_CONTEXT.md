# cv-game-template: project context

Handoff document. Read this first if you are new to the project, or an AI agent continuing the work.
Last updated: 2026-10-09.

---

## 1. What this is

The **ChimpVine studio's starter project for small educational games** (100+ planned).
Every new game is a copy of this repository and lives in its own repository in the GitHub organization.

- Repository: **https://github.com/ChimpVine-Games/cv-game-template** (private, marked as a GitHub template, branch `main`)
- Local clone: `D:\CV-Phaser\create-cv-project\` (folder still has the old name; the repo was renamed)
- Released: **v0.1.0** (2026-10-09, first release; earlier pre-release tags were removed). `package.json → cvTemplate`
  holds the template version.
- GitHub org is **ChimpVine-Games** (not `chimpvine`). Account `itsdgbro` is an admin there.
- Team: one lead, one intern (more later), **one developer per game**. Most games are vibe-coded with AI,
  so the structure must be easy and safe for AI to extend.

## 2. Decisions (and why)

| # | Decision | Why |
|---|---|---|
| 1 | **Phaser 3.90 + TypeScript + Vite.** Fixed for every game. | Good AI support, small web builds, WebGL. |
| 2 | **Full project template, copied per game.** Not a shared npm package. | Chosen by the lead: one-command creation, simple. A template change never alters existing games. (An earlier `@studio/core` package approach in `D:\CV-Phaser\studio-platform` is now **reference only**.) |
| 3 | **Template is the repo root.** | Clone = runnable game; usable as a GitHub template. |
| 4 | **`src/core/` is protected, `src/game/` belongs to the game.** | Shared structure stays consistent; games only write gameplay. |
| 5 | **Core owns the flow and all shared UI**: Main Menu → Level Selection → Game (+ HUD scene); Settings, Pause, Game Over, Game Completed, Hints, Tutorials; fixed toolbar buttons; fonts, typography, positions, rules. | Lead's requirement. |
| 6 | **No mechanics library.** Each game writes its own gameplay. | Every game's logic is different. |
| 7 | **All assets and content live in the game repo and are committed to git.** No separate asset server. Games are a few MB, so no Git LFS. | The whole build folder is fetched from the server anyway. |
| 8 | **Release is out of scope.** Each game is built locally one at a time (`npm run build`) and `dist/` is handed to the person who uploads it, overwriting the old version on server "ABC". Git holds source only; rollback = rebuild an older commit. No CI/CD here. | How the studio works today. |
| 9 | **Everything outside the canvas is pure black.** Canvas 1920x1080 (landscape) or 1080x1920 (portrait). | Studio rule. |
| 10 | **Every game object has a name** (`setName`). | People and AI refer to objects by name; the inspector saves layout by name. |
| 11 | **Debug-mode file writing only under `npm run dev`**, always behind a confirmation. | Deployed builds never write config. |
| 12 | **One backend server for all frontends.** The website, the Flutter app, the Play Store builds and the games all connect to the same single backend (likely Node.js; stack not final). No WordPress/Django or per-platform backends. Games call it directly; games that need no backend keep data locally and expose it to the host (e.g. Flutter) through a JS bridge. | Lead's decision (2026-10-05). One API contract, and we control its auth and CORS. |
| 13 | **Developers edit only `src/game/`, `content/` and `public/assets/` (not `loading/`).** Everything else is hard-locked for AI agents (splash screen, core UI layout, template core) and only the developer can unlock it. Core also freezes its constants and pins the toolbar, logo and popup depths at runtime. | Lead's decision (2026-10-06). Every game stays consistent and safe; menus are customised through `game.config.ts` (see `docs/CUSTOMIZE-UI.md`). |

## 3. Repository layout

```
src/
├─ core/                      LOCKED "template core" (AI agents blocked; developer unlock only)
│  ├─ index.ts                startGame(config) + the public API games may import
│  ├─ config.ts               GameConfig, GameplayContext, Gameplay, CANVAS_SIZE
│  ├─ runtime.ts              resolved config / theme / settings (set by startGame)
│  ├─ theme.ts                Theme (fonts, colors, typography), defineTheme, css()
│  ├─ typography.ts           text styles (title, heading, hud, body, button, label, number); sets candyFredokaBold (default),
│  │                          candyFredoka; CORE_FONTS (Fredoka, public/assets/fonts, OFL)
│  ├─ settings.ts             settings schema, Tuning (tuning.json), isDebugMode
│  ├─ events.ts               SceneKeys, GameEvents (Game ⇄ UIScene), ResultData
│  ├─ layout/                 UILayers (depths), UIPositions (toolbar slots, anchors), offsets.ts (naming + saved layout),
│  │                          locked.ts (LOCKED_OBJECTS + pinObject: toolbar/logo/popup depths restored every frame)
│  ├─ platform/screen.ts      black letterbox, rotate-device prompt (landscape games), Android orientation lock
│  ├─ scenes/                 Boot, Preloader, MainMenu, LevelSelection, GameScene, UIScene, GlobalUI
│  ├─ services/               AudioManager, GameDataManager (progress), APIService (WordPress), storage (prefixed keys)
│  ├─ ui/                     IconButton, SpriteTextButton, Slider (wave handle), Modal (candy pop + dim fade), SettingsPanel,
│  │                          PausePanel, ResultPanel (Game Over / Completed), HintOverlay, TutorialOverlay, LevelCard,
│  │                          Toolbar (locked top-left buttons), LogoIntro (animated splash logo), text, transitions,
│  │                          buttonStyles.ts (style library) + buttonMotion.ts (engine: intro/idle/press layers, stable hit area)
│  └─ debug/                  debug.ts (lil-gui panel, lazy chunk), inspector.ts (select/drag/copy names), tabs, saveBar,
│                             changes (markers), remember (folder memory), saveDialog, toast
├─ game/                      THE GAME
│  ├─ game.config.ts          identity (id, gameId, title, orientation), levels, gameplay, theme, assets, tutorial,
│  │                          buttonStyle, mainMenu (background, Play button, title), levelSelection (grid, custom cards)
│  └─ DemoGameplay.ts         demo: pop bubbles before the timer ends (replace in a real game)
└─ main.ts                    startGame(gameConfig)
content/levels.json           level data
public/assets/                backgrounds/, ui/, loading/ (core art, reskin by same file name), game/ (game art)
tools/setup.mjs               create / set-up command (see §5)
tools/vite-tuning.mjs         dev-only endpoints: write tuning.json, and the typography / buttonStyle lines of game.config.ts
tuning.json                   written by the debug panel's Save (locked for AI edits)
dev/animation-lab.html        dev-only page to try every button style (not in builds)
dev/typography-lab.html       dev-only page comparing typography sets (loads Google Fonts for preview only)
AGENTS.md (+ CLAUDE.md → @AGENTS.md, .agents/skills/project-rules/)   rules for devs and AI (section 0: locked areas)
.agents/skills/read-gdd/      /read-gdd: GDD → docs/PLAN.md, no code. Antigravity (main dev tool) and Codex use
                              .agents/skills/ directly; wrappers for Claude (.claude/skills/) and Cursor (.cursor/commands/).
                              No Antigravity workflows: they are retired on 2026-10-19 in favour of skills.
.agents/splash-lock/          lock.json (locked areas) + splash-lock.mjs (agent hook guard; status / unlock / lock)
.agents/rules/, .cursor/rules/   always-on lock rule for Antigravity and Cursor
.claude/, .cursor/, .codex/   hooks that run the guard before every edit / shell command (Claude asks, Cursor/Codex block)
docs/CREATE-A-GAME.md         developer guide (removed from game copies by setup)
docs/CUSTOMIZE-UI.md         what devs may change (config, images) vs the locked UI layout; stays in game copies
docs/PROJECT_CONTEXT.md       this handoff (removed from game copies by setup)
docs/architecture-*.drawio    diagrams: communication (one backend, api/local modes; proposed) and game flow.
                              Open in draw.io or the VS Code draw.io extension
```

## 4. How a game plugs in

`src/game/game.config.ts` exports a `GameConfig`. Core runs the whole flow and, when a level starts, calls
`config.gameplay(ctx)`. The context gives `scene, level, levelCount, settings, theme, audio` plus:
`setHud(text)`, `win({score, stars})`, `lose({score})`, `showHint(text, ms)`, `hideHint()`, `showTutorial(steps)`.
The gameplay may return `{ update, pause, resume, destroy }`; `destroy` must clean up everything it created.

Key core behaviors:
- GameScene pauses itself (`scene.pause()`) for Pause, Settings, Tutorial and the result panel; resets camera FX first.
- Messages from GameScene to UIScene are **queued until UIScene emits `ui-ready`** (scene.launch is async).
- A scene's event emitter survives restarts, so every listener is removed on shutdown.
- Win: `GameDataManager.completeLevel` (stars, high score, unlock next), `APIService.postEnd`, result panel.
- Result buttons: intermediate win = Replay · Home · Next; last level win or loss = 2 buttons re-centred.
- Tutorial shows automatically the first time level 1 is played (`tutorialSeen` in progress).
- Storage keys: `cv_game_<gameId>_audio`, `cv_game_<gameId>_progress`.
- Precedence: code defaults < tuning.json < live debug edits (never stored).
- `config.settings` (the settings schema) still works but is hidden: not in the debug panel or the docs, since each
  game's in-game tuning is different. Games keep their numbers as constants for now.
- In debug mode `window.__cv = { game, runtime, audit(sceneKey) }`.
- Splash: running mascot at least 1.5 s (`MIN_LOADING_MS`, bar fills smoothly), then LogoIntro (icon rolls in, letters drop,
  wave, pulse; sliced from cvLogoText.png at runtime), hold `LOGO_HOLD_MS`, fade to the menu. Fixed black/white colours.
- Buttons: every core button goes through `addButtonFeedback` → `attachButtonMotion` with `config.buttonStyle`
  (default `popSparkle`). Cute styles fire the action on **release** after `clickDelay`; the hit area stays at rest size.
- Text: `addText(..., { style })` from `theme.typography`; the set comes from `config.typography`. Fredoka (variable,
  weights 300-700) is always loaded by the Preloader. The splash "Loading..." text stays plain on purpose.
- Debug panel (`npm run dev` or `?debug`): tabs Look · Text · Colors · Inspect · Tools (last tab and open folders
  remembered). Look switches typography and button style live; Save writes them into `game.config.ts`. Text edits each
  style (size, boldness, colors, outline, letter spacing, shadow) in real time via `restyleTexts`, no restart. While
  inspecting, a selected text's style controls move into Selected. Sticky top bar: "● N unsaved changes", 💾 Save,
  ↺ Discard. Changed controls get a marker (yellow = unsaved, purple = custom) with a reset button. Save opens a dialog
  listing every change with checkboxes (partial save); results show as toasts, no browser alerts.
- Popups (`Modal`): pop in ~560 ms (grow past full size, soft squash, settle), pop out ~290 ms, dim fades with them.
- Slider: fill grows in, handle hover/grab/release motion, track click and mute glide (ease in-out), wave handle.
- Locks at runtime: `UIPositions`, `UILayers`, `Motion`, `BUTTON_STYLES` are frozen; toolbar buttons and the studio logo
  are pinned (motion-aware) and popup depths pinned; inspector cannot move locked objects or edit depth; saved offsets
  for locked objects are ignored. Violations log `[layout-lock]`.

## 5. Creating a game (implemented, tested)

Developers must be members of the ChimpVine-Games org (the template is private).

```
# A (recommended): GitHub website → Use this template → owner ChimpVine-Games, Private → clone, then:
cd <Game> && npm run setup && npm ci && npm run dev
# B: command line, a plain folder:
npx github:ChimpVine-Games/cv-game-template                  # always newest
npx github:ChimpVine-Games/cv-game-template --template v0.1.0
# alternative to A with the GitHub CLI (separate install):
gh repo create ChimpVine-Games/<Game> --template ChimpVine-Games/cv-game-template --private --clone
```

`npm ci` everywhere: exact tested versions, never rewrites the locked `package-lock.json`.

`tools/setup.mjs`:
- Asks project name, orientation (arrow-key list in a terminal, typed when piped), ChimpVine game ID.
  Flags: `--name --orientation --game-id --title`. `--here` = set up in place (`npm run setup`).
- Fills `game.config.ts` identity block, `package.json` (name, version, removes `bin`/`files`),
  `package-lock.json`, `index.html` title, README title; strips the README `<!-- template-only -->` block,
  `docs/CREATE-A-GAME.md` and `docs/PROJECT_CONTEXT.md`. Folder name = name with dashes (`Grade3-Smart-Sorter`).
- Re-running in place offers current values as defaults.
- **npx launcher:** npx caches `github:` packages and never re-checks them. When run from the npx cache
  (no `.git` next to it), setup only clones the newest template (or `--template <tag>`, or the `#ref` npx was given,
  read from the npx cache `package.json`) via SSH then HTTPS, and runs that clone's own setup.
  `package.json "files": ["tools/setup.mjs"]` keeps the npx package at ~6 kB. Phaser is a devDependency for the same reason.
- Copies only `git ls-files` (no node_modules, dist, local junk).

## 6. Verified so far

- `npm run typecheck` and `npm run build` pass (Phaser in its own chunk, debug panel in a lazy chunk).
- Played in headless Edge (playwright-core, `channel: 'msedge'`), landscape and portrait: menu, settings,
  level select (locked cards), tutorial pausing the game, pause/resume, idle hint, win → progress saved and
  level 2 unlocked, Next, lose by timeout, Home. **0 unnamed objects** on every scene, no console errors.
- Real `npx github:...` from GitHub (plain and with `--template <tag>`), generated game installs and builds;
  arrow-key picker tested in a pseudo-terminal.
- 2026-10-05/06, headless Edge, landscape: splash sequence and timings; every button style in the lab; Pop & Sparkle
  in the real flow (release fires, no flicker when pressing near an edge); slider glide / wave / mute; popups
  (Settings, Pause, Game Over) pop in and out; menu and level-select config options (title, Play button, custom
  cards, custom positions); runtime locks (moved / scaled / rotated / hidden / re-layered toolbar and logo restored,
  frozen constants, popup depth); agent guard: 28/28 cases (locked paths blocked, developer area free).
- 2026-10-07/09, headless Edge: typography sets and Fredoka loading; live text style edits; debug tabs, save bar,
  markers, memory, save dialog (partial save, Esc), toasts; Look Save into game.config.ts. Release check: full
  play-through in **landscape and portrait** (menu, settings, level select, tutorial, pause, win, Next), 0 unnamed
  objects, toolbar and logo at their locked spots, no console problems.
- **Not tested:** WordPress API path (no server), custom game fonts, rotate prompt on a real phone,
  `gh repo create --template` for real (would create a repo), touch devices (hover differs).

## 7. Not built yet (priority order)

1. **Pause when the app/tab goes to the background** (visibilitychange → open Pause). Small, every game needs it.
2. **Default audio**: no audio files ship; buttons call SFX `click` that does not exist. Add click, win, lose sounds.
3. **Data modes: backend API or local + JS bridge** (see `docs/architecture-communication.drawio`). Each game picks one mode in
   `game.config.ts`:
   - **`api` (usual):** the game calls the single backend API **directly** on every platform (website, Flutter WebView,
     Play Store build). No host page in between. One REST contract: auth, get progress, post result. The frontend
     hands the game a **player token** when it opens it (so the player does not log in twice); the Play Store build logs
     in itself. Needs CORS for the app origins (capacitor/localhost) and an offline queue.
   - **`local`:** no backend. Progress and results stay in local storage (`storage`, keys `cv_game_<gameId>_*`), and a
     **JS bridge** exposes them so the host (Flutter app, or another web page/service) can read the data. Core
     `bridge.send/on` with adapters picked automatically: Flutter JavaScriptChannel (`window.CVBridge.postMessage`),
     postMessage to a parent page, no-op when standalone. One JSON message format
     `{source:'cv-game', version:1, type, gameId, payload}`. Game → host: ready, levelStart, levelEnd, progress, exit.
     Host → game: getData (reply with stored progress/results), setProgress, pause, resume, mute, setLanguage.
     Ship listener snippets for Flutter and a web page.
   Both replace the WordPress code in `APIService` (nonce + `X-WP-Nonce`, reads `window.parent.document`, fails
   cross-origin / in Flutter) — a core change, needs approval.
   **Open:** the backend API endpoints and auth; how Play Store players log in; exactly which data hosts need from local games.
4. **iOS-safe text-to-speech service** (see `.agents/skills/project-rules/references/mobile-and-ios-fixes.md`). Rule already in AGENTS.md: never wait on speech to advance gameplay.
5. **Port the real Smart Sorter** (`D:\CV-Phaser\Phase-Game-Template`, spec in its `.agents/skills/`) onto the template to find what core lacks.
6. Show **stars** on level cards and the result panel (already saved).
7. Replace placeholder **menu art** (still says "POWERSHOT"); add portrait art.
8. Shell text in one place for **translation** ("Level Select", "RESUME", "Loading..." are hardcoded).
9. **Upgrade command** (agreed design 2026-10-09, build before v1.0):
   `npx github:ChimpVine-Games/cv-game-template upgrade [--template vX.Y.Z] [--check]`, run inside a game. Via npx so the
   newest upgrade logic is always used. Steps: refuse if git is dirty → read `cvTemplate` → clone the target tag → show
   the plan → replace only template-owned files (list from `lock.json`; add new core art, never overwrite reskinned art;
   keep `src/game`, `content`, game assets, `tuning.json`) → merge `package.json` (keep name/version, take deps/scripts,
   set `cvTemplate`) → run `migrations/` scripts between the versions in order → npm ci, typecheck, build → print
   what to fix by hand. Needs a `CHANGELOG.md`; minor versions never break games, majors ship a migration. The lock
   blocks AI agents only, so a developer can run it without unlocking.
10. Later: inspector saves scale/rotation; automated naming check; archive `studio-platform`.

## 8. Open questions for the lead

1. Backend API: who builds it, and what are the endpoints and auth (session cookie on the website, token for apps)?
2. Play Store builds: how do players log in? (The backend API must allow the app's origin in CORS; we control that.)
3. Local-mode games: what data does the Flutter app / other host need (progress, scores, per-question answers?), and
   should it be pushed on every change or only on request?
4. Portrait canvas 1080x1920: confirm with design.

## 9. Gotchas learned

- **Windows:** a folder can be locked by the IDE ("Permission denied" / "Device or resource busy" on move/delete).
- `python` on this machine is the Store stub and hangs; use `node -e` for scripts.
- npm strips `.gitignore` and `package-lock.json` when packing; that is why npx clones instead of copying itself.
- `readline.question()` drops piped lines that arrive early; setup uses its own line queue when not a TTY.
- A paused Phaser scene reports `isActive() === false`; tests must check `isActive || isPaused`.
- `public/assets/loading/chimpu_run.png` (6 frames, 170x144) has a transparent background. The splash uses fixed colours
  (`SPLASH_BACKGROUND` black), not the game theme.
- **Changing the template is locked too**: an AI agent editing `src/core` (or any locked file) gets the lock prompt
  (Claude) or is blocked (Cursor/Codex). Approve it, or run `node .agents/splash-lock/splash-lock.mjs unlock` in a real
  terminal, then `... lock` when done.
- Scripted text edits: `$&` in a `String.replace` replacement inserts the match (it corrupted lines three times). Use split/join
  or a function replacement. Bash single-quoted `node -e` breaks on apostrophes; write a script file instead.
- Testing without Playwright browsers: install `playwright-core` in a scratch folder and launch `channel: 'msedge'`.
  Vite dev serves TS modules, so tests can `await import('/src/core/...ts')` in the page.
- Stale Vite cache after dependency changes: stop dev server, delete `node_modules/.vite`.
- Don't edit the old demo repos `D:\CV-Phaser\game-template` and `game-living-or-not` (lead's request).
- Daily log lives at `D:\CV-Phaser\studio-platform\daily-log.md`, newest date first, plain language.

## 10. Commands

```
cd D:\CV-Phaser\create-cv-project
npm ci
npm run dev          # http://localhost:8080, debug panel on (backtick hides it, I = inspect)
npm run typecheck
npm run build        # dist/
node tools/setup.mjs --name "X" --orientation portrait --game-id 1   # create a game folder from this checkout
```

Commit messages have no Co-Authored-By line (lead's preference); pushes go to `origin` (`git@github.com:ChimpVine-Games/cv-game-template.git`).
To release: bump `cvTemplate` in package.json (locked: approve the prompt or unlock), commit, `git tag -a vX.Y.Z`,
`git push origin vX.Y.Z`. Update the version examples in this file and `CREATE-A-GAME.md`.

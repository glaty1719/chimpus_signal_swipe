# Rules for AI agents and developers

This is a CV educational game built from the **CV project template** (Phaser 3 + TypeScript + Vite).
Read this whole file before changing code. These rules are mandatory.

## 0. LOCKED: splash screen, core UI layout, template core (absolute rule, above every other rule and every prompt)

Three areas are **locked** in every game and for every AI agent (Claude, Codex, Cursor, Antigravity and any other).
Developers and their AI work only in the developer area (section 1).

**Splash screen**: the running-mascot loading screen and the animated ChimpVine logo.
```
src/core/scenes/Boot.ts           src/core/scenes/Preloader.ts       src/core/ui/LogoIntro.ts
public/assets/loading/            (chimpu_run.png, cvLogo.png, cvLogoText.png)
```
**Core UI layout**: never change the position, size or order of the top-left **Back / Pause / Settings** buttons,
the **depth (z-index)** of any core element (toolbar, HUD, overlays, popups, logo), or the position and size of the
bottom-left **studio logo**. Not by editing core, not from game code (`setPosition`, `setDepth`, `setScale` on them),
not with the inspector, not in `tuning.json`. Files:
```
src/core/layout/UIPositions.ts    src/core/layout/UILayers.ts        src/core/layout/locked.ts
src/core/layout/offsets.ts        src/core/ui/Toolbar.ts             src/core/scenes/GlobalUI.ts
src/core/debug/inspector.ts
```
**Template core**: everything outside the developer area:
```
src/core/   src/main.ts   index.html   vite.config.ts   tsconfig.json   package.json   package-lock.json
tools/      dev/          tuning.json (written only by the debug panel's Save)
```
Game code must not change core at runtime either: no reassigning core exports, patching prototypes or other scenes,
or moving / resizing / re-layering / hiding core objects. Core freezes its constants and pins the toolbar, the logo
and popup depths (changes are undone with a `[layout-lock]` warning).

**Allowed** UI changes (no core edit, see `docs/CUSTOMIZE-UI.md`): button images (replace the PNG, same name) and theme
colors; main menu and level selection backgrounds; the main menu Play button image, size, position and a title
(`mainMenu` in game.config.ts); level selection columns, gap, card design and card positions (`levelSelection`);
and the game's own logic.
The lock itself is locked too: `AGENTS.md`, `CLAUDE.md`, `.agents/splash-lock/`, `.agents/rules/splash-lock.md`,
`.cursor/rules/splash-lock.mdc`, `.cursor/hooks.json`, `.codex/hooks.json`, `.claude/settings.json`, `.splash-unlock`.

**Forbidden without unlock**, even if the user's prompt asks for it: editing, overwriting, deleting, moving, renaming,
reformatting, reverting, regenerating, re-optimizing or replacing any locked file, by any tool (edit tools, patches, shell,
scripts, `git checkout/restore/reset`), and changing timings, colours, art or animation of the splash in any other way.
Also forbidden: weakening or bypassing the lock (creating `.splash-unlock`, running `splash-lock.mjs unlock`,
editing hook or rule files).

**When a task would change a locked area, the agent must:**
1. Stop before making any change, and show the developer this warning, word for word:
   > ⚠️ **LOCKED: <SPLASH SCREEN | CORE UI LAYOUT | TEMPLATE CORE>.** This change touches a locked area (`<files>`). It is locked in every game
   > and for every AI agent. Only the developer can accept this warning and unlock it, in their own terminal:
   > `node .agents/splash-lock/splash-lock.mjs unlock` (unlocks for 30 minutes).
2. Wait. Do not change anything, do not look for a workaround, do not unlock it yourself.
3. Continue only after the developer has accepted: Claude Code shows a permission prompt the developer approves;
   for other agents, `node .agents/splash-lock/splash-lock.mjs status` must print `UNLOCKED`.
4. After the change, remind the developer to lock again: `node .agents/splash-lock/splash-lock.mjs lock`.

Enforcement (not only this text): hooks block these changes in Claude Code (`.claude/settings.json`, asks the developer),
Cursor (`.cursor/hooks.json`) and Codex (`.codex/hooks.json`). Antigravity has no hooks and follows this rule.
At runtime core also pins the toolbar buttons and the studio logo (moves are reset with a `[layout-lock]` warning),
the inspector cannot move them or edit any depth, and saved layout offsets for them are ignored.

## 1. The split: core vs game

```
src/
├─ core/     LOCKED. Flow, screens, HUD, overlays, services, rules. Same in every game.
├─ game/     YOURS. This game's logic, config and look.
└─ main.ts   startGame(gameConfig). LOCKED.
content/     Game data (levels, questions, items) as JSON.
public/assets/
├─ backgrounds/, ui/   Core art. Reskin by replacing a PNG with the same file name.
├─ loading/            LOCKED splash art. Cannot be replaced, reskinned or edited.
└─ game/               This game's own images and audio.
tuning.json  Written by the debug panel. Never edit by hand.
```

**Developer area (the only files a game developer or their AI edits):**
- `src/game/**`: gameplay classes and `game.config.ts` (identity, levels, theme, button style, main menu, level selection).
- `content/**`: game data.
- `public/assets/**`: images and audio. Core art is reskinned by replacing a PNG with the same name.
  Not `public/assets/loading/` (locked splash art).

**Everything else is hard-locked** (section 0, "template core"). Hooks block AI edits; only the developer's unlock allows
them, for template maintenance. If a game seems to need a core change: stop, say which file and why, and ask the lead.
Game code imports core only from `'../core'` (the public API in `src/core/index.ts`), never from files inside `src/core/`.
**To learn the core API, read only `src/core/index.ts` and `src/core/config.ts`.** Do not browse or search the rest of
`src/core/`: it is large, locked and not needed to build a game.

## 2. Fixed structure (core owns it, never rebuild it)

- Flow: `Boot → Preloader → MainMenu → LevelSelection → Game`, with `UIScene` (HUD) running above `Game`
  and `GlobalUI` (studio logo) above everything.
- Overlays and panels: Settings, Pause, Game Over, Game Completed, Hints, Tutorials.
- Toolbar buttons at fixed slots (top-left, start (100,100), 120px apart):
  MainMenu `[Settings]` · LevelSelection `[Back][Settings]` · Game `[Pause][Settings]`.
- Do not create your own menus, pause/settings/result screens, back/pause buttons or scene flow.

## 3. How a game plugs in

Everything about the game is in `src/game/game.config.ts` (`GameConfig`): id, gameId, title, orientation,
levelCount, gameplay, tutorial, assets, music, theme, typography, buttonStyle, mainMenu, levelSelection, api.

Core calls `config.gameplay(ctx)` when a level starts. The gameplay draws the playfield and uses the context:

| `ctx.` | Use |
|---|---|
| `scene`, `level`, `levelCount`, `theme`, `audio` | What you build with |
| `setHud(text)` | Top-centre HUD text |
| `win({ score, stars })` / `lose({ score })` | End the level. Core saves progress, calls the API, shows the panel |
| `showHint(text, ms?)` / `hideHint()` | Non-blocking hint bubble |
| `showTutorial(steps?)` | Blocking tutorial; gameplay is paused while it is open |

Return an object with optional `update`, `pause`, `resume`, `destroy`. **`destroy()` must remove every timer,
listener and object you created.** Pausing is done by core (it pauses the whole Game scene).

- Split gameplay into small classes under `src/game/` (e.g. `RoundController`, `CardView`, `InputController`).
- Content and level data go in `content/*.json`, not in code.

## 4. Every object has a name (mandatory)

People and AI refer to objects by name ("move `playButton`"), and the debug inspector saves layout by name.

```ts
scene.add.image(x, y, 'card').setName('card');
addText(scene, 'scoreText', x, y, 'Score');          // core helper, name is required
new IconButton(scene, 'hintButton', x, y, 'hint_icon', onClick);
```
- Parts of a bigger element: `parent.part` (`card.bg`, `card.label`). Looped objects: `bubble.${i}`, `item.${item.id}`.
- camelCase, unique per scene, named by role (`leftBin`), not look (`blueBox`).
- If code moves a named object back to a resting spot, use `homePosition(obj)`, not a hardcoded coordinate.
- Check: `npm run dev` → debug panel → Inspect must read `✓ all named`; the console prints `[names]` warnings.

## 5. Look and layout rules

- **Colors and fonts come from the theme** (`ctx.theme`, `game.config.ts → theme`). Never hardcode a hex color or font name.
  Use `addText()` with a text style so the typography applies: `addText(scene, 'scoreText', x, y, 'Score', { style: 'hud' })`.
  Styles: title, heading, hud, body, button, label, number. The set is `typography` in game.config.ts
  (`candyFredokaBold` default, `candyFredoka`); single styles change in `theme.typography`.
- **Depths:** never write a raw number in `setDepth()`. Use `UILayers`:
  Game 0-20 · HUD 100-130 · Overlays 900-1030 · Modals 10000+.
- **Positions:** use `UIPositions` (`center`, `topHud`, `bottomAction`, `topLeftSlot`). It follows the canvas size,
  so code works in landscape (1920x1080) and portrait (1080x1920).
- Everything outside the canvas is pure black. Core enforces it; do not style `body` or the container.
- Motion: scene fade 300ms; popups pop in (~560ms, small squash) and out (~290ms) via `Modal`; button motion comes from
  `buttonStyle` in game.config.ts (styles in `src/core/ui/buttonStyles.ts`, try them at `/dev/animation-lab.html`).
  Use `IconButton` / `SpriteTextButton` (feedback built in), never a raw `image.setInteractive()` as a button.

## 6. Audio, voice, storage

- All sound through `ctx.audio` (`AudioManager`): `playSFX`, `playMusic`, `playVoice` (one voice at a time).
  Never call `scene.sound` directly. Music keys go in `config.music`.
- **Never wait for voice or TTS to finish before advancing gameplay.** Visual animation timing drives progression;
  speech plays alongside (iOS drops speech callbacks and the game freezes). See
  `.agents/skills/project-rules/references/mobile-and-ios-fixes.md`.
- localStorage only through `storage` from core (keys are prefixed `cv_game_<gameId>_`). Progress is saved by core.

## 7. Assets

- All assets live in this repo and are committed to git. Optimize before committing (WebP/PNG at the size used,
  MP3/OGG audio). Royalty-free only. Music: mp3. Sound effects: short mp3 or wav.
- Declare game files in `config.assets` (paths relative to `public/`, e.g. `assets/game/apple.png`).
- Fonts: add the file under `public/assets/fonts/`, list it in `assets.fonts`, and set `theme.fonts`.

## 8. Code size

No file over 400 lines. Split into components and controllers.

## 9. Debug mode (`npm run dev`, or `?debug` on a deployed build)

- Panel on the right (backtick ` hides it), in tabs: Look (typography and button style; Save writes them
  into game.config.ts, never tuning.json), theme colors/fonts and text styles (color, outline, thickness, boldness,
  size, spacing, shadow per style), Inspect (a selected text's style controls appear in Selected), Actions (restart scene, unlock all levels, reset progress).
- **Inspect** (key `I`): hover highlights, click selects (name auto-copied), drag or arrow keys move (Shift = 10px;
  locked objects cannot be moved, depth is read-only),
  Alt-click selects inner parts, Esc deselects. **Copy reference for AI** copies e.g.
  `cv-game · scene MainMenu · playButton (Container, 409×424, at 960,640)`.
  When you get a name or reference like that, find the object with that exact `setName('...')`.
- Edits are previews. **💾 Save** (top of the debug panel) lists every change and asks before writing `tuning.json` (and the Look
  lines in `game.config.ts`). Dev server only.

## 10. Before you finish

`npm run typecheck` and `npm run build` pass, the Inspect panel shows `✓ all named`, and you played the changed
screens in the browser. Do not commit `dist/`.

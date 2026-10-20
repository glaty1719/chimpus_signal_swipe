# Customizing the UI: what you can and cannot change

Every ChimpVine game shares the same core screens, so players always find the same controls in the same place.
Some parts are **locked**, and the rest is **yours** to change, mostly from `src/game/game.config.ts` without touching `src/core/`.

## Where you work

| You edit | What goes there |
|---|---|
| `src/game/` | Your gameplay classes and `game.config.ts` (all the options below) |
| `content/` | Level and question data (JSON) |
| `public/assets/` | Your images and sounds (`public/assets/game/`), and replacement PNGs for core art (same file name) |

Everything else (`src/core/`, `src/main.ts`, `index.html`, build config, `tools/`, `dev/`, `public/assets/loading/`) is **locked**.
AI agents stop with a warning if asked to change it, and `tuning.json` is written only by the debug panel's **💾 Save** (top of the debug panel).

## 🔒 Locked (same in every game)

| What | Why it stays fixed |
|---|---|
| Top-left **Back, Pause, Settings** buttons: position, size (100 px), order | Players find them in the same spot in every game |
| **Z-index (depth)** of core elements: toolbar, HUD, overlays, popups, studio logo | Popups must always cover the game; the toolbar must stay clickable |
| Bottom-left **studio logo**: position and size | Branding |
| **Splash screen**: running mascot and ChimpVine logo animation | Branding (see `AGENTS.md` section 0) |
| **Core code and build setup** | Same behaviour, fixes and updates in every game |

These are enforced, not just written down:
- Core constants (`UIPositions`, `UILayers`, button styles) are frozen: assigning to them throws an error.
- If game code moves, resizes, rotates, hides or re-layers a locked button or the logo, or re-layers a popup, core puts it back and logs
  `[layout-lock] ... is locked by core` in the console.
- The debug inspector cannot drag them, and their size and depth fields are read-only.
- A saved layout entry for them in `tuning.json` is ignored, with a console warning.
- AI agents (Claude, Codex, Cursor, Antigravity) stop and show a warning before touching the files that set them.

Need a locked thing changed for a real reason? Ask the template lead. It is a change to the template, not to one game.

## ✅ Yours to change

### Button images and colors
- **Images:** replace the PNG in `public/assets/ui/` and keep the same file name, e.g. `settingsBtn.png`, `backBtn.png`,
  `pauseBtn.png`, `playButton.png`, `pausePanelButtons.png`. Toolbar icons are always shown at 100 px, so draw them square.
- **Colors:** `theme.colors` in `game.config.ts`, for example `theme: { colors: { sliderFill: 0x4cc9f0, panel: 0x2b1055 } }`.
  Every key is listed in `src/core/theme.ts`. Try them live first: `npm run dev` → debug panel → **Colors** tab.
- **Text (typography):** every screen uses named text styles (title, heading, hud, body, button, label, number)
  in Fredoka. Pick a set with `typography: 'candyFredokaBold'` (default, thick outlines) or `'candyFredoka'`
  (lighter outlines); compare them at `http://localhost:8080/dev/typography-lab.html`. Change single styles:
  ```ts
  theme: { typography: { title: { color: 0xffe066, size: 120 }, button: { stroke: 0x1d3557 } } }
  ```
  Your own text uses the same styles: `addText(scene, 'scoreText', x, y, 'Score 3', { style: 'hud' })`.
  Easiest way to tune them: `npm run dev` → debug panel → **Text** tab. Each style has text color, outline
  color, outline thickness, boldness, size, letter spacing and shadow, and **💾 Save** (top of the debug panel) keeps them. Not sure which
  style a text uses? Press **I** and click the text (or a button with a label): its style's controls appear right in the
  **Selected** section (they change every text with that style), and go back to the **Text** tab when you deselect.
  Your own font: put the file in `public/assets/fonts/`, list it in `assets.fonts`, set `theme.fonts`.
- **Button animation:** `buttonStyle` in `game.config.ts`. Try them all at `http://localhost:8080/dev/animation-lab.html`.

### Main menu and level selection backgrounds
Either replace `public/assets/backgrounds/menu.png` (main menu) and `game.png` (level selection and gameplay),
or give each screen its own image:
```ts
assets: { images: { myMenuBg: 'assets/game/menu-bg.png', myLevelsBg: 'assets/game/levels-bg.png' } },
mainMenu: { background: 'myMenuBg' },
levelSelection: { background: 'myLevelsBg' },
```

### Main menu Play button and title
```ts
mainMenu: {
    playButton: { texture: 'myPlay', scale: 0.8, x: 960, y: 760, pulse: true },   // all optional
    title: { image: 'myLogo', y: 240 }            // or { text: 'Smart Sorter', scale: 1.2 }
},
```
Hint: to place things by eye, run `npm run dev`, press **I** (Inspect), drag `playButton` or `menuTitle` where you want it,
then **💾 Save** (top of the debug panel). The offset is saved in `tuning.json` and also applies in the shipped game.

### Level selection grid and buttons
```ts
levelSelection: {
    columns: 4,        // cards per row (default 5 landscape / 2 portrait)
    gap: 60,           // space between cards in px (default 40)
    panel: false,      // hide the core panel and "Level Select" header
},
```
**Your own card design.** Return a container centred on (0, 0) and call `setSize(w, h)`, which is the click area.
Core names it `levelCard.<n>`, places it, scales it to fit, animates it and handles the click.
Locked cards are not clickable.
```ts
createCard: (scene, { level, unlocked, name }) => {
    const bg = scene.add.image(0, 0, unlocked ? 'cardOpen' : 'cardLocked').setName(`${name}.bg`);
    const label = addText(scene, `${name}.label`, 0, 0, String(level), { size: 90 });
    return scene.add.container(0, 0, [bg, label]).setSize(bg.width, bg.height);
},
```
**Your own card positions,** for example along a map path. When this is set, the grid is not used:
```ts
cardPosition: (level, count, scene) => ({ x: 200 + level * 300, y: level % 2 ? 450 : 700, scale: 0.9 }),
```
Hint: single cards can also be nudged with the inspector (`levelCard.3`) and saved like the Play button.

### The game itself
Everything inside a level is yours: `gameplay` in `game.config.ts`, your classes in `src/game/`, your data in `content/`,
your art and sounds in `public/assets/game/`. See `AGENTS.md` section 3 for how a game plugs in.

## Rules that still apply to your own UI
- Name every object (`setName`), use `UILayers` for depth (never a raw number), use `UIPositions` for
  screen anchors, and take colors and fonts from the theme.
- Do not create your own back, pause or settings buttons, menus or result screens. Core provides them.

Status: agreed
GDD: docs/GDD.md

## Next session
Steps 1-5 are complete and browser-verified (see Answers). Step 6 (accessibility) is substantially covered
already; the one open GDD item — drift speed adjustable from an in-game settings control — is intentionally
not built because core's settings schema is undocumented/hidden (no debug tab), and building a custom settings
screen would duplicate core (forbidden). Replace the placeholder `gameId: 0` with the real ChimpVine game ID
before enabling `api.enabled` or publishing.

## Steps
- [x] 1. Config, data and named shape placeholders for all 3 levels; launch through menu and level selection.
- [x] 2. Core loop, Level 1 only: drag/swipe routing, correct/incorrect feedback, score, win on completion.
- [x] 3. Add tap-channel-buttons and keyboard input; add streak meter and district counter HUD.
- [x] 4. Add Levels 2-3 data/drift, Reason Chip mechanic (panel, keys 1/2/3, bonus scoring), star rules.
- [x] 5. Add tutorial sequence, Chimpu console reactions, celebration/badge view, audio wiring.
- [x] 6. Accessibility pass (reduced motion, 64px touch targets, captioned hints) and polish.

## Game summary
Students route feature-signal cards to AI, Fixed Automation or Manual Tool channels via drag/swipe, tap or
keyboard. Correct routes light a city district and raise a streak; incorrect routes bounce back with a one-line
hint and re-queue, no points lost. Level 1 has 12 obvious signals, no timer, no drift. Levels 2-3 add gentle
card drift and Reason Chips (why was this AI/Automation/Manual?). Win by mapping every signal in a level; there
is no permanent game-over. 3 levels, landscape 16:9 (GDD dev resolution 1280x720, core canvas 1920x1080).
Learning goal: tell apart "learns from data" (AI), "follows a fixed rule" (Automation) and "needs a person" (Manual),
focused on a product's feature rather than the whole device.

## Template coverage
Core supplies splash, menus, level selection, HUD scene, locked toolbar (`[Pause][Settings]` top-left in Game),
Pause/Settings/Game-Completed panels, hint bubble (`ctx.showHint`), blocking tutorial (`ctx.showTutorial`),
progress saving, sound control (inside Settings, no separate button needed), debug panel. Configure in
`game.config.ts`: `orientation: 'landscape'`, `levelCount: 3`, `tutorial` steps, `theme.colors` (cyan AI / amber
automation / coral manual / mint correct / warm-yellow retry / navy panel, white text), `typography`,
`buttonStyle`, `mainMenu`/`levelSelection` backgrounds, `music.game`, `assets`. Gameplay must only call
`ctx.win` (never `ctx.lose`) since the GDD specifies no permanent game-over.

## Classes
- `SignalSwipeGameplay`: the `GameplayFactory`; wires everything, owns `ctx`, calls `win` on district-map completion.
- `RoundController`: shuffles the level's signal cards, re-queues wrong ones, tracks first-attempt/retry counts
  for star math and the streak.
- `SignalCardView`: draws/updates the current card (frame, icon placeholder, 1-6 word label), drift tween at the
  level's speed.
- `ChannelView` (AI / Automation / Manual): named zone with icon, label, theme color, accepts drop or tap, pulse
  feedback.
- `InputController`: drag/swipe direction detection, channel-button taps, keyboard (Left/A, Right/D, Down/S);
  removes all listeners in `destroy()`.
- `ReasonChipPanel` (Levels 2-3 only): three chip buttons after a correct route, keys 1/2/3, scores the 50-point
  bonus.
- `SignalHud`: custom top-left district name + signals-mapped counter, top-center streak meter, built with
  `addText`/`UIPositions` since `ctx.setHud` is a single string.
- `ChimpuConsoleView`: idle/nod/thinking/pointing/salute reactions using placeholder shapes until sprite art
  exists; positioned bottom-right (not bottom-left, see Conflicts).
- `CelebrationView`: lights the full district map, shows the Signal Mapper Badge, runs before `ctx.win`.
- `ReasonChipPanel`: the "why does it belong there?" question (3 buttons, keys 1/2/3) shown after every correct
  route in Levels 2-3; the three answers map 1:1 onto the `ai`/`automation`/`manual` channels, so correctness is
  derived from the channel just routed rather than stored as separate data.
All of the above are implemented in `src/game/`. Keep every class under 400 lines and every created object
named; clean up timers/listeners/objects in `destroy()`.

## Data
`content/levels.json`: `id`, `title`, `signalIds[]`, `driftSpeed`.
`content/signals.json`, one entry per card, example:
`{"id":"face-unlock","level":1,"label":"Face unlock","icon":"face","channel":"ai","reasonAnswer":"data","hint":"It learns patterns from face data.","district":"homes","difficulty":"easy"}`

## Assets
| Key | File | Size | Status |
|---|---|---:|---|
| `signalTowerBg` | `signal-tower.svg` | 1920x1080 | have |
| `signalMusic`, `cardArrive`, `swipeWhoosh`, `channelCorrect`, `cardBounce`, `streakUp`, `buildingLight`, `badgeEarned` | matching `.mp3` | short/60s | have |
| `signalCard` | `signal-card.png` | 480x320 | missing - placeholder rectangle |
| `aiChannel`/`automationChannel`/`manualChannel` | `channel-*.png` | 256x256 | missing - placeholder shape + theme color + symbol glyph |
| ~30 feature icons | `icon-*.png` | small | missing - placeholder glyph/text per signal |
| `reasonData`/`reasonRule`/`reasonManual` | `reason-*.png` | 160x160 | missing - placeholder chip buttons |
| Chimpu idle/nod/thinking/pointing/salute | `chimpu-*.png` spritesheets | 256x384 x4 (salute x6) | missing - placeholder shape + simple tween reactions |
| `cityLayer`, `controlRoomBg`, district map panel | `.png` | 1920x1080 | missing - use `signalTowerBg` + tinted overlay until art lands |

## Conflicts
- GDD wants Pause/Sound top-right; core's `[Pause][Settings]` are locked top-left. Kept core's placement,
  dropped the GDD position note.
- GDD puts Chimpu's console bottom-left, but the studio logo is also locked bottom-left. **Resolved:**
  `ChimpuConsoleView` is placed bottom-right instead; browser-verified not to overlap `studioLogo`'s bounds.
- GDD's animated "glowing hand swipes the card" tutorial isn't something core's step/text tutorial overlay does.
  Using `tutorial` text+image steps (already implemented) instead of a custom scripted demo.
- GDD's separate "Sound button" is already covered by core's Settings panel; no duplicate toolbar button needed.
- 1280x720 dev resolution vs. core's 1920x1080 landscape canvas: designed against the core canvas with
  `UIPositions` so it scales correctly.
- GDD's "drift speed adjustable in settings" has no home: core's settings schema exists but is explicitly
  undocumented/hidden (no debug tab), and building a custom settings screen would duplicate core (forbidden).
  Left unaddressed; drift speed is still tunable by editing `content/levels.json`.

## Answers
- Reason Chips appear after **every** correct routing in Levels 2-3 (not a fraction) — simplest reading of
  "after some correct routings" and it maximizes the data feeding the 3-star Reason-Chip-accuracy rule.
- Drift speeds kept as already defined in `content/levels.json` (0 / 0.25 / 0.5) — reasonable progression,
  no numeric spec given in the GDD.
- Speed bonus (GDD: "small, optional, ≤10% of total") left unimplemented — it's explicitly optional in the GDD
  and the other scoring rules (first-try/retry points, streak ×2, Reason Chip bonus) are all implemented.
- Chimpu's console placed bottom-right (see Conflicts); confirmed via a scripted browser check that its bounds
  never overlap the locked `studioLogo`'s bounds.
- `gameId: 0` and `api.enabled: false` left as-is — no real ChimpVine game ID was provided; replace before
  publishing.
- No teacher/admin-facing requirement beyond the GDD was raised.
- **Verified in a real browser session** (Chromium via CDP, `?debug`): Level 1 keyboard routing advances the
  Mapped counter and score; the tap channel zones (`channel.ai/automation/manual`) exist; Chimpu's console does
  not overlap the studio logo; `window.__cv.audit('Game')` and `audit('UIScene')` report `unnamed: []` and
  `duplicates: []` (all named, per AGENTS.md section 4); in Level 2, routing a card correctly shows the Reason
  Chip panel, pressing a number key answers it (correct answers highlight green, award +50 score and the
  streak/score/Reason-ratio HUD line update), and the panel is removed afterward with the next card loading; no
  console errors or `[names]`/`[layout-lock]` warnings during the run. `npm run typecheck` and `npm run build`
  both pass.

# CV Game

Educational game built on the CV project template: Phaser 3, TypeScript, Vite.

<!-- template-only -->
## Create a new game from this template

You must be a member of the **ChimpVine-Games** GitHub organization (the template is private).
Full guide: **[docs/CREATE-A-GAME.md](docs/CREATE-A-GAME.md)**.

**Option A: GitHub website (recommended)**
1. On this repository, click **Use this template** (top right) → **Create a new repository**.
2. Owner **ChimpVine-Games**, your game name (e.g. `Grade3-Smart-Sorter`), **Private** → **Create repository**.
3. Clone and set up:
```
git clone https://github.com/ChimpVine-Games/Grade3-Smart-Sorter.git
cd Grade3-Smart-Sorter
npm run setup        # asks: project name, orientation, game ID
npm ci
npm run dev
```

**Option B: command line**
```
npx github:ChimpVine-Games/cv-game-template                     # newest template
npx github:ChimpVine-Games/cv-game-template --template v0.1.0   # a specific version (git tag)
```
Creates a local folder and asks the same questions. Skip them with `--name`, `--orientation`, `--game-id`, `--title`.

Alternative: with the GitHub CLI (`gh`, a separate install) step 1 to 3 is one command:
`gh repo create ChimpVine-Games/Grade3-Smart-Sorter --template ChimpVine-Games/cv-game-template --private --clone`.

Template versions are git tags. A game keeps the template copy it was created from (`cvTemplate` in package.json).
<!-- /template-only -->

```
npm ci
npm run dev        # http://localhost:8080 with the debug panel
npm run build      # typecheck + production build into dist/
```

`dist/` is what gets uploaded to the server (built locally, never committed).

## Start building with AI

1. Put the game design document at `docs/GDD.md` (Google Docs: **File → Download → Markdown**). Add `docs/GDD.pdf` too if it has pictures. Commit it.
2. In your AI tool, run **`/read-gdd`** (or `/read-gdd docs/GDD.md`). It works in Claude Code, Cursor, Codex and Antigravity.
   The AI reads the GDD and the rules, writes no code, and replies with a summary, what the template already covers,
   the classes, data and assets to make, small build steps, and numbered questions. It saves this to `docs/PLAN.md`.
3. Answer the questions, then build **one step per chat**: "Do step 1 from docs/PLAN.md".
   After each step: play it, check Inspect shows `✓ all named`, commit, then **start a new chat** for the next step.
   The AI ticks the step and leaves a "Next session" note in `docs/PLAN.md`, so a new chat picks up from there.
   (Long chats re-send the whole conversation every message; new chats keep token use low.)

## Where things are

| Path | What |
|---|---|
| `src/game/game.config.ts` | The game: id, title, orientation, levels, gameplay, theme, assets |
| `src/game/` | This game's logic (replace `DemoGameplay.ts`) |
| `content/` | Level and content data (JSON) |
| `public/assets/game/` | This game's images and audio |
| `public/assets/{backgrounds,ui}/` | Core art; replace a PNG (same name) to reskin |
| `public/assets/loading/` | Splash art. Locked: cannot be replaced, reskinned or edited |
| `src/core/` | Shared flow, screens, HUD, overlays, services. Locked |
| `docs/GDD.md`, `docs/PLAN.md` | The game design and the agreed build plan (see above) |
| `AGENTS.md` | Rules for developers and AI. Read first |

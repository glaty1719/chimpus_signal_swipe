---
name: project-rules
description: Architecture, protected core scope, naming, theme, depth layers, fixed UI positions, gameplay contract and mobile rules for this CV Phaser game. Use before writing or changing any game code, UI, scenes or assets.
---

# Project rules

The rules live in one place: **`AGENTS.md` at the project root. Read it fully before changing anything.**

Summary of the hard rules:

1. Edit only `src/game/**`, `content/**`, `public/assets/**`. `src/core/**` is protected: ask before changing it.
2. Core owns the flow (MainMenu → LevelSelection → Game), all panels, overlays and toolbar buttons. Never rebuild them.
3. Gameplay plugs in through `config.gameplay(ctx)` and ends levels with `ctx.win()` / `ctx.lose()`.
4. Every object has a name (`setName`), `parent.part` for parts. Inspect must show `✓ all named`.
5. Colors and fonts from the theme, depths from `UILayers`, positions from `UIPositions`.
6. Sound only through `ctx.audio`; never gate gameplay on voice/TTS callbacks.
7. No file over 400 lines.
8. Core API: read only `src/core/index.ts` and `src/core/config.ts`; never browse the rest of `src/core/`.
9. If `docs/PLAN.md` exists, read it first and work one step at a time; open `docs/GDD.md` only for the section you need.

## References

- `references/mobile-and-ios-fixes.md`: iOS speech freezing, TTS hardening, orientation handling.
  Note: core already handles orientation (rotate prompt for landscape games, Android lock) and the black letterbox.
  The TTS service described there is not in core yet.

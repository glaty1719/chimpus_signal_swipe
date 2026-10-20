import type { GameConfig, Tuning } from '../core';
import tuning from '../../tuning.json';   // written by the debug panel's Save; applied over the defaults below
import levels from '../../content/levels.json';
import { createSignalSwipeGameplay } from './SignalSwipeGameplay';
import { createLevelCard } from './levelCard';

/**
 * THIS FILE IS THE GAME: identity, gameplay, content, look.
 * Core provides the flow (Main Menu → Level Selection → Game), the HUD, overlays and panels.
 */
export const gameConfig: GameConfig = {
    // --- Project identity (filled in by `create-cv-project`) ---
    id: 'chimpu-signal-swipe',
    gameId: 0,
    title: "Chimpu's Signal Swipe",
    orientation: 'landscape',

    levelCount: levels.length,
    gameplay: createSignalSwipeGameplay,
    tuning: tuning as Tuning,

    tutorial: [
        { title: 'Face Unlock', text: 'It learns from examples. Send it to AI.' },
        { title: 'Microwave Timer', text: 'It follows a set time. Send it to Fixed Automation.' },
        { title: 'Your turn', text: 'Drag a card, tap a channel, or use ← / → / ↓.' }
    ],

    // Paths are relative to public/. Put game files in public/assets/game/.
    assets: {
        images: { signalTowerBg: 'assets/game/signal-tower.svg' },
        audio: {
            signalMusic: 'assets/game/signal-music.mp3',
            cardArrive: 'assets/game/card-arrive.mp3',
            swipeWhoosh: 'assets/game/swipe-whoosh.mp3',
            channelCorrect: 'assets/game/channel-correct.mp3',
            cardBounce: 'assets/game/card-bounce.mp3',
            streakUp: 'assets/game/streak-up.mp3',
            buildingLight: 'assets/game/building-light.mp3',
            badgeEarned: 'assets/game/badge-earned.mp3'
        },
        fonts: {}
    },
    music: { game: 'signalMusic' },

    // Button animation for the whole game. Options: jellyPop, candyBounce, softBreathe, rubberBand,
    // popSparkle, gummySway. Try them: npm run dev → /dev/animation-lab.html
    buttonStyle: 'popSparkle',

    // Text styles for every screen: candyFredokaBold (default) or candyFredoka.
    // Compare them: npm run dev → /dev/typography-lab.html. Change single styles in theme.typography.
    typography: 'candyFredokaBold',

    // Look: override only what you need. See src/core/theme.ts for every key.
    theme: { colors: { panel: 0x091424, highlight: 0x44d9e8 } },

    mainMenu: { background: 'signalTowerBg', title: { text: "Chimpu's Signal Swipe", y: 270 } },
    levelSelection: { background: 'signalTowerBg', columns: 3, gap: 70, createCard: createLevelCard },

    api: { enabled: false }
};


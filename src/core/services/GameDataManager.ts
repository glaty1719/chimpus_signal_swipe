import { runtime } from '../runtime';
import { storage } from './storage';

interface Progress {
    /** Highest unlocked level (1-based). */
    unlockedLevel: number;
    starsPerLevel: Record<number, number>;
    highScores: Record<number, number>;
    tutorialSeen: boolean;
}

const emptyProgress = (): Progress => ({ unlockedLevel: 1, starsPerLevel: {}, highScores: {}, tutorialSeen: false });

/**
 * Level progress, stars, high scores. Stored in localStorage under `cv_game_<gameId>_progress`.
 * With the API enabled, the unlocked level from the server wins (see syncFromAPI).
 */
export class GameDataManager {
    private static instance: GameDataManager;

    public static getInstance(): GameDataManager {
        if (!GameDataManager.instance) GameDataManager.instance = new GameDataManager();
        return GameDataManager.instance;
    }

    private p: Progress;

    private constructor() {
        this.p = { ...emptyProgress(), ...storage.getJSON<Partial<Progress>>('progress', {}) };
    }

    private save() { storage.setJSON('progress', this.p); }

    /** The server's level is the source of truth when the API is on. */
    public syncFromAPI(level: number) {
        if (!runtime.config.api?.enabled) return;
        this.p.unlockedLevel = Math.max(1, level);
        this.save();
    }

    public unlockLevel(level: number) {
        const capped = Math.min(level, runtime.config.levelCount);
        if (capped > this.p.unlockedLevel) {
            this.p.unlockedLevel = capped;
            this.save();
        }
    }

    public completeLevel(level: number, stars = 3, score = 0) {
        this.p.starsPerLevel[level] = Math.max(this.p.starsPerLevel[level] ?? 0, stars);
        this.p.highScores[level] = Math.max(this.p.highScores[level] ?? 0, score);
        this.save();
        this.unlockLevel(level + 1);
    }

    public getUnlockedLevel() { return this.p.unlockedLevel; }
    public isLevelUnlocked(level: number) { return level <= this.p.unlockedLevel; }
    public getStars(level: number) { return this.p.starsPerLevel[level] ?? 0; }
    public getHighScore(level: number) { return this.p.highScores[level] ?? 0; }

    public isTutorialSeen() { return this.p.tutorialSeen; }
    public markTutorialSeen() {
        this.p.tutorialSeen = true;
        this.save();
    }

    public resetProgress() {
        this.p = emptyProgress();
        this.save();
    }
}

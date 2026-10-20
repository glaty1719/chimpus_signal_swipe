import Phaser from 'phaser';
import { runtime } from '../runtime';

export enum APIEvents {
    API_READY = 'API_READY',
    API_ERROR = 'API_ERROR'
}

/** ChimpVine WordPress REST gateways. */
const GATEWAY = {
    NONCE: '/wp-admin/admin-ajax.php?action=get_rest_nonce',
    GET_RESULT: '/wp-json/chimpvine/v1/get-game-result',
    SUBMIT_RESULT: '/wp-json/chimpvine/v1/submit-game-result',
    UPDATE_RESULT: '/wp-json/chimpvine/v1/update-game-result'
};

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/**
 * Talks to the ChimpVine backend when `config.api.enabled` is true.
 * With the API off, it reports ready immediately and every call is a no-op.
 */
export class APIService extends Phaser.Events.EventEmitter {
    private static instance: APIService;

    public static getInstance(): APIService {
        if (!APIService.instance) APIService.instance = new APIService();
        return APIService.instance;
    }

    private nonce = '';
    private domain = '';
    private userInstance = 0;
    private sessionActive = false;

    /** Highest level reported by the server. */
    public level = 1;
    public isInitialized = false;
    public isFailed = false;

    private constructor() {
        super();
        void this.init();
    }

    private get enabled() { return !!runtime.config.api?.enabled; }

    private async init() {
        if (!this.enabled) {
            this.isInitialized = true;
            // Emit on the next tick so listeners added right after getInstance() still hear it
            queueMicrotask(() => this.emit(APIEvents.API_READY));
            return;
        }
        try {
            const api = runtime.config.api!;
            this.domain = (api.testing ? api.testDomain : this.domainFromIframe(api.iframeId ?? 'cvgame')) ?? '';
            if (!this.domain) throw new Error('No domain name found');

            const nonceRes = await (await fetch(this.domain + GATEWAY.NONCE)).json();
            if (!nonceRes.success) throw new Error('Nonce fetch failed');
            this.nonce = nonceRes.data;

            const url = `${this.domain}${GATEWAY.GET_RESULT}?gameid=${runtime.config.gameId}`;
            const result = await (await fetch(url, { headers: { 'X-WP-Nonce': this.nonce } })).json();
            this.level = result.Level || 1;
            this.isInitialized = true;
            this.emit(APIEvents.API_READY);
        } catch (e) {
            console.error('[api] initialization failed', e);
            this.isFailed = true;
            this.emit(APIEvents.API_ERROR, e);
        }
    }

    /** The WordPress page embeds the game in an iframe whose `data-game` attribute holds the domain. */
    private domainFromIframe(iframeId: string): string | null {
        try {
            const iframe = window.parent.document.getElementById(iframeId);
            return iframe?.getAttribute('data-game') ?? null;
        } catch (e) {
            console.error('[api] cannot read the parent iframe', e);
            return null;
        }
    }

    private async post(path: string, body: unknown) {
        const res = await fetch(this.domain + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': this.nonce },
            body: JSON.stringify(body)
        });
        return res.json();
    }

    /** Called by core when a level starts. */
    public async postStart(level: number, sound: boolean, music: boolean) {
        if (!this.enabled || !this.isInitialized || this.sessionActive) return;
        this.sessionActive = true;
        try {
            const result = await this.post(GATEWAY.SUBMIT_RESULT, {
                GameID: runtime.config.gameId,
                Level: level,
                GameStartLocalDateTime: now(),
                SoundOnOff: sound ? 1 : 0,
                MusicOnOff: music ? 1 : 0,
                LevelPassed: 0,
                islevelend: 0
            });
            this.userInstance = result.userinstance;
        } catch (e) {
            console.error('[api] postStart failed', e);
            this.sessionActive = false;   // allow a retry
        }
    }

    /** Called by core when a level ends. */
    public async postEnd(points: number, total: number, levelData: string, completed: boolean) {
        if (!this.enabled || !this.sessionActive) return;
        this.sessionActive = false;
        try {
            const result = await this.post(GATEWAY.UPDATE_RESULT, {
                userinstance: this.userInstance,
                PointsEarned: points,
                TotalPoints: total,
                GameEndLocalDateTime: now(),
                LevelPassed: completed ? 1 : 0,
                islevelend: 1,
                LevelData: levelData
            });
            this.userInstance = result.userinstance;
        } catch (e) {
            console.error('[api] postEnd failed', e);
        }
    }
}

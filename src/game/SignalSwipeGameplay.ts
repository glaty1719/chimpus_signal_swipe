import Phaser from 'phaser';
import { UILayers, UIPositions, addText, homePosition, type Gameplay, type GameplayContext } from '../core';
import levels from '../../content/levels.json';
import signals from '../../content/signals.json';
import { CelebrationView } from './CelebrationView';
import { ChannelView } from './ChannelView';
import { DistrictStrip } from './DistrictStrip';
import { ReasonChipPanel } from './ReasonChipPanel';
import { SignalCardView } from './SignalCardView';
import { channelColor, prefersReducedMotion, type Channel } from './channelTheme';
import { lookColors } from './look';

interface LevelData { id: number; title: string; signalIds: string[]; driftSpeed: number }
interface SignalData { id: string; level: number; label: string; icon: string; channel: Channel; hint: string; district: string }

const FIRST_TRY_POINTS = 100;
const RETRY_POINTS = 50;
const REASON_BONUS_POINTS = 50;
const STREAK_MULTIPLIER_AT = 5;
/** Levels 2-3 only (GDD section 12): the Reason Chip question appears after every correct routing. */
const REASON_CHIPS_FROM_LEVEL = 2;

export function createSignalSwipeGameplay(ctx: GameplayContext): Gameplay {
    return new SignalSwipeGameplay(ctx);
}

/** Signal sorting loop using editable level data and named playfield objects. */
class SignalSwipeGameplay implements Gameplay {
    private readonly level: LevelData;
    private readonly queue: SignalData[];
    private readonly channels: ChannelView;
    private readonly districts: DistrictStrip;
    private readonly attempts = new Map<string, number>();
    private readonly objects: Phaser.GameObjects.GameObject[] = [];
    private readonly litDistricts = new Set<string>();
    private readonly celebration: CelebrationView;
    private cardView: SignalCardView | null = null;
    private reasonPanel: ReasonChipPanel | null = null;
    private feedback: Phaser.GameObjects.Text;
    private score = 0;
    private mapped = 0;
    private firstTryCorrect = 0;
    private reasonAsked = 0;
    private reasonCorrect = 0;
    private streak = 0;
    private bestStreak = 0;
    private transitioning = false;
    private finished = false;

    constructor(private readonly ctx: GameplayContext) {
        this.level = (levels as LevelData[])[ctx.level - 1];
        const allSignals = (signals as SignalData[]).filter(signal => signal.level === ctx.level);
        const byId = new Map(allSignals.map(signal => [signal.id, signal]));
        this.queue = Phaser.Utils.Array.Shuffle(this.level.signalIds.map(id => byId.get(id)).filter((signal): signal is SignalData => Boolean(signal)));

        const { scene } = ctx;
        const { width, height } = scene.scale;
        const { x: centerX, y: centerY } = UIPositions.center(scene);
        const cityDistricts = [...new Set((signals as SignalData[]).map(signal => signal.district))];
        const levelDistricts = [...new Set(allSignals.map(signal => signal.district))];
        this.celebration = new CelebrationView(ctx, ctx.level === ctx.levelCount ? cityDistricts : levelDistricts, ctx.level === ctx.levelCount);

        const skyline = scene.add.image(centerX, centerY, 'signalTowerBg')
            .setName('signalRoomBg').setDepth(UILayers.GAME_BACKGROUND).setDisplaySize(width, height);
        const veil = scene.add.rectangle(centerX, centerY, width, height, lookColors.overlay, 0.28)
            .setName('signalRoomVeil').setDepth(UILayers.GAME_WALLS);
        this.feedback = addText(scene, 'routeFeedback', centerX, centerY + 128, '', { style: 'heading' })
            .setAlpha(0).setDepth(UILayers.GAME_EFFECTS);
        this.objects.push(skyline, veil, this.feedback);

        this.channels = new ChannelView(ctx, channel => this.route(channel));
        this.districts = new DistrictStrip(ctx, levelDistricts);

        scene.input.on('drag', this.handleDrag, this);
        scene.input.on('dragstart', this.handleDragStart, this);
        scene.input.on('dragend', this.handleDragEnd, this);
        scene.input.keyboard?.on('keydown', this.handleKeyDown, this);
        this.updateHud();
        this.showNextCard();
    }

    private get card() {
        return this.cardView?.container ?? null;
    }

    private handleDrag(_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) {
        if (gameObject === this.card && !this.transitioning) this.card!.setPosition(dragX, dragY);
    }

    private handleDragStart(_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
        if (gameObject === this.card) this.ctx.scene.tweens.killTweensOf(this.card);
    }

    private handleDragEnd(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
        if (gameObject !== this.card || !this.card || this.transitioning) return;
        const channel = this.channels.channelAt(pointer.x, pointer.y);
        if (channel) {
            this.route(channel);
            return;
        }
        const home = homePosition(this.card);
        const card = this.card;
        this.ctx.scene.tweens.add({
            targets: card, x: home.x, y: home.y, duration: 180, ease: 'Sine.easeOut',
            onComplete: () => this.startCardDrift(card)
        });
    }

    private handleKeyDown(event: KeyboardEvent) {
        const channelByKey: Record<string, Channel> = {
            arrowleft: 'automation', a: 'automation',
            arrowright: 'ai', d: 'ai',
            arrowdown: 'manual', s: 'manual'
        };
        const channel = channelByKey[event.key.toLowerCase()];
        if (!channel) return;
        event.preventDefault();
        this.route(channel);
    }

    private showNextCard() {
        if (this.finished) return;
        const signal = this.queue[0];
        if (!signal) {
            this.finishLevel();
            return;
        }
        this.feedback.setAlpha(0);
        this.cardView = new SignalCardView(this.ctx, signal);
        this.ctx.audio.playSFX('cardArrive');
        if (!prefersReducedMotion()) {
            this.ctx.scene.tweens.add({ targets: this.card, alpha: { from: 0.4, to: 1 }, scale: { from: 0.86, to: 1 }, duration: 260, ease: 'Back.easeOut' });
            this.startCardDrift(this.card!);
        }
        this.updateHud();
    }

    private startCardDrift(card: Phaser.GameObjects.Container) {
        if (this.level.driftSpeed <= 0 || prefersReducedMotion() || !card.active || card !== this.card) return;
        const home = homePosition(card);
        this.ctx.scene.tweens.killTweensOf(card);
        this.ctx.scene.tweens.add({
            targets: card,
            y: home.y + this.level.driftSpeed * 80,
            duration: 2400 / this.level.driftSpeed,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private route(channel: Channel) {
        if (!this.card || this.transitioning || this.finished) return;
        const signal = this.queue[0];
        if (!signal) return;
        this.transitioning = true;
        const card = this.card;
        this.ctx.scene.tweens.killTweensOf(card);
        this.ctx.audio.playSFX('swipeWhoosh');
        if (channel === signal.channel) {
            const attempts = this.attempts.get(signal.id) ?? 0;
            if (attempts === 0) this.firstTryCorrect++;
            this.mapped++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
            const basePoints = attempts === 0 ? FIRST_TRY_POINTS : RETRY_POINTS;
            this.score += basePoints * (this.streak >= STREAK_MULTIPLIER_AT ? 2 : 1);
            this.ctx.audio.playSFX('channelCorrect');
            this.litDistricts.add(signal.district);
            this.ctx.audio.playSFX('buildingLight');
            this.districts.light(signal.district, channelColor(channel));
            this.channels.celebrate(channel);
            this.queue.shift();
            this.feedback.setText(this.channelFeedback(channel))
                .setColor(Phaser.Display.Color.IntegerToColor(channelColor(channel)).rgba)
                .setAlpha(1);
            if (!prefersReducedMotion()) {
                this.ctx.scene.tweens.add({ targets: this.feedback, alpha: 0, duration: 700, delay: 450, ease: 'Sine.easeOut' });
            }
            const slot = this.channels.slots[channel];
            const finishRoute = () => {
                this.cardView?.destroy();
                this.cardView = null;
                this.askReasonChip(channel, () => {
                    this.transitioning = false;
                    this.updateHud();
                    this.showNextCard();
                });
            };
            if (prefersReducedMotion()) finishRoute();
            else this.ctx.scene.tweens.add({
                targets: card, x: slot.x, y: slot.y, scale: 0.28, alpha: 0, duration: 420, ease: 'Cubic.easeIn', onComplete: finishRoute
            });
        } else {
            this.ctx.audio.playSFX('cardBounce');
            const mistakes = (this.attempts.get(signal.id) ?? 0) + 1;
            this.attempts.set(signal.id, mistakes);
            this.streak = 0;
            this.queue.push(this.queue.shift()!);
            this.ctx.showHint(signal.hint, 2400);
            if (mistakes >= 2) this.channels.pulse(signal.channel);
            const home = homePosition(card);
            const finishRetry = () => {
                this.cardView?.destroy();
                this.cardView = null;
                this.transitioning = false;
                this.showNextCard();
            };
            if (prefersReducedMotion()) finishRetry();
            else this.ctx.scene.tweens.add({
                targets: card, x: home.x, y: home.y, scale: 0.92, duration: 220, ease: 'Back.easeOut', onComplete: finishRetry
            });
        }
    }

    private channelFeedback(channel: Channel) {
        if (channel === 'ai') return 'LEARNS FROM DATA';
        if (channel === 'automation') return 'FIXED RULE';
        return 'PERSON OPERATED';
    }

    /** Reason Chip question (GDD section 12): Levels 2-3 only, after every correct routing. */
    private askReasonChip(channel: Channel, onDone: () => void) {
        if (this.level.id < REASON_CHIPS_FROM_LEVEL) {
            onDone();
            return;
        }
        this.reasonAsked++;
        this.reasonPanel = new ReasonChipPanel(this.ctx, channel, correct => {
            if (correct) {
                this.reasonCorrect++;
                this.score += REASON_BONUS_POINTS;
            }
            this.reasonPanel?.destroy();
            this.reasonPanel = null;
            onDone();
        });
    }

    private updateHud() {
    }

    private finishLevel() {
        if (this.finished) return;
        this.finished = true;
        this.ctx.hideHint();
        const accuracy = this.firstTryCorrect / this.level.signalIds.length;
        const reasonAccuracy = this.reasonAsked > 0 ? this.reasonCorrect / this.reasonAsked : 1;
        const stars = accuracy >= 0.9 && reasonAccuracy >= 0.8 ? 3 : accuracy >= 0.8 ? 2 : 1;
        this.celebration.show(stars, () => {
            this.celebration.destroy();
            this.ctx.win({ score: this.score, stars });
        });
    }

    destroy() {
        this.finished = true;
        this.ctx.scene.input.off('drag', this.handleDrag, this);
        this.ctx.scene.input.off('dragstart', this.handleDragStart, this);
        this.ctx.scene.input.off('dragend', this.handleDragEnd, this);
        this.ctx.scene.input.keyboard?.off('keydown', this.handleKeyDown, this);
        this.cardView?.destroy();
        this.cardView = null;
        this.reasonPanel?.destroy();
        this.reasonPanel = null;
        this.channels.destroy();
        this.districts.destroy();
        this.celebration.destroy();
        this.objects.forEach(object => object.destroy());
        this.objects.length = 0;
        this.ctx.hideHint();
    }
}

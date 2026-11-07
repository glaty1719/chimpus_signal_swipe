import { Scene } from 'phaser';
import { SCENE_KEYS } from '../../constants/SceneKeys.ts';
import { DataUtils } from '../../utils/dataUtils.ts';
import { sfx } from '../../utils/soundEffects.ts';
import { dataManager } from '../../utils/dataManager.ts';

interface SignalCardData {
    id: string;
    title: string;
    category: 'AI' | 'AUTOMATION' | 'MANUAL';
    reason: string;
    hint: string;
    icon: string;
    level?: number;
}

interface LevelData {
    level: number;
    title: string;
    description: string;
    cards: SignalCardData[];
}

export class SwipeScene extends Scene {
    #levelNumber: number = 1;
    #boxId?: string;
    #levelData?: LevelData;
    #cardQueue: SignalCardData[] = [];
    #currentCardData?: SignalCardData;
    #cardContainer?: Phaser.GameObjects.Container;
    #isDragging: boolean = false;
    #isCardAnimating: boolean = false;
    #dragStartX: number = 0;
    #dragStartY: number = 0;
    #cardAttempts: Record<string, number> = {};

    // Gameplay stats
    #score: number = 0;
    #totalCards: number = 0;
    #mappedCards: number = 0;
    #firstAttemptSuccessCount: number = 0;
    #reasonChipsCorrectCount: number = 0;
    #reasonChipsTotalCount: number = 0;

    // UI elements
    #scoreText?: Phaser.GameObjects.Text;
    #mappedText?: Phaser.GameObjects.Text;
    #chimpuSpeechText?: Phaser.GameObjects.Text;
    #chimpuConsoleContainer?: Phaser.GameObjects.Container;
    #leftChannelGlow?: Phaser.GameObjects.Rectangle;
    #rightChannelGlow?: Phaser.GameObjects.Rectangle;
    #bottomChannelGlow?: Phaser.GameObjects.Rectangle;
    #reasonChipModal?: Phaser.GameObjects.Container;

    constructor() {
        super(SCENE_KEYS.SWIPE_SCENE);
    }

    init(data?: { level?: number; boxId?: string }) {
        this.#levelNumber = Number(data?.level) || Number(dataManager.store.get("level")) || 1;
        this.#boxId = data?.boxId;
        this.#score = dataManager.store.get("score") || 0;

        // Retrieve cards already mapped in this level to prevent repeats across sessions
        const mappedInLevel: string[] = dataManager.store.get(`MAPPED_CARDS_LEVEL_${this.#levelNumber}`) || [];
        if (mappedInLevel.length >= 12) {
            // Level was completed previously; reset mapped cards for replaying
            dataManager.store.set(`MAPPED_CARDS_LEVEL_${this.#levelNumber}`, []);
            this.#mappedCards = 0;
        } else {
            this.#mappedCards = mappedInLevel.length;
        }

        dataManager.store.set("mappedSignals", this.#mappedCards);
        dataManager.store.set("level", this.#levelNumber);
        this.#firstAttemptSuccessCount = 0;
        this.#reasonChipsCorrectCount = 0;
        this.#reasonChipsTotalCount = 0;
        this.#cardAttempts = {};
        this.#isCardAnimating = false;
        this.#isDragging = false;
    }

    create() {
        const { width, height } = this.scale;

        // Load level cards from signals.json - STRICTLY filter by level
        const signalsData = DataUtils.getSignalsData(this);
        const levelConfig = signalsData?.levels?.find((lvl: LevelData) => Number(lvl.level) === Number(this.#levelNumber));

        this.#levelData = levelConfig;

        // Ensure ONLY respective level cards are included
        const allLevelCards = (levelConfig?.cards || []).filter((c: SignalCardData) => Number(c.level) === Number(this.#levelNumber));

        // Filter out cards already mapped in this level so cards NEVER repeat
        const mappedInLevel: string[] = dataManager.store.get(`MAPPED_CARDS_LEVEL_${this.#levelNumber}`) || [];
        const unmappedCards = allLevelCards.filter((c: SignalCardData) => !mappedInLevel.includes(c.id));

        const cardsToQueue = unmappedCards.length > 0 ? unmappedCards : allLevelCards;
        this.#cardQueue = Phaser.Utils.Array.Shuffle([...cardsToQueue]);
        this.#totalCards = 12;

        // Build Environment and UI
        this.#buildControlRoomEnvironment(width, height);
        this.#buildChannels(width, height);
        this.#buildHUD(width, height);
        this.#buildChimpuConsole(width, height);
        this.#setupKeyboardControls();

        // Spawn first card
        this.time.delayedCall(400, () => {
            this.#loadAndDisplayNextCard();
        });
    }

    #buildControlRoomEnvironment(width: number, height: number) {
        // Dark navy control room gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x060919, 0x060919, 0x0d1527, 0x0d1527, 1);
        bg.fillRect(0, 0, width, height);

        // Control room panoramic window grid
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x1e293b, 0.4);
        for (let x = 0; x < width; x += 48) {
            gridGraphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 48) {
            gridGraphics.lineBetween(0, y, width, y);
        }

        // Radar circle on floor / background
        const radar = this.add.graphics();
        radar.lineStyle(1.5, 0x00e5ff, 0.15);
        radar.strokeCircle(width / 2, height / 2, 160);
        radar.strokeCircle(width / 2, height / 2, 280);

        // Radar sweep effect
        const sweep = this.add.line(width / 2, height / 2, 0, 0, 200, 0, 0x00e5ff, 0.3);
        sweep.setOrigin(0, 0);
        this.tweens.add({
            targets: sweep,
            angle: 360,
            duration: 8000,
            repeat: -1,
            ease: 'Linear',
        });
    }

    #buildChannels(width: number, height: number) {
        // --- 1. LEFT CHANNEL: FIXED AUTOMATION (Amber) ---
        const leftBox = this.add.container(65, height / 2);
        this.#leftChannelGlow = this.add.rectangle(0, 0, 110, height * 0.62, 0xffb300, 0.12);
        const leftBorder = this.add.rectangle(0, 0, 105, height * 0.60, 0x12131a, 0.85);
        leftBorder.setStrokeStyle(2, 0xffb300, 0.7);

        const leftIcon = this.add.text(0, -60, '⚙️', { fontSize: '32px' }).setOrigin(0.5);
        const leftTitle = this.add.text(0, -10, 'FIXED\nAUTO', {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffb300',
            align: 'center',
        }).setOrigin(0.5);
        const leftSub = this.add.text(0, 45, 'Follows\nRules', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#cbd5e1',
            align: 'center',
        }).setOrigin(0.5);
        const leftKey = this.add.text(0, 95, '[A / ←]', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#ffb300',
        }).setOrigin(0.5);

        leftBorder.setInteractive({ useHandCursor: true });
        leftBorder.on('pointerdown', () => this.#routeToChannel('AUTOMATION'));

        leftBox.add([this.#leftChannelGlow, leftBorder, leftIcon, leftTitle, leftSub, leftKey]);

        // --- 2. RIGHT CHANNEL: AI (Cyan) ---
        const rightBox = this.add.container(width - 65, height / 2);
        this.#rightChannelGlow = this.add.rectangle(0, 0, 110, height * 0.62, 0x00e5ff, 0.12);
        const rightBorder = this.add.rectangle(0, 0, 105, height * 0.60, 0x12131a, 0.85);
        rightBorder.setStrokeStyle(2, 0x00e5ff, 0.7);

        const rightIcon = this.add.text(0, -60, '✨', { fontSize: '32px' }).setOrigin(0.5);
        const rightTitle = this.add.text(0, -10, 'AI\nFEATURE', {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#00e5ff',
            align: 'center',
        }).setOrigin(0.5);
        const rightSub = this.add.text(0, 45, 'Learns\nData', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#cbd5e1',
            align: 'center',
        }).setOrigin(0.5);
        const rightKey = this.add.text(0, 95, '[D / →]', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#00e5ff',
        }).setOrigin(0.5);

        rightBorder.setInteractive({ useHandCursor: true });
        rightBorder.on('pointerdown', () => this.#routeToChannel('AI'));

        rightBox.add([this.#rightChannelGlow, rightBorder, rightIcon, rightTitle, rightSub, rightKey]);

        // --- 3. BOTTOM CHANNEL: MANUAL TOOL (Coral) ---
        const bottomBox = this.add.container(width / 2, height - 48);
        this.#bottomChannelGlow = this.add.rectangle(0, 0, 340, 75, 0xff6e54, 0.12);
        const bottomBorder = this.add.rectangle(0, 0, 330, 70, 0x12131a, 0.85);
        bottomBorder.setStrokeStyle(2, 0xff6e54, 0.7);

        const bottomIcon = this.add.text(-120, 0, '🖐️', { fontSize: '26px' }).setOrigin(0.5);
        const bottomTitle = this.add.text(-40, 0, 'MANUAL TOOL', {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#ff6e54',
        }).setOrigin(0.5);
        const bottomSub = this.add.text(60, 0, 'Person Operated', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#cbd5e1',
        }).setOrigin(0.5);
        const bottomKey = this.add.text(135, 0, '[S / ↓]', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#ff6e54',
        }).setOrigin(0.5);

        bottomBorder.setInteractive({ useHandCursor: true });
        bottomBorder.on('pointerdown', () => this.#routeToChannel('MANUAL'));

        bottomBox.add([this.#bottomChannelGlow, bottomBorder, bottomIcon, bottomTitle, bottomSub, bottomKey]);
    }

    #buildHUD(width: number, height: number) {
        const headerBg = this.add.rectangle(width / 2, 28, width, 56, 0x080c18, 0.9);
        headerBg.setStrokeStyle(1, 0x1e293b);

        this.#mappedText = this.add.text(25, 28, `Signals Mapped: ${this.#mappedCards} / 12`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#38bdf8',
        }).setOrigin(0, 0.5);

        this.#scoreText = this.add.text(width / 2, 28, 'SCORE: ' + this.#score, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#e2e8f0',
        }).setOrigin(0.5);
    }

    #buildChimpuConsole(width: number, height: number) {
        this.#chimpuConsoleContainer = this.add.container(175, height - 48);

        const consoleBg = this.add.rectangle(0, 0, 230, 68, 0x0f172a, 0.95);
        consoleBg.setStrokeStyle(2, 0x00e5ff, 0.6);

        const avatarCircle = this.add.circle(-85, 0, 22, 0x1e293b);
        avatarCircle.setStrokeStyle(2, 0x00e5ff);
        const avatarEmoji = this.add.text(-85, 0, '🐵', { fontSize: '24px' }).setOrigin(0.5);

        const nameTag = this.add.text(-55, -24, 'CHIMPU [Signal Lead]', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#00e5ff',
        });

        this.#chimpuSpeechText = this.add.text(-55, -8, 'Route incoming signals to the channels!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#e2e8f0',
            wordWrap: { width: 160 },
        });

        this.#chimpuConsoleContainer.add([consoleBg, avatarCircle, avatarEmoji, nameTag, this.#chimpuSpeechText]);
    }

    #setupKeyboardControls() {
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (this.#isCardAnimating || this.#reasonChipModal) return;

            const key = event.key.toUpperCase();
            if (key === 'A' || key === 'ARROWLEFT') {
                this.#routeToChannel('AUTOMATION');
            } else if (key === 'D' || key === 'ARROWRIGHT') {
                this.#routeToChannel('AI');
            } else if (key === 'S' || key === 'ARROWDOWN') {
                this.#routeToChannel('MANUAL');
            }
        });
    }

    #loadAndDisplayNextCard() {
        if (this.#cardQueue.length === 0 || this.#mappedCards >= 12) {
            return;
        }

        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2 - 25;

        this.#currentCardData = this.#cardQueue.shift();
        if (!this.#currentCardData) {
            return;
        }

        const card = this.#currentCardData;
        this.#cardAttempts[card.id] = this.#cardAttempts[card.id] || 0;

        this.#cardContainer = this.add.container(centerX, -140);
        this.#cardContainer.setDepth(10);

        const cardWidth = 270;
        const cardHeight = 310;

        const shadow = this.add.rectangle(0, 6, cardWidth + 8, cardHeight + 8, 0x000000, 0.45);
        const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x1e293b);
        cardBg.setStrokeStyle(3, 0x38bdf8, 0.9);

        const header = this.add.rectangle(0, -cardHeight / 2 + 22, cardWidth, 44, 0x0f172a);
        const headerText = this.add.text(0, -cardHeight / 2 + 22, 'INCOMING SIGNAL', {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#38bdf8',
        }).setOrigin(0.5);

        const iconCircle = this.add.circle(0, -25, 46, 0x0f172a);
        iconCircle.setStrokeStyle(2, 0x38bdf8, 0.8);
        const iconText = this.add.text(0, -25, card.icon || '📡', { fontSize: '46px' }).setOrigin(0.5);

        const titleText = this.add.text(0, 48, card.title, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: cardWidth - 30 },
        }).setOrigin(0.5);

        const footerText = this.add.text(0, 115, 'Swipe: ◀ Auto | Down: Manual | AI: ▶', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#94a3b8',
        }).setOrigin(0.5);

        this.#cardContainer.add([shadow, cardBg, header, headerText, iconCircle, iconText, titleText, footerText]);

        sfx.playCardArrive();
        this.#isCardAnimating = true;

        this.tweens.add({
            targets: this.#cardContainer,
            y: centerY,
            duration: 450,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.#isCardAnimating = false;
                this.#enableCardDrag();

                if ((this.#cardAttempts[card.id] || 0) >= 2) {
                    this.#pulseHelperChannel(card.category);
                }
            }
        });
    }

    #enableCardDrag() {
        if (!this.#cardContainer) return;
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2 - 25;

        const cardBg = this.#cardContainer.list[1] as Phaser.GameObjects.Rectangle;
        cardBg.setInteractive({ draggable: true, useHandCursor: true });

        cardBg.on('dragstart', (pointer: Phaser.Input.Pointer) => {
            if (this.#isCardAnimating) return;
            this.#isDragging = true;
            this.#dragStartX = pointer.x;
            this.#dragStartY = pointer.y;
        });

        cardBg.on('drag', (pointer: Phaser.Input.Pointer) => {
            if (!this.#isDragging || !this.#cardContainer || this.#isCardAnimating) return;

            const deltaX = pointer.x - this.#dragStartX;
            const deltaY = pointer.y - this.#dragStartY;

            this.#cardContainer.x = centerX + deltaX;
            this.#cardContainer.y = centerY + deltaY * 0.75;
            this.#cardContainer.rotation = deltaX * 0.0008;

            if (deltaX < -50) {
                this.#leftChannelGlow?.setAlpha(0.4);
            } else if (deltaX > 50) {
                this.#rightChannelGlow?.setAlpha(0.4);
            } else if (deltaY > 50) {
                this.#bottomChannelGlow?.setAlpha(0.4);
            } else {
                this.#resetChannelGlows();
            }
        });

        cardBg.on('dragend', (pointer: Phaser.Input.Pointer) => {
            if (!this.#isDragging || this.#isCardAnimating) return;
            this.#isDragging = false;
            this.#resetChannelGlows();

            const deltaX = pointer.x - this.#dragStartX;
            const deltaY = pointer.y - this.#dragStartY;
            const threshold = 70;

            if (deltaX < -threshold) {
                this.#routeToChannel('AUTOMATION');
            } else if (deltaX > threshold) {
                this.#routeToChannel('AI');
            } else if (deltaY > threshold) {
                this.#routeToChannel('MANUAL');
            } else {
                this.tweens.add({
                    targets: this.#cardContainer,
                    x: centerX,
                    y: centerY,
                    rotation: 0,
                    duration: 200,
                    ease: 'Sine.easeOut',
                });
            }
        });
    }

    #resetChannelGlows() {
        this.#leftChannelGlow?.setAlpha(0.12);
        this.#rightChannelGlow?.setAlpha(0.12);
        this.#bottomChannelGlow?.setAlpha(0.12);
    }

    #pulseHelperChannel(category: 'AI' | 'AUTOMATION' | 'MANUAL') {
        const glow = category === 'AI' ? this.#rightChannelGlow
            : category === 'AUTOMATION' ? this.#leftChannelGlow : this.#bottomChannelGlow;

        if (glow) {
            this.tweens.add({
                targets: glow,
                alpha: 0.7,
                yoyo: true,
                repeat: 3,
                duration: 250,
            });
        }
    }

    #routeToChannel(chosenCategory: 'AI' | 'AUTOMATION' | 'MANUAL') {
        if (!this.#currentCardData || !this.#cardContainer || this.#isCardAnimating) return;

        this.#isCardAnimating = true;
        const card = this.#currentCardData;
        const isCorrect = card.category === chosenCategory;
        const { width, height } = this.scale;

        sfx.playSwipe();

        if (isCorrect) {
            this.#handleCorrectRouting(card, chosenCategory, width, height);
        } else {
            this.#handleIncorrectRouting(card);
        }
    }

    #handleCorrectRouting(card: SignalCardData, chosenCategory: 'AI' | 'AUTOMATION' | 'MANUAL', width: number, height: number) {
        sfx.playCorrect();

        const isFirstAttempt = (this.#cardAttempts[card.id] || 0) === 0;
        if (isFirstAttempt) {
            this.#firstAttemptSuccessCount++;
            this.#score += 100;
        } else {
            this.#score += 50;
        }

        // Track mapped card ID for this level so cards never repeat
        const mappedInLevel: string[] = dataManager.store.get(`MAPPED_CARDS_LEVEL_${this.#levelNumber}`) || [];
        if (!mappedInLevel.includes(card.id)) {
            mappedInLevel.push(card.id);
            dataManager.store.set(`MAPPED_CARDS_LEVEL_${this.#levelNumber}`, mappedInLevel);
        }
        this.#mappedCards = mappedInLevel.length;
        this.#updateHUD();

        let targetX = width - 65;
        let targetY = height / 2;
        let labelText = 'LEARNS FROM DATA';
        let channelGlow = this.#rightChannelGlow;

        if (chosenCategory === 'AUTOMATION') {
            targetX = 65;
            targetY = height / 2;
            labelText = 'FIXED RULE';
            channelGlow = this.#leftChannelGlow;
        } else if (chosenCategory === 'MANUAL') {
            targetX = width / 2;
            targetY = height - 48;
            labelText = 'PERSON OPERATED';
            channelGlow = this.#bottomChannelGlow;
        }

        if (channelGlow) {
            this.tweens.add({
                targets: channelGlow,
                alpha: 0.8,
                duration: 200,
                yoyo: true,
                repeat: 1,
            });
        }

        this.#showFloatingFeedback(labelText, true);
        this.#setChimpuSpeech(`Spot on! ${card.title} -> ${labelText}!`);
        this.#returnToWorld();
    }

    #handleIncorrectRouting(card: SignalCardData) {
        sfx.playWrong();
        this.#cardAttempts[card.id] = (this.#cardAttempts[card.id] || 0) + 1;
        this.#updateHUD();

        this.#setChimpuSpeech(`Wait! ${card.hint}`);
        this.#showFloatingFeedback('TRY AGAIN', false);

        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2 - 25;

        // Bounce back to center so the player can retry the exact same card
        this.tweens.add({
            targets: this.#cardContainer,
            x: centerX,
            y: centerY,
            rotation: 0,
            duration: 300,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                this.#isCardAnimating = false;
                
                // If user made 2+ mistakes on this card, pulse the correct channel guide
                if ((this.#cardAttempts[card.id] || 0) >= 2) {
                    this.#pulseHelperChannel(card.category);
                }
            }
        });
    }

    #promptReasonChip(card: SignalCardData) {
        const { width, height } = this.scale;
        this.#reasonChipsTotalCount++;

        this.#reasonChipModal = this.add.container(width / 2, height / 2 - 20);
        this.#reasonChipModal.setDepth(20);

        const modalBg = this.add.rectangle(0, 0, 480, 260, 0x090d1a, 0.96);
        modalBg.setStrokeStyle(2, 0x38bdf8);

        const title = this.add.text(0, -95, `WHY DOES IT BELONG HERE?`, {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#38bdf8',
        }).setOrigin(0.5);

        const sub = this.add.text(0, -65, `Pick the underlying principle:`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#94a3b8',
        }).setOrigin(0.5);

        const chipOptions = [
            { text: '1. Learns from data', answer: 'Learns from data' },
            { text: '2. Follows a fixed rule', answer: 'Follows a fixed rule' },
            { text: '3. Needs a person to operate it', answer: 'Needs a person to operate it' },
        ];

        chipOptions.forEach((opt, idx) => {
            const btnY = -15 + idx * 52;
            const btnBg = this.add.rectangle(0, btnY, 400, 42, 0x1e293b).setInteractive({ useHandCursor: true });
            btnBg.setStrokeStyle(1.5, 0x475569);

            const btnText = this.add.text(0, btnY, opt.text, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#ffffff',
            }).setOrigin(0.5);

            const selectAnswer = () => {
                const isCorrect = opt.answer === card.reason;
                if (isCorrect) {
                    sfx.playCorrect();
                    this.#reasonChipsCorrectCount++;
                    this.#score += 50;
                    this.#updateHUD();
                    btnBg.setFillStyle(0x059669);
                    this.#setChimpuSpeech('Exact reason! +50 bonus points!');
                } else {
                    sfx.playWrong();
                    btnBg.setFillStyle(0xd97706);
                    this.#setChimpuSpeech(`Actually: ${card.reason}`);
                }

                this.time.delayedCall(500, () => {
                    this.#reasonChipModal?.destroy();
                    this.#reasonChipModal = undefined;
                    this.#isCardAnimating = false;
                        this.#returnToWorld();
                });
            };

            btnBg.on('pointerdown', selectAnswer);

            const keyHandler = (event: KeyboardEvent) => {
                if (event.key === String(idx + 1)) {
                    this.input.keyboard?.off('keydown', keyHandler);
                    selectAnswer();
                }
            };
            this.input.keyboard?.on('keydown', keyHandler);

            this.#reasonChipModal?.add([btnBg, btnText]);
        });

        this.#reasonChipModal.add([modalBg, title, sub]);
    }

    #showFloatingFeedback(text: string, isPositive: boolean) {
        const { width, height } = this.scale;
        const color = isPositive ? 0x10b981 : 0xf59e0b;
        const banner = this.add.container(width / 2, height / 2 - 120);
        banner.setDepth(15);

        const bg = this.add.rectangle(0, 0, 240, 36, color, 0.95);
        const label = this.add.text(0, 0, text, {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        banner.add([bg, label]);

        this.tweens.add({
            targets: banner,
            y: banner.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Sine.easeOut',
            onComplete: () => banner.destroy(),
        });
    }

    #updateHUD() {
        this.#scoreText?.setText(`SCORE: ${this.#score}`);
        this.#mappedText?.setText(`Signals Mapped: ${this.#mappedCards} / 12`);
        dataManager.store.set('score', this.#score);
        dataManager.store.set('mappedSignals', this.#mappedCards);
    }

    #setChimpuSpeech(text: string) {
        this.#chimpuSpeechText?.setText(text);
    }

    #returnToWorld() {
        dataManager.store.set('score', this.#score);
        dataManager.store.set('mappedSignals', this.#mappedCards);
        this.cameras.main.fadeOut(500);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start(SCENE_KEYS.WORLD_SCENE);
        });
    }
}
import {Scene} from "phaser";
import {SCENE_KEYS} from "../../constants/SceneKeys.ts";
import {WORLD_ASSET_KEYS} from "../../constants/AssetsKeys.ts";
import {Player} from "../../world/character/Player.ts";
import {Coordinate, TiledObjectProperty} from "../../types/types.ts";
import {TILE_SIZE, TILED_COLLISION_LAYER_ALPHA} from "../../config.ts";
import {Controls} from "../../utils/controls.ts";
import {DIRECTION} from "../../constants/playerInput.ts";
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;
import {DATA_MANAGER_STORE_KEYS, dataManager} from "../../utils/dataManager.ts";
import ObjectLayer = Phaser.Tilemaps.ObjectLayer;
import {getTargetPositionFromGameObjectPositionAndDirection} from "../../utils/gridUtils.ts";
import {phrases} from "../../constants/appConstants.ts";
import {DialogUi} from "../../world/DialogUi.ts";
import {MysteryBox} from "../../world/MysteryBox.ts";
import {sfx} from "../../utils/soundEffects.ts";
// [NPC unused code commented out as per requirement 5]
// import {NPC} from "../../world/character/npc.ts";
// import Tilemap = Phaser.Tilemaps.Tilemap;
// import {CUSTOM_TILED_TYPES, TILED_NPC_PROPERTY} from "../../constants/appConstants.ts";
// import {NpcMovementPattern} from "../../types/types.ts";

export class WorldScene extends Scene {

    #player: Player;
    #controls: Controls;
    #encounterLayer: TilemapLayer | null;
    #signLayer: ObjectLayer | null;
    #dialogUi: DialogUi;
    #mysteryBoxes: MysteryBox[] = [];
    #isEncounterActive: boolean = false;
    #mappedText?: Phaser.GameObjects.Text;
    #scoreText?: Phaser.GameObjects.Text;
    #levelText?: Phaser.GameObjects.Text;

    // [NPC unused code commented out as per requirement 5]
    // #npcs: NPC[];
    // #npcPlayerIsInteractingWith: NPC | undefined;

    constructor ()
    {
        super(SCENE_KEYS.WORLD_SCENE);
    }

    init() {
        this.#isEncounterActive = false;
        // [NPC unused code commented out as per requirement 5]
        // this.#npcPlayerIsInteractingWith = undefined;
    }

    create(){
        const x = 6 * TILE_SIZE;
        const y = 9 * TILE_SIZE;

        // City map is 1280x1280
        this.cameras.main.setBounds(0, 0, 1280, 1280);
        this.cameras.main.setZoom(0.85);
        this.cameras.main.centerOn(x, y);

        const map = this.make.tilemap({key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL});
        const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION);
        if( !collisionTiles ) {
            console.error(`[${WorldScene.name}:create] encountered error while creating collision tiles`);
            return;
        }

        const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
        if( !collisionLayer ) {
            console.error(`[${WorldScene.name}:create] encountered error while creating collision layer`);
            return;
        }
        collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

        // Safe checks for layers that may not exist in city.json
        // const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
        // if (encounterTiles && map.getLayer('Encounter')) {
        //     this.#encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0);
        //     if (this.#encounterLayer) {
        //         this.#encounterLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);
        //     }
        // } else {
        //     this.#encounterLayer = null;
        // }

        // this.#signLayer = map.getObjectLayer('Sign') || null;

        // Render City Background
        this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);

        // [NPC unused code commented out as per requirement 5]
        // this.#createNPCs(map);

        // create player
        const savedPos = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION) || { x, y };
        this.#player = new Player({
            scene: this,
            position: savedPos,
            direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION) || DIRECTION.DOWN,
            collisionLayer: collisionLayer,
            spriteGridMovementFinishedCallback: () => {
                this.#handlePlayerMovementUpdate();
            },
            otherCharactersToCheckForCollisionWith: [],
        });

        this.cameras.main.startFollow(this.#player.sprite);

        // [NPC unused code commented out as per requirement 5]
        // this.#npcs.forEach(npc => {
        //     npc.addCharacterToCheckForCollisionsWith(this.#player);
        // });

        // Add mystery boxes around the world scene (requirement 6)
        this.#createMysteryBoxes();

        // Render Foreground overlay
        this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0).setDepth(4);
        
        const screenWidth = this.scale.width;
        const topMargin = 12;

        const currentLevel = Number(dataManager.store.get('level')) || 1;
        const currentScore = Number(dataManager.store.get('score')) || 0;
        const currentMapped = Number(dataManager.store.get('mappedSignals')) || 0;

        // 1. Mapped Text on the Left
        this.#mappedText = this.add.text(24, topMargin, `Signals Mapped: ${currentMapped} / 12`, {
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            color: '#e2e8f0',
            fontSize: '18px',
            stroke: '#000000',
            strokeThickness: 3,
        })
        .setScrollFactor(0)
        .setDepth(5);

        // 2. Score in the Middle
        this.#scoreText = this.add.text(screenWidth / 2, topMargin, `SCORE: ${currentScore}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            stroke: '#000000',
            fontStyle: 'bold',
            color: '#e2e8f0',
            strokeThickness: 3,
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(5);

        // 3. Level on the Right
        this.#levelText = this.add.text(screenWidth - 24, topMargin, `Level: ${currentLevel}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            stroke: '#000000',
            fontStyle: 'bold',
            color: '#e2e8f0',
            strokeThickness: 3,
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(5);

        this.#controls = new Controls(this);

        // create dialog ui
        this.#dialogUi = new DialogUi(this, 1280);

        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Check if all 12 mystery boxes are solved correctly -> trigger Level Transition!
        if (currentMapped >= 12) {
            this.time.delayedCall(500, () => {
                this.#triggerLevelTransition(currentLevel);
            });
        } else if (currentMapped === 0) {
            this.time.delayedCall(800, () => {
                let dialogString = '';
                switch (currentLevel) {
                    case 1:
                        dialogString = 'Welcome to Downtown Alpha! Investigate mystery boxes to learn about AI, Fixed Automation, and Manual Tools.';
                        break;
                    case 2:
                        dialogString = 'Welcome to Tech Harbor! 12 new mystery boxes have appeared. Uncover hidden AI features inside everyday tools and master Reason Chips!';
                        break;
                    case 3:
                        dialogString = 'Welcome to Neon Boulevard! The final district awaits. Solve all remaining mystery boxes to save the city!';
                        break;
                }
                this.#dialogUi.showDialogModal([
                    dialogString
                ]);
            });
        }
    }

    #createMysteryBoxes() {
        this.#mysteryBoxes = [];

        const currentLevel = Number(dataManager.store.get('level')) || 1;
        const collectedBoxIds: string[] = dataManager.store.get('COLLECTED_MYSTERY_BOXES') || [];

        // All active mystery boxes match the player's current progression level
        const boxLocations = [
            { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, id: `box_${currentLevel}_1` },
            { x: 11 * TILE_SIZE, y: 7 * TILE_SIZE, id: `box_${currentLevel}_2` },
            { x: 13 * TILE_SIZE, y: 10 * TILE_SIZE, id: `box_${currentLevel}_3` },
            { x: 5 * TILE_SIZE, y: 13 * TILE_SIZE, id: `box_${currentLevel}_4` },
            { x: 10 * TILE_SIZE, y: 18 * TILE_SIZE, id: `box_${currentLevel}_5` },
            { x: 18 * TILE_SIZE, y: 9 * TILE_SIZE, id: `box_${currentLevel}_6` },
            { x: 1 * TILE_SIZE, y: 1 * TILE_SIZE, id: `box_${currentLevel}_7` },
            { x: 3 * TILE_SIZE, y: 18 * TILE_SIZE, id: `box_${currentLevel}_8` },
            { x: 5 * TILE_SIZE, y: 3 * TILE_SIZE, id: `box_${currentLevel}_9` },
            { x: 10 * TILE_SIZE, y: 1 * TILE_SIZE, id: `box_${currentLevel}_10` },
            { x: 10 * TILE_SIZE, y: 5 * TILE_SIZE, id: `box_${currentLevel}_11` },
            { x: 10 * TILE_SIZE, y: 11 * TILE_SIZE, id: `box_${currentLevel}_12` },
        ];

        boxLocations
            .filter(loc => !collectedBoxIds.includes(loc.id))
            .forEach(loc => {
                const box = new MysteryBox({
                    scene: this,
                    x: loc.x,
                    y: loc.y,
                    level: currentLevel,
                    id: loc.id,
                });
                this.#mysteryBoxes.push(box);
            });
    }

    update(time: DOMHighResTimeStamp) {
        if (this.#isEncounterActive) {
            this.#player.update(time);
            return;
        }

        const selectedDirection = this.#controls.getDirectionKeyPressed();
        if (selectedDirection !== DIRECTION.NONE) {
            this.#player.moveCharacter(selectedDirection);
        }

        // hide dialog ui if player is moving
        if (this.#player.isMoving){
            this.#dialogUi.hideDialogModal();
        }

        // handle player interaction
        if (this.#controls.wasOkayKeyPressed() && !this.#player._isMoving){
            this.#handlePlayerInteraction();
        }

        this.#player.update(time);

        // Keep HUD text updated with dataManager
        const curMapped = Number(dataManager.store.get('mappedSignals')) || 0;
        const curScore = Number(dataManager.store.get('score')) || 0;
        const curLevel = Number(dataManager.store.get('level')) || 1;

        this.#mappedText?.setText(`Signals Mapped: ${curMapped} / 12`);
        this.#scoreText?.setText(`SCORE: ${curScore}`);
        this.#levelText?.setText(`Level: ${curLevel}`);

        // Check mystery box collision while moving or standing
        this.#checkMysteryBoxEncounter();

        // [NPC unused code commented out as per requirement 5]
        // this.#npcs.forEach((npc) => {
        //     npc.update(time);
        // })
    }

    #handlePlayerInteraction() {
        if(this.#dialogUi.textAnimationPlaying){
            return;
        }

        if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
            this.#dialogUi.hideDialogModal();
            // [NPC unused code commented out as per requirement 5]
            // if(this.#npcPlayerIsInteractingWith){
            //     this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false;
            //     this.#npcPlayerIsInteractingWith = undefined;
            // }
            return;
        }
        if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
            this.#dialogUi.showNextMessage();
            return;
        }

        const { x, y } = this.#player.sprite;
        const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({x,y}, this.#player.direction);

        const nearbySign = this.#signLayer?.objects?.find(object => {
            if(!object.x || !object.y) {
                return;
            }
            return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
        });

        if(nearbySign) {
            const props: TiledObjectProperty[] = nearbySign.properties;
            const msg: string = props.find(prop => prop.name === 'message')?.value;

            const usePlaceHolderText = this.#player.direction !== DIRECTION.UP;
            let textToShow = phrases.CANNOT_READ_SIGN_TEXT;
            if (!usePlaceHolderText) {
                textToShow = msg || phrases.SAMPLE_TEXT;
            }
            this.#dialogUi.showDialogModal([textToShow]);
            return;
        }

        // [NPC unused code commented out as per requirement 5]
        // const nearbyNpc = this.#npcs.find(npc => {
        //     return npc.sprite.x === targetPosition.x && npc.sprite.y === targetPosition.y;
        // });
        // if (nearbyNpc) {
        //     nearbyNpc.facePlayer(this.#player.direction);
        //     nearbyNpc.isTalkingToPlayer = true;
        //     this.#npcPlayerIsInteractingWith = nearbyNpc;
        //     this.#dialogUi.showDialogModal(nearbyNpc.messages);
        // }
    }

    #handlePlayerMovementUpdate() {
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
            x: this.#player.sprite.x,
            y: this.#player.sprite.y,
        });
        dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);

        // Check if player encounters a mystery box when movement completes
        this.#checkMysteryBoxEncounter();
    }

    #checkMysteryBoxEncounter() {
        if (this.#isEncounterActive) return;

        const playerX = this.#player.sprite.x;
        const playerY = this.#player.sprite.y;

        const encounteredBoxIndex = this.#mysteryBoxes.findIndex(box => box.checkCollision(playerX, playerY));
        if (encounteredBoxIndex !== -1) {
            this.#isEncounterActive = true;
            sfx.playMysteryEncounter();
            
            const encounteredBox = this.#mysteryBoxes[encounteredBoxIndex];
            encounteredBox.trigger();

            // Save collected box ID to dataManager persistence
            const collectedBoxIds: string[] = dataManager.store.get('COLLECTED_MYSTERY_BOXES') || [];
            if (!collectedBoxIds.includes(encounteredBox.id)) {
                collectedBoxIds.push(encounteredBox.id);
                dataManager.store.set('COLLECTED_MYSTERY_BOXES', collectedBoxIds);
            }

            // Remove the box from the active array and destroy its container/tweens
            this.#mysteryBoxes.splice(encounteredBoxIndex, 1);
            encounteredBox.destroy();

            this.cameras.main.fadeOut(600, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SCENE_KEYS.SWIPE_SCENE, { level: encounteredBox.level, boxId: encounteredBox.id });
            });
        }
    }

    #triggerLevelTransition(currentLevel: number) {
        this.#isEncounterActive = true;
        sfx.playStreak();

        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        const levelTitles = [
            { title: 'LEVEL 1 COMPLETE!', district: 'Downtown Alpha Mapped', badge: 'AI Spotter Chip', icon: '🏅', next: 'Level 2: Hidden Signals', desc: 'You mastered the difference between AI, Fixed Automation, and Manual Tools!' },
            { title: 'LEVEL 2 COMPLETE!', district: 'Tech Harbor Mapped', badge: 'Automation Spotter Chip', icon: '🎖️', next: 'Level 3: Same Device, Different Feature', desc: 'You uncovered hidden AI features inside everyday tools and mastered Reason Chips!' },
            { title: 'SIGNAL MAPPER CHAMPION!', district: 'All City Districts Mapped!', badge: 'Feature Detective Chip & Signal Mapper Badge', icon: '🌟', next: 'City Saved!', desc: 'Outstanding! Chimpu and you have built the ultimate map of where AI really lives!' }
        ];

        const info = levelTitles[Math.min(currentLevel - 1, levelTitles.length - 1)];

        const modalElements: Phaser.GameObjects.GameObject[] = [];

        // Dark overlay backdrop
        const overlay = this.add.rectangle(centerX, centerY, width, height, 0x020617, 0.88)
            .setScrollFactor(0)
            .setDepth(200)
            .setInteractive();

        // Dialog panel
        const panelWidth = 560;
        const panelHeight = 400;
        const panelBg = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x0f172a)
            .setScrollFactor(0)
            .setDepth(201)
            .setStrokeStyle(3, currentLevel === 1 ? 0x00e5ff : currentLevel === 2 ? 0xffb300 : 0x38bdf8);

        // Title text
        const titleText = this.add.text(centerX, centerY - 145, info.title, {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#38bdf8',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

        // District text
        const districtText = this.add.text(centerX, centerY - 112, `📍 ${info.district}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#94a3b8',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

        // Animated Badge circle
        const badgeCircle = this.add.circle(centerX, centerY - 45, 42, 0x1e293b)
            .setScrollFactor(0)
            .setDepth(202)
            .setStrokeStyle(3, 0x00e5ff);
        const badgeIcon = this.add.text(centerX, centerY - 45, info.icon, { fontSize: '40px' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(203);

        const badgeLabel = this.add.text(centerX, centerY + 10, `EARNED: ${info.badge}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#fbbf24',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

        // Description
        const descText = this.add.text(centerX, centerY + 52, info.desc, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#cbd5e1',
            align: 'center',
            wordWrap: { width: panelWidth - 60 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

        // Score summary
        const scoreVal = dataManager.store.get('score') || 0;
        const scoreText = this.add.text(centerX, centerY + 95, `TOTAL SCORE: ${scoreVal} PTS  |  12/12 BOXES SOLVED`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#34d399',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

        // Action button
        const buttonLabel = currentLevel < 3 ? `PROCEED TO LEVEL ${currentLevel + 1} ➡` : 'PLAY AGAIN 🔄';
        const btnY = centerY + 145;
        const actionBtn = this.add.rectangle(centerX, btnY, 320, 48, 0x0284c7)
            .setScrollFactor(0)
            .setDepth(203)
            .setStrokeStyle(2, 0x38bdf8)
            .setInteractive({ useHandCursor: true });

        const actionBtnText = this.add.text(centerX, btnY, buttonLabel, {
            fontFamily: 'Kenney-Future-Narrow, Arial, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(204).setInteractive({ useHandCursor: true });

        modalElements.push(overlay, panelBg, titleText, districtText, badgeCircle, badgeIcon, badgeLabel, descText, scoreText, actionBtn, actionBtnText);

        const setButtonHover = (hover: boolean) => {
            actionBtn.setFillStyle(hover ? 0x0ea5e9 : 0x0284c7);
            actionBtn.setScale(hover ? 1.04 : 1);
            actionBtnText.setScale(hover ? 1.04 : 1);
        };

        actionBtn.on('pointerover', () => setButtonHover(true));
        actionBtn.on('pointerout', () => setButtonHover(false));
        actionBtnText.on('pointerover', () => setButtonHover(true));
        actionBtnText.on('pointerout', () => setButtonHover(false));

        // Entrance alpha tween
        modalElements.forEach(el => {
            if ('setAlpha' in el) {
                (el as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0);
            }
        });
        this.tweens.add({
            targets: modalElements,
            alpha: 1,
            duration: 350,
            ease: 'Power2',
        });

        let isTransitioning = false;
        const cleanupAndExecute = () => {
            if (isTransitioning) return;
            isTransitioning = true;

            this.input.keyboard?.off('keydown', keyHandler);
            this.input.off('pointerdown', screenPointerHandler);
            modalElements.forEach(el => el.destroy());

            executeTransition();
        };

        const executeTransition = () => {
            sfx.playCorrect();
            const x = 6 * TILE_SIZE;
            const y = 9 * TILE_SIZE;

            dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, { x, y });

            if (currentLevel < 3) {
                // Advance level
                const nextLevel = currentLevel + 1;
                dataManager.store.set('level', nextLevel);
                dataManager.store.set('mappedSignals', 0);
                dataManager.store.set('COLLECTED_MYSTERY_BOXES', []);

                // Cleanly restart scene to place player at start and re-create level mystery boxes
                this.cameras.main.fadeOut(600, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.restart();
                });
            } else {
                // Completed all 3 levels - restart game
                dataManager.store.set('level', 1);
                dataManager.store.set('mappedSignals', 0);
                dataManager.store.set('score', 0);
                dataManager.store.set('COLLECTED_MYSTERY_BOXES', []);
                dataManager.store.set('MAPPED_CARDS_LEVEL_1', []);
                dataManager.store.set('MAPPED_CARDS_LEVEL_2', []);
                dataManager.store.set('MAPPED_CARDS_LEVEL_3', []);
                dataManager.store.set('INTRO_SHOWN_LEVEL_2', false);
                dataManager.store.set('INTRO_SHOWN_LEVEL_3', false);

                this.cameras.main.fadeOut(800, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.restart();
                });
            }
        };

        actionBtn.on('pointerdown', cleanupAndExecute);
        actionBtnText.on('pointerdown', cleanupAndExecute);

        const keyHandler = (event: KeyboardEvent) => {
            if (event.code === 'Space' || event.code === 'Enter') {
                cleanupAndExecute();
            }
        };
        this.input.keyboard?.on('keydown', keyHandler);

        // Fallback screen-space click detection:
        // Even if Phaser object hit-test has any edge-case discrepancy with camera zoom,
        // detect screen clicks directly on the rendered button area:
        const screenPointerHandler = (pointer: Phaser.Input.Pointer) => {
            const zoom = this.cameras.main.zoom;
            const renderedBtnX = (centerX - width * 0.5) * zoom + width * 0.5;
            const renderedBtnY = (btnY - height * 0.5) * zoom + height * 0.5;
            const halfW = (320 * zoom) / 2 + 10;
            const halfH = (48 * zoom) / 2 + 10;

            if (
                pointer.x >= renderedBtnX - halfW &&
                pointer.x <= renderedBtnX + halfW &&
                pointer.y >= renderedBtnY - halfH &&
                pointer.y <= renderedBtnY + halfH
            ) {
                cleanupAndExecute();
            }
        };
        this.input.on('pointerdown', screenPointerHandler);
    }

    // [NPC unused code commented out as per requirement 5]
    // #createNPCs(map: Tilemap) {
    //     this.#npcs = [];
    //     const npclayers = map.getObjectLayerNames().filter(layerName => layerName.includes('NPC'));
    //     npclayers.forEach(layerName => {
    //         const layer = map.getObjectLayer(layerName);
    //         const npcObject = layer?.objects.find(object => {
    //             return object.type === CUSTOM_TILED_TYPES.NPC;
    //         });
    //         if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) {
    //             return;
    //         }
    //         const pathObjects = layer?.objects.filter(object => {
    //             return object.type === CUSTOM_TILED_TYPES.NPC_PATH;
    //         });
    //         const npcPath: Record<number, Coordinate> = {
    //             0: {x: npcObject.x, y: npcObject.y - TILE_SIZE},
    //         };
    //         pathObjects?.forEach(path => {
    //             if( path.x === undefined || path.y === undefined ) {
    //                 return;
    //             }
    //             npcPath[parseInt(path.name, 10)] = {x: path.x, y: path.y - TILE_SIZE};
    //         });
    //         const props: TiledObjectProperty[] = npcObject.properties;
    //         const npcFrame: string = props.find(prop => prop.name === TILED_NPC_PROPERTY.FRAME)?.value || '0';
    //         const npcMessagesString: string = props.find(prop => prop.name === TILED_NPC_PROPERTY.MESSAGES)?.value || '';
    //         const npcMessages = npcMessagesString.split('::');
    //         const npcMovement: NpcMovementPattern = props.find(prop => prop.name === TILED_NPC_PROPERTY.MOVEMENT_PATTERN)?.value || 'IDLE';
    //         const npc = new NPC({
    //             scene: this,
    //             position: {x: npcObject.x, y: npcObject.y - TILE_SIZE},
    //             direction: DIRECTION.DOWN,
    //             frame: parseInt(npcFrame, 10),
    //             messages: npcMessages,
    //             npcPath,
    //             movementPattern: npcMovement,
    //         });
    //         this.#npcs.push(npc);
    //     });
    // }
}

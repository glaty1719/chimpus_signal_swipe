import Phaser, {Scene} from 'phaser';
import {DIRECTION_KEYS} from "../constants/playerInput.ts";
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;
import {Character} from "../world/character/Character.ts";

// --- Battle & Monster Types ---

export interface BattleMonsterConfig {
    /** The Phaser 3 Scene the battle menu will be added to */
    scene: Phaser.Scene;
    /** The details of the monster that is currently in battle */
    monsterDetails: Monster;
    /** Scales the health bar background vertically by the specified value, defaults to 1 */
    scaleHealthBarBackgroundImageByY?: number;
    /** Used to skip all animations tied to the monster during battle */
    skipBattleAnimations?: boolean;
}

export interface BattleNpcConfig {
    /** The Phaser 3 Scene the npc will be added to */
    scene: Phaser.Scene;
    /** The asset key that should be used for this npc */
    assetKey: string;
    /** If the asset key is tied to a spritesheet, this frame will be used, defaults to 0 */
    assetFrame?: number;
    /** Used to skip all animations tied to the npc during battle */
    skipBattleAnimations?: boolean;
}

export interface Monster {
    /** The unique identifier for this monster */
    id: string;
    /** The unique identifier for this monster type */
    monsterId: number;
    /** The name of the monster */
    name: string;
    /** The name of the asset key that should be used for this monster */
    assetKey: string;
    /** If the asset key is tied to a spritesheet, this frame will be used, defaults to 0 */
    assetFrame?: number;
    /** The current level of this monster */
    currentLevel: number;
    /** The max health of this monster */
    maxHp: number;
    /** The current health of this monster */
    currentHp: number;
    /** The base attack value of this monster */
    baseAttack: number;
    /** The ids of the attacks this monster uses */
    attackIds: number[];
    /** The current attack value of this monster */
    currentAttack: number;
    /** The base exp value of this monster */
    baseExp: number;
    /** The current exp this monster has */
    currentExp: number;
}

export interface Coordinate {
    /** The position of this coordinate */
    x: number;
    /** The position of this coordinate */
    y: number;
}

export interface Attack {
    /** The unique id of this attack */
    id: number;
    /** The name of this attack */
    name: string;
    /** The animation key tied to this attack */
    animationName: string; // Or import type { AttackKeys } from '../battle/attacks/attack-keys.js';
    /** The unique key of the audio asset cached by phaser */
    audioKey: string;
}

export interface Animation {
    key: string;
    frames?: number[];
    frameRate: number;
    repeat: number;
    delay: number;
    yoyo: boolean;
    assetKey: string;
}

// --- Item Types & Enums ---

export enum ITEM_CATEGORY {
    HEAL = 'HEAL',
    CAPTURE = 'CAPTURE',
}

export type ItemCategory = keyof typeof ITEM_CATEGORY;

export enum ITEM_EFFECT {
    HEAL_30 = 'HEAL_30',
    CAPTURE_1 = 'CAPTURE_1',
}

export type ItemEffect = keyof typeof ITEM_EFFECT;

export interface Item {
    /** The unique id of this item */
    id: number;
    /** The name of this item */
    name: string;
    /** The effect of using this item */
    effect: ItemEffect;
    /** The description of the item to show in the inventory bag */
    description: string;
    /** The main category of this item, healing, capture, etc */
    category: ItemCategory;
}

export interface BaseInventoryItem {
    item: {
        id: number;
    };
    quantity: number;
}

export type Inventory = BaseInventoryItem[];

export interface InventoryItem {
    item: Item;
    quantity: number;
}

export type EncounterData = Record<string, number[][]>;

// --- NPC JSON Data Types ---

export enum NPC_EVENT_TYPE {
    MESSAGE = 'MESSAGE',
    SCENE_FADE_IN_AND_OUT = 'SCENE_FADE_IN_AND_OUT',
    HEAL = 'HEAL',
    TRADE = 'TRADE',
    ITEM = 'ITEM',
    BATTLE = 'BATTLE',
}

export type NpcEventType = keyof typeof NPC_EVENT_TYPE;

export interface NpcEventMessage {
    type: 'MESSAGE';
    requires: string[];
    data: {
        messages: string[];
    };
}

export interface NpcEventSceneFadeInAndOut {
    type: 'SCENE_FADE_IN_AND_OUT';
    requires: string[];
    data: {
        fadeInDuration: number;
        fadeOutDuration: number;
        waitDuration: number;
    };
}

export interface NpcEventHeal {
    type: 'HEAL';
    requires: string[];
    data: Record<string, any>;
}

export interface NpcEventBattle {
    type: 'BATTLE';
    requires: string[];
    data: {
        monsters: number[];
        assetKey: string;
        trainerName: string;
        trainerLostMessages: string[];
    };
}

export type NpcEvent =
    | NpcEventMessage
    | NpcEventSceneFadeInAndOut
    | NpcEventHeal
    | NpcEventBattle;

export interface NpcDetails {
    frame: number;
    animationKeyPrefix: string;
    events: NpcEvent[];
}

export type NpcData = Record<string, NpcDetails>;

// --- Events JSON Data Types ---

export enum GAME_EVENT_TYPE {
    ADD_NPC = 'ADD_NPC',
    MOVE_TO_PLAYER = 'MOVE_TO_PLAYER',
    RETRACE_PATH = 'RETRACE_PATH',
    TALK_TO_PLAYER = 'TALK_TO_PLAYER',
    REMOVE_NPC = 'REMOVE_NPC',
    GIVE_MONSTER = 'GIVE_MONSTER',
    ADD_FLAG = 'ADD_FLAG',
    REMOVE_FLAG = 'REMOVE_FLAG',
}

export type GameEventType = keyof typeof GAME_EVENT_TYPE;

export interface GameEventAddNpc {
    type: 'ADD_NPC';
    data: {
        direction: any; // Replace with import('../common/direction.js').Direction if applicable
        x: number;
        y: number;
        frame: number;
        id: number;
        animationKeyPrefix: string;
    };
}

export interface GameEventMoveToPlayer {
    type: 'MOVE_TO_PLAYER';
    data: {
        id: number;
    };
}

export interface GameEventRetracePath {
    type: 'RETRACE_PATH';
    data: {
        id: number;
        direction: any; // Replace with Direction type if applicable
    };
}

export interface GameEventTalkToPlayer {
    type: 'TALK_TO_PLAYER';
    data: {
        id: number;
        messages: string[];
    };
}

export interface GameEventRemoveNpc {
    type: 'REMOVE_NPC';
    data: {
        id: number;
    };
}

export interface GameEventGiveMonster {
    type: 'GIVE_MONSTER';
    data: {
        id: number;
    };
}

export interface GameEventAddFlag {
    type: 'ADD_FLAG';
    data: {
        flag: GameFlag;
    };
}

export interface GameEventRemoveFlag {
    type: 'REMOVE_FLAG';
    data: {
        flag: GameFlag;
    };
}

export type GameEvent =
    | GameEventAddNpc
    | GameEventMoveToPlayer
    | GameEventRetracePath
    | GameEventRemoveNpc
    | GameEventTalkToPlayer
    | GameEventGiveMonster
    | GameEventAddFlag
    | GameEventRemoveFlag;

export interface EventDetails {
    requires: string[];
    events: GameEvent[];
}

export type EventData = Record<string, EventDetails>;

// --- Game Flags Data Types ---

export enum GAME_FLAG {
    LOOKING_FOR_PROFESSOR = 'LOOKING_FOR_PROFESSOR',
    FOUND_PROFESSOR = 'FOUND_PROFESSOR',
}

export type GameFlag = keyof typeof GAME_FLAG;

export enum BATTLE_FLAG {
    TRAINER_NOT_DEFEATED = 'TRAINER_NOT_DEFEATED',
    TRAINER_DEFEATED = 'TRAINER_DEFEATED',
}

export type BattleFlag = keyof typeof BATTLE_FLAG;

// --- Encounter Zone Tile Types ---

export enum ENCOUNTER_TILE_TYPE {
    NONE = 'NONE',
    GRASS = 'GRASS',
}

export type EncounterTileType = keyof typeof ENCOUNTER_TILE_TYPE;

// --- Camera Region ---

export interface CameraRegion {
    /** The unique id of this camera region */
    id: number;
    /** The x position of this camera region */
    x: number;
    /** The y position of this camera region */
    y: number;
    /** The width of this camera region */
    width: number;
    /** The height of this camera region */
    height: number;
}

// --- Tiled ---

export interface TiledObjectProperty {
    name: string;
    type: string;
    value: any;
}

// --- Sign Data ---

export interface SignDetails {
    message: string;
}

export type SignData = Record<string, SignDetails>;

export interface CharacterConfig {
    scene: Scene;
    assetKey: string;
    origin?: Coordinate;
    position: Coordinate;
    direction: DIRECTION_KEYS;
    spriteGridMovementFinishedCallback?: () => void;
    idleDirection: DIRECTION_KEYS;
    collisionLayer?: TilemapLayer;
    otherCharactersToCheckForCollisionWith?: Character[];
}

export type PlayerConfig = Omit<CharacterConfig, 'idleDirection' | 'assetKey'>;

interface NpcConfigTypes {
    frame: number;
    messages: string[];
    npcPath: NPCPath;
    movementPattern: NpcMovementPattern;
}

export type NpcConfig = PlayerConfig & NpcConfigTypes;

export interface Player {
    position: Coordinate;
    direction: DIRECTION_KEYS;
}
export interface GlobalState {
    player: Player;
}

export interface TiledObjectProperty {
    name: string;
    type: string;
    value: any;
}

export interface AnimateTextConfig {
    callback: () => void;
    delay: number;
}

export const NPC_MOVEMENT_PATTERN = {
  IDLE: 'IDLE',
  CLOCKWISE: 'CLOCKWISE',
} as const;

export type NpcMovementPattern = keyof typeof NPC_MOVEMENT_PATTERN;

export type NPCPath = Record<number, Coordinate>;
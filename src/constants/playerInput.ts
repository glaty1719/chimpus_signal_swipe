export type PLAYER_INPUT = "OK" |"CANCEL" | "LEFT" | "RIGHT" | "UP" | "DOWN" | "NONE";

export type DIRECTION_KEYS = Omit<PLAYER_INPUT, "OK" | "CANCEL">;

export const DIRECTION = Object.freeze({
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    UP: "UP",
    DOWN: "DOWN",
    NONE: "NONE",
});
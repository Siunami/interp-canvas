export const EFFECT_TYPES = {
	EFFECTS: "effects",
	ACTIONS: "actions",
} as const;

export type Effect = (typeof EFFECT_TYPES)[keyof typeof EFFECT_TYPES];

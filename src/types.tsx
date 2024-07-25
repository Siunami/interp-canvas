export const RETRIEVAL_TYPES = {
	EFFECTS: "effect",
	ACTIONS: "action",
	COSINE_SIM: "cos-sim",
	CO_OCCURRING_EFFECTS: "co_occurring_effects",
} as const;

export type Retrieval = (typeof RETRIEVAL_TYPES)[keyof typeof RETRIEVAL_TYPES];

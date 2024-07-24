export const RETRIEVAL_TYPES = {
	EFFECTS: "effects",
	ACTIONS: "actions",
	COSINE_SIM: "cosine_sim",
	CO_OCCURRING_EFFECTS: "co_occurring_effects",
} as const;

export type Retrieval = (typeof RETRIEVAL_TYPES)[keyof typeof RETRIEVAL_TYPES];

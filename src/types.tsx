export const RETRIEVAL_TYPES = {
	EFFECTS: "effects",
	ACTIONS: "actions",
	COSINE_SIM: "cosine_sim",
} as const;

export type Retrieval = (typeof RETRIEVAL_TYPES)[keyof typeof RETRIEVAL_TYPES];

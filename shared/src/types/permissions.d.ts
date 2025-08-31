export type RequirePram = "all" | "any";

export type Opts = {
	permissions: Permission[];
	require?: RequirePram;
};

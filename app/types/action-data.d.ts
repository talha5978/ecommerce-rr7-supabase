export type ActionResponse =
	| {
			success?: boolean;
			error?: string;
			validationErrors?: Record<string, string[]>;
	  }
	| undefined;

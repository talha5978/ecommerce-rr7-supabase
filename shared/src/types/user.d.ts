import { Database } from "./supabase";

export type AdminUser = {
	id: string;
	email: string;
	is_email_verified: boolean;
	createdAt: string;
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
	role: {
		role_id: number;
		role_name: string;
	};
};

export type FullUser = {
	id: string;
	email: string;
	is_email_verified: boolean;
	first_name: string | null;
	last_name: string | null;
	phone_number: string | null;
	role: {
		role_id: number;
		role_name: string;
	};
	address: Database["public"]["Tables"]["addresses"]["Row"] | null;
	createdAt: string | null;
	// Orders history and more.....
};

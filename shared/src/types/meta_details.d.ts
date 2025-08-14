import type { Database } from "@ecom/shared/types/supabase";

export type MetaDetailsRow = Database["public"]["Tables"]["meta_details"]["Row"];

export type MetaUpdationPayload = Database["public"]["Tables"]["meta_details"]["Update"];

import { type Database } from "@ecom/shared/types/supabase";
import { type ApiError } from "@ecom/shared/utils/ApiError";

type PureThing = Database["public"]["Tables"]["hero_sections"]["Row"];

export type HighLevelHeroSection = Omit<PureThing, "image">;

export type GetHighLvlHeroSections = {
	hero_sections: HighLevelHeroSection[];
	total: number;
	error: ApiError | null;
};

export type GetHeroSectionByIdResponse = {
	hero_section: PureThing | null;
	error: ApiError | null;
};

export type HeroSectionUpdationPayload = Database["public"]["Tables"]["hero_sections"]["Update"];

export type AllHomeHeroSectionsResponse = {
	hero_sections: PureThing[] | null;
	error: ApiError | null;
};

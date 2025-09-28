import { ApiError } from "@ecom/shared/utils/ApiError";
import { HeroSectionsService } from "@ecom/shared/services/hero-sections.service";
import { ActionFunctionArgs } from "react-router";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const heroSectionId = (params.hero_section_id as string) || "";
	if (!heroSectionId || heroSectionId == "") {
		return {
			success: false,
			error: "Hero section ID is required",
		};
	}

	try {
		const heroSectionService = new HeroSectionsService(request);
		await heroSectionService.deleteHeroSection(Number(heroSectionId));

        await queryClient.invalidateQueries({ queryKey: ["fp_hero_sections"] });
        await queryClient.invalidateQueries({ queryKey: ["highLvlHeroSections"] });
        await queryClient.invalidateQueries({ queryKey: ["getHeroSectionById"] });

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to delete hero section";

		return {
			success: false,
			error: errorMessage,
		};
	}
};

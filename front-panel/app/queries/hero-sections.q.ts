import { queryOptions } from "@tanstack/react-query";
import { FP_HeroSectionsService } from "@ecom/shared/services/hero-sections.service";
import type { AllHomeHeroSectionsResponse } from "@ecom/shared/types/hero-sections";

interface heroSectionsQArgs {
	request: Request;
}

export const getAllFPHeroSections = ({ request }: heroSectionsQArgs) => {
	return queryOptions<AllHomeHeroSectionsResponse>({
		queryKey: ["fp_hero_sections"],
		queryFn: async () => {
			const prodSvc = new FP_HeroSectionsService(request);
			const result = await prodSvc.getAllHeroSections();
			return result;
		},
	});
};

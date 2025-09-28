import { HeroSectionsService } from "@ecom/shared/services/hero-sections.service";
import type { GetHeroSectionByIdResponse, GetHighLvlHeroSections } from "@ecom/shared/types/hero-sections";
import { queryOptions } from "@tanstack/react-query";

type getHighLvlHeroSectionsARGS = {
	request: Request;
	q: string;
	pageIndex?: number;
	pageSize?: number;
};

type getHeroSectionByIdARGS = {
	request: Request;
	id: number;
};

export const HighLvlHeroSectionsQuery = ({ request, q, pageIndex, pageSize }: getHighLvlHeroSectionsARGS) => {
	return queryOptions<GetHighLvlHeroSections>({
		queryKey: ["highLvlHeroSections", q, pageIndex, pageSize],
		queryFn: async () => {
			const heroSectionSvc = new HeroSectionsService(request);
			const result = await heroSectionSvc.gethighLevelHeroSections(q, pageIndex, pageSize);
			return result;
		},
	});
};

export const getHeroSectionByIdQuery = ({ request, id }: getHeroSectionByIdARGS) => {
	return queryOptions<GetHeroSectionByIdResponse>({
		queryKey: ["getHeroSectionById", id],
		queryFn: async () => {
			const heroSectionSvc = new HeroSectionsService(request);
			const result = await heroSectionSvc.getHeroSectionById(id);
			return result;
		},
	});
};

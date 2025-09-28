import { Service } from "@ecom/shared/services/service";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { defaults } from "@ecom/shared/constants/constants";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";
import type {
	AllHomeHeroSectionsResponse,
	GetHeroSectionByIdResponse,
	GetHighLvlHeroSections,
	HeroSectionUpdationPayload,
} from "@ecom/shared/types/hero-sections";
import type { HeroUpdateActionData, HeroSectionCreateData } from "@ecom/shared/schemas/hero-section.schema";
import { MediaService } from "@ecom/shared/services/media.service";
import { stringToBooleanConverter } from "@ecom/shared/lib/utils";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<HeroSectionsService>(verifyUser))
export class HeroSectionsService extends Service {
	async gethighLevelHeroSections(
		q = "",
		pageIndex = 0,
		pageSize = defaults.DEFAULT_HERO_SECTIONS_PAGE_SIZE,
	): Promise<GetHighLvlHeroSections> {
		try {
			const from = pageIndex * pageSize;
			const to = from + pageSize - 1;

			let query = this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.select(
					`
					created_at, description, id, sort_order, status, url
				`,
					{ count: "exact" },
				)
				.range(from, to)
				.order("created_at", { ascending: false });

			if (q.length > 0) {
				query = query.ilike("description", `%${q}%`);
			}

			const { data: hero_sections, error: queryError, count } = await query;

			let error: null | ApiError = null;
			if (queryError) {
				error = new ApiError(queryError.message, 500, [queryError.details]);
			}

			return {
				hero_sections: hero_sections ?? [],
				total: count ?? 0,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { hero_sections: [], total: 0, error: err };
			}
			return {
				hero_sections: [],
				total: 0,
				error: new ApiError("Unknown error", 500, [err]),
			};
		}
	}

	async createHeroSection(input: HeroSectionCreateData): Promise<void> {
		const { description, image, sort_order, status, url } = input;

		let img_public_url = "";

		if (image && image.size > 0) {
			const mediaSvc = new MediaService(this.request);
			const { data } = await mediaSvc.uploadImage(image);
			img_public_url = data?.path ?? "";
			if (!img_public_url || img_public_url == "") {
				throw new ApiError("Failed to upload image", 500, []);
			}
		}

		const { error } = await this.supabase.from(this.HERO_SECTIONS_TABLE).insert({
			description,
			image: img_public_url,
			sort_order: sort_order,
			status: stringToBooleanConverter(status),
			url,
		});

		if (error !== null) {
			throw new ApiError(error.message, 500, [error.details]);
		}
	}

	async getHeroSectionById(id: number): Promise<GetHeroSectionByIdResponse> {
		try {
			const { data, error: queryError } = await this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.select("*")
				.eq("id", id)
				.single();

			const error: null | ApiError = queryError
				? new ApiError(queryError.message, 500, [queryError.details])
				: null;

			return {
				hero_section: data ?? null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { hero_section: null, error: err };
			}
			return {
				hero_section: null,
				error: new ApiError("Unknown error", 500, [err.message]),
			};
		}
	}

	async updateHeroSection(heroSectionId: number, input: Partial<HeroUpdateActionData>): Promise<void> {
		const { description, sort_order, image, status, url } = input;

		const { data, error } = await this.supabase
			.from(this.HERO_SECTIONS_TABLE)
			.select("image")
			.eq("id", heroSectionId)
			.single();

		if (error || data == null) {
			throw new ApiError(error.message, Number(error.code), [error.details]);
		}

		const currentStoredImg = data.image;
		let newImagePath: string | null = null;

		const mediaSvc = new MediaService(this.request);

		if (image) {
			if (typeof image === "string") {
				throw new ApiError("Please upload new image instead of image url", 400, []);
			}

			const { data } = await mediaSvc.uploadImage(image);

			if (!data?.path || data?.path == "") {
				throw new ApiError("Failed to upload image", 500, []);
			}

			newImagePath = data.path;
		}

		const payload: Partial<HeroSectionUpdationPayload> = {};

		if (description !== undefined) payload.description = description;
		if (sort_order !== undefined) payload.sort_order = sort_order;
		if (newImagePath != null) payload.image = newImagePath;
		if (status !== undefined) {
			payload.status = stringToBooleanConverter(status);
		}
		if (url !== undefined) payload.url = url;

		if (Object.keys(payload).length > 0) {
			const { error: dbERROR } = await this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.update(payload)
				.eq("id", heroSectionId);

			if (dbERROR) {
				if (newImagePath != null) await mediaSvc.deleteImage(newImagePath);
				throw new ApiError(
					`Failed to update hero section: ${dbERROR.message}`,
					Number(dbERROR.code),
					[],
				);
			}
		}

		if (newImagePath != null) {
			await mediaSvc.deleteImage(currentStoredImg);
		}
	}
}

@UseClassMiddleware(loggerMiddleware)
export class FP_HeroSectionsService extends Service {
	/** Hero sections for front panel home page */
	async getAllHeroSections(): Promise<AllHomeHeroSectionsResponse> {
		try {
			const { data, error: queryError } = await this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.select("*")
				.order("sort_order", { ascending: true });

			const error: null | ApiError = queryError
				? new ApiError(queryError.message, 500, [queryError.details])
				: null;

			return {
				hero_sections: data ?? null,
				error,
			};
		} catch (err: any) {
			if (err instanceof ApiError) {
				return { hero_sections: null, error: err };
			}
			return {
				hero_sections: null,
				error: new ApiError("Unknown error", 500, [err.message]),
			};
		}
	}
}

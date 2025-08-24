import { ApiError } from "@ecom/shared/utils/ApiError";
import type { UploadMediaResponse } from "@ecom/shared/types/media";
import { Service } from "@ecom/shared/services/service";
import { compressImage } from "@ecom/shared/utils/ImageCompression";
import { generateFilePath } from "@ecom/shared/utils/generateSlug";
import { UseClassMiddleware } from "@ecom/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@ecom/shared/middlewares/logger.middleware";
import { verifyUser } from "@ecom/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@ecom/shared/middlewares/utils";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<MediaService>(verifyUser))
export class MediaService extends Service {
	/** Uploads image to supabase storage */
	async uploadImage(file: File): Promise<UploadMediaResponse> {
		const compressedBuffer = await compressImage(file);
		const filePath = generateFilePath(file);
		const { data, error: uploadError } = await this.supabase.storage
			.from(this.IMAGES_BUCKET)
			.upload(filePath, compressedBuffer, {
				contentType: "image/webp",
				upsert: true,
			});

		if (uploadError) {
			throw new ApiError(`Failed to upload image: ${uploadError.message}`, 500, []);
		}

		return {
			data,
		};
	}

	/** Deletes image from supabase storage */
	async deleteImage(imagePath: string): Promise<void> {
		const { error: deleteError } = await this.supabase.storage
			.from(this.IMAGES_BUCKET)
			.remove([imagePath]);

		if (deleteError) {
			throw new ApiError(`Failed to delete image: ${deleteError.message}`, 500, []);
		}
	}
}

import { ApiError } from "~/utils/ApiError";
import type { UploadMediaResponse } from "~/types/media";
import { generateFilePath } from "~/utils/generateSlug";
import { compressImage } from "~/utils/ImageCompression";
import { Service } from "~/services/service";

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

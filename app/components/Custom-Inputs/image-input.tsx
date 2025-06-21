import { cn } from "~/lib/utils";
import { ImageIcon, XCircleIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Dropzone from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE, SUPABASE_IMAGE_BUCKET_PATH } from "~/constants";

interface ImageInputProps {
	name: string;
}

interface ImagePreviewProps {
	url: string;
	onRemove: () => void;
}

const COVER_IMAGE_MIN_DIMENSIONS = { width: 500, height: 600 };
const COVER_IMAGE_MAX_DIMENSIONS = { width: 1200, height: 1200 };

const ImagePreview = ({ url, onRemove }: ImagePreviewProps) => (
	<div className="relative">
		<button
			className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer"
			onClick={onRemove}
		>
			<XCircleIcon className="h-6 w-6 fill-primary text-primary-foreground" />
		</button>
		<img src={url} alt="Cover Image" className="border border-border rounded-md object-cover" />
	</div>
);

export default function ImageInput({ name }: ImageInputProps) {
	const { setValue, watch, setError, clearErrors } = useFormContext();
	const formValue = watch(name);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [dimensionError, setDimensionError] = useState<string | null>(null);

	const validateImage = useCallback((file: File): Promise<string | null> => {
		return new Promise((resolve) => {
			if (!ALLOWED_IMAGE_FORMATS.includes(file.type)) {
				return resolve(`Invalid file format. Only JPEG, PNG, or WebP are allowed.`);
			}
			if (file.size > MAX_IMAGE_SIZE) {
				return resolve(`File size exceeds 1MB.`);
			}
			const img = new Image();
			const objectUrl = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(objectUrl);
				const { width, height } = img;
				if (width < COVER_IMAGE_MIN_DIMENSIONS.width || height < COVER_IMAGE_MIN_DIMENSIONS.height) {
					resolve(
						`Dimensions must be at least ${COVER_IMAGE_MIN_DIMENSIONS.width}x${COVER_IMAGE_MIN_DIMENSIONS.height}px.`
					);
				} else if (
					width > COVER_IMAGE_MAX_DIMENSIONS.width ||
					height > COVER_IMAGE_MAX_DIMENSIONS.height
				) {
					resolve(
						`Dimensions must not exceed ${COVER_IMAGE_MAX_DIMENSIONS.width}x${COVER_IMAGE_MAX_DIMENSIONS.height}px.`
					);
				} else {
					resolve(null);
				}
			};
			img.onerror = () => {
				URL.revokeObjectURL(objectUrl);
				resolve(`Failed to load image.`);
			};
			img.src = objectUrl;
		});
	}, []);

	useEffect(() => {
		// Handle existing Supabase URL only
		if (typeof formValue === "string" && formValue) {
			setPreviewUrl(`${SUPABASE_IMAGE_BUCKET_PATH}/${formValue}`);
			setDimensionError(null);
			clearErrors(name);
		}
		// Do not clear previewUrl for File or null to avoid overriding handleDrop
		return () => {
			// Cleanup is handled in handleDrop and handleRemove
		};
	}, [formValue, name, clearErrors]);

	const handleDrop = async (input_files: File[]) => {
		if (input_files[0]) {
			const file = input_files[0];
			const error = await validateImage(file);

			if (error) {
				setError(name, { type: "manual", message: error });
				setDimensionError(error);
				setPreviewUrl(null);
				setValue(name, null, { shouldValidate: true });
			} else {
				clearErrors(name);
				setDimensionError(null);
				const objectUrl = URL.createObjectURL(file);
				setPreviewUrl(objectUrl);
				setValue(name, file, { shouldValidate: true });
			}
		}
	};

	const handleRemove = useCallback(() => {
		if (previewUrl && !previewUrl.startsWith(SUPABASE_IMAGE_BUCKET_PATH)) {
			URL.revokeObjectURL(previewUrl);
		}
		setValue(name, null, { shouldValidate: true });
		clearErrors(name);
		setPreviewUrl(null);
		setDimensionError(null);
	}, [setValue, name, clearErrors, previewUrl]);

	return (
		<div className="w-full max-w-[300px]">
			{previewUrl && !dimensionError ? (
				<ImagePreview url={previewUrl} onRemove={handleRemove} />
			) : (
				<Dropzone
					onDrop={handleDrop}
					accept={{ "image/*": [".png", ".jpeg", ".webp"] }}
					maxFiles={1}
					maxSize={MAX_IMAGE_SIZE}
				>
					{({ getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject }) => (
						<div
							{...getRootProps()}
							className={cn(
								"border border-dashed flex items-center justify-center aspect-square rounded-md focus:outline-none outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
								{
									"border-primary bg-secondary": isDragActive && isDragAccept,
									"border-destructive bg-destructive/20": isDragActive && isDragReject,
								}
							)}
						>
							<input {...getInputProps()} id={name} />
							<div className="flex flex-col items-center gap-2">
								<ImageIcon className="h-16 w-16" strokeWidth={0.85} />
								<div className="px-2 flex flex-col gap-1 justify-center items-center">
									<span className="text-sm text-muted-foreground">
										Drag n drop or click to upload
									</span>
									<span className="text-xs text-muted-foreground">
										{ALLOWED_IMAGE_FORMATS.map(
											(fmt) => `.${fmt.split("/")[1].toUpperCase()}`
										).join(", ")}
									</span>
									<span className="text-xs text-muted-foreground">MAX 1MB Supported</span>
									<span className="text-xs text-muted-foreground">600×600 to 1200×1200px</span>
									{dimensionError && (
										<span className="text-xs text-destructive">{dimensionError}</span>
									)}
								</div>
							</div>
						</div>
					)}
				</Dropzone>
			)}
		</div>
	);
}

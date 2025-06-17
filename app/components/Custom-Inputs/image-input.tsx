import { cn } from "~/lib/utils";
import { ImageIcon, XCircleIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Dropzone from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE, SUPABASE_IMAGE_BUCKET_PATH } from "~/constants";

interface ImageInputProps {
    name: string;
    register: any;
}

interface ImagePreviewProps {
    url: string;
    onRemove: () => void;
}

const COVER_IMAGE_MIN_DIMENSIONS = { width: 500, height: 600 };
const COVER_IMAGE_MAX_DIMENSIONS = { width: 1200, height: 1200 };

const ImagePreview = ({ url, onRemove }: ImagePreviewProps) => (
    <div className="relative">
        <button className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-pointer" onClick={onRemove}>
            <XCircleIcon className="h-6 w-6 fill-primary text-primary-foreground" />
        </button>
        <img src={url} alt={"Cover Image"} className="border border-border rounded-md object-cover" />
    </div>
);

export default function ImageInput({ name, register }: ImageInputProps) {
    const { setValue, watch , setError, clearErrors } = useFormContext();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [dimensionError, setDimensionError] = useState<string | null>(null);
    const formValue = watch(name);

    // Validate image dimensions, size, and format
    const validateImage = useCallback((file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!ALLOWED_IMAGE_FORMATS.includes(file.type)) {
                resolve(`Invalid file format. Only JPEG, PNG, or WebP image formats are allowed.`);
                return;
            }

            if (file.size > MAX_IMAGE_SIZE) {
                resolve(`File size exceeds 1MB.`);
                return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                const { width, height } = img;
                URL.revokeObjectURL(objectUrl);

                if (width < COVER_IMAGE_MIN_DIMENSIONS.width || height < COVER_IMAGE_MIN_DIMENSIONS.height) {
                    resolve(
                        `Image dimensions must be at least ${COVER_IMAGE_MIN_DIMENSIONS.width}x${COVER_IMAGE_MIN_DIMENSIONS.height}px.`
                    );
                } else if (
                    width > COVER_IMAGE_MAX_DIMENSIONS.width ||
                    height > COVER_IMAGE_MAX_DIMENSIONS.height
                ) {
                    resolve(
                        `Image dimensions must not exceed ${COVER_IMAGE_MAX_DIMENSIONS.width}x${COVER_IMAGE_MAX_DIMENSIONS.height}px.`
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
        if (typeof formValue === "string" && formValue) {
            const imageUrl = `${SUPABASE_IMAGE_BUCKET_PATH}/${formValue}`;
            setProfilePicture(imageUrl);
            setDimensionError(null);
        } else if (formValue instanceof File) {
            validateImage(formValue).then((error) => {
                if (error) {
                    setError(name, { type: "manual", message: error });
                    setProfilePicture(null);
                } else {
                    clearErrors(name);
                    const imageUrl = URL.createObjectURL(formValue);
                    setProfilePicture(imageUrl);
                    // Cleanup preview URL on unmount or change
                    return () => URL.revokeObjectURL(imageUrl);
                }
            });
        } else {
            setProfilePicture(null);
            setDimensionError(null);
            clearErrors(name);
        }

        // Cleanup preview URL if it’s a blob
        return () => {
            if (profilePicture && profilePicture.startsWith("blob:")) {
                URL.revokeObjectURL(profilePicture);
            }
        };
    }, [formValue, setError, clearErrors, name, validateImage, profilePicture]);

    const handleDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setProfilePicture(imageUrl);
            setValue(name, file, { shouldValidate: true });
        }
    };

    const handleRemove = useCallback(() => {
        setValue(name, null, { shouldValidate: true });
        setProfilePicture(null);
        setDimensionError(null);
        clearErrors(name);
        console.log(dimensionError);
        
    }, [setValue, name, clearErrors]);

    return (
		<div className="w-full *:max-w-[300px]">
			{profilePicture && !dimensionError ? (
				<ImagePreview url={profilePicture} onRemove={handleRemove} />
			) : (
				<Dropzone
					onDrop={handleDrop}
					accept={{
						"image/*": [".png", ".jpeg", ".webp"],
					}}
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
							<input {...getInputProps()} {...register} id={name} />
							<div className="flex flex-col items-center gap-2">
								<ImageIcon className="h-16 w-16" strokeWidth={0.85} />
								<span className="text-sm text-muted-foreground">
									Drag and drop or click to upload
								</span>
								<span className="text-xs text-muted-foreground">
									{ALLOWED_IMAGE_FORMATS.map(
										(format) => `.${format.split("/")[1].toUpperCase()}`
									).join(", ")}
								</span>
								<span className="text-xs text-muted-foreground">MAX 1MB Supported</span>
								<span className="text-xs text-muted-foreground">
									600x600 to 1200x1200px, MAX 1MB
								</span>
								{dimensionError && (
									<span className="text-xs text-destructive">{dimensionError}</span>
								)}
							</div>
						</div>
					)}
				</Dropzone>
			)}
		</div>
	);
}
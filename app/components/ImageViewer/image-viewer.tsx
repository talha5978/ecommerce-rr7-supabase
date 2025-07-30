import { cn } from "~/lib/utils";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "@radix-ui/react-dialog";
import { MinusCircle, PlusCircle, X } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "~/components/ui/button";

const DEFAULT_PLACEHOLDER_URL =
	"https://www.google.com/url?sa=i&url=https%3A%2F%2Fwallpapers.com%2Fblank-white-background&psig=AOvVaw267cKwkHwDis3w_7n710Id&ust=1752859270362000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCNDEwuSzxI4DFQAAAAAdAAAAABAM";

interface ImageViewerProps {
	className?: string;
	classNameImageViewer?: string;
	classNameThumbnailViewer?: string;
	imageTitle?: string;
	imageUrl: string;
	thumbnailUrl?: string;
	placeholderUrl?: string;
	Placeholder?: React.ComponentType<{ className?: string }>;
	showControls?: boolean;
}

const ImageViewer = ({
	className,
	classNameImageViewer,
	classNameThumbnailViewer,
	imageTitle,
	imageUrl,
	placeholderUrl = DEFAULT_PLACEHOLDER_URL,
	showControls = true,
	thumbnailUrl,
}: ImageViewerProps) => {
	const handleImgError = (event: React.SyntheticEvent<HTMLImageElement>) => {
		console.error("Image failed to load", event.currentTarget.src);
		event.currentTarget.src = placeholderUrl;
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<div className={cn("cursor-pointer", className)}>
					{/* You can swap this with your preferred image optization technique, like using  next/image */}
					<img
						src={thumbnailUrl || imageUrl}
						alt={`${imageTitle ?? "Image"} - Preview`}
						width="100%"
						className={cn(
							"h-auto w-full rounded-lg object-contain transition-opacity hover:opacity-90",
							classNameThumbnailViewer,
						)}
						onError={handleImgError}
						loading="lazy"
					/>
				</div>
			</DialogTrigger>
			<DialogPortal>
				<DialogOverlay className="fixed inset-0 z-50 bg-black/70" />
				<DialogContent className="bg-background fixed inset-0 z-50 flex flex-col items-center justify-center p-0">
					<DialogTitle className="sr-only">{imageTitle || "Image"}</DialogTitle>
					<DialogDescription className="sr-only">{imageTitle || "Image"}</DialogDescription>
					<div className="relative flex h-screen w-screen items-center justify-center">
						<TransformWrapper initialScale={1} initialPositionX={0} initialPositionY={0}>
							{({ zoomIn, zoomOut }) => (
								<>
									<TransformComponent>
										{/* You can swap this with your preferred image optization technique, like using  next/image */}
										<img
											src={imageUrl}
											alt={`${imageTitle ?? "Image"} - Full`}
											className={cn(
												"max-h-[90vh] max-w-[90vw] object-contain",
												classNameImageViewer,
											)}
											onError={handleImgError}
										/>
									</TransformComponent>
									{showControls && (
										<div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
											<Button
												onClick={() => zoomOut()}
												variant={"ghost"}
												size={"icon"}
												className="rounded-full p-2 bg-black/50 text-white transition-colors"
												aria-label="Zoom out"
											>
												<MinusCircle className="size-6" />
											</Button>
											<Button
												onClick={() => zoomIn()}
												variant={"ghost"}
												size={"icon"}
												className="rounded-full p-2 bg-black/50 text-white transition-colors"
												aria-label="Zoom in"
											>
												<PlusCircle className="size-6" />
											</Button>
										</div>
									)}
								</>
							)}
						</TransformWrapper>
						<DialogClose asChild>
							<Button
								variant={"ghost"}
								size={"icon"}
								className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors"
								aria-label="Close"
							>
								<X className="size-6" />
							</Button>
						</DialogClose>
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default ImageViewer;

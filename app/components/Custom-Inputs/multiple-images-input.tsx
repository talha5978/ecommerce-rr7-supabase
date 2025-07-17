import { Label } from "~/components/ui/label";
import ImageInput, { type ImgDimensions } from "./image-input";
import { cn } from "~/lib/utils";

type MultipleImagesInputProps = {
	name: string;
	dimensions: ImgDimensions
};

export default function MultipleImagesInput({ name, dimensions }: MultipleImagesInputProps) {
	// Change this to the number of images you want or set it as a prop
	const FourImages = [0, 1, 2, 3];

	return (
		<div className="space-y-6">
			<div className="grid max-[580px]:grid-cols-1 max-[768px]:grid-cols-2 max-[1170px]:grid-cols-1 grid-cols-2">
				{FourImages.map((index) => (
					<div
						key={index}
						className={cn(
							"flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
						)}
					>
						<Label htmlFor={`${name}[${index}]`}>Image {index + 1}</Label>
						<ImageInput
							name={`${name}[${index}]`}
							key={`${name}[${index}]`}
							dimensions={dimensions}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

import ImageInput from "./image-input";
import { cn } from "~/lib/utils";

export default function MultipleImagesInput({ name }: { name: string }) {
	return (
		<div className="space-y-6">
			<div className="grid max-[580px]:grid-cols-1 max-[768px]:grid-cols-2 max-[1170px]:grid-cols-1 grid-cols-2">
				{[0, 1, 2, 3].map((index) => (
					<div
						key={index}
						className={cn(
							"flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
						)}
					>
						<label className="text-sm font-medium text-foreground">Image {index + 1}</label>
						<ImageInput name={`${name}[${index}]`} />
					</div>
				))}
			</div>
		</div>
	);
}


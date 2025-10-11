import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { cn } from "@ecom/shared/lib/utils";
import { Label } from "~/components/ui/label";

type Props = {
	items: {
		id: string;
		name: string;
		value: string;
	}[];
	value: string;
	onValueChange: (value: string) => void;
};

function ColorInput({ items, value, onValueChange }: Props) {
	return (
		<RadioGroup
			key={"colors-selection-show"}
			value={value}
			onValueChange={onValueChange}
			className="flex mt-1"
		>
			{items.map((item) => (
				<Label
					key={item.value}
					htmlFor={item.id}
					className={cn(
						"flex items-center justify-center px-4 py-2 bg-accent rounded-md cursor-pointer transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring",
						item.value === value && "outline-2 outline-primary bg-accent/80",
					)}
				>
					<RadioGroupItem value={item.value} id={item.id} className="sr-only" />
					<div className="flex gap-2 items-center">
						<p>{item.name}</p>
						<p style={{ backgroundColor: item.value }} className={`p-2 rounded-full`} />
					</div>
				</Label>
			))}
		</RadioGroup>
	);
}

function SizeInput({ items, value, onValueChange }: Props) {
	const radioGroupKey = items
		.map((s) => s.value)
		.sort()
		.join(",");
	// console.log("Size input value: ", value);

	return (
		<RadioGroup key={radioGroupKey} value={value} onValueChange={onValueChange} className="flex mt-1">
			{items.map((item) => (
				<Label
					key={item.value}
					htmlFor={item.id}
					className={cn(
						"flex items-center justify-center px-4 py-2 bg-accent rounded-md cursor-pointer transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring",
						item.value === value && "outline-2 outline-primary bg-accent/80",
					)}
				>
					<RadioGroupItem value={item.value} id={item.id} className="sr-only" />
					<p>{item.value}</p>
				</Label>
			))}
		</RadioGroup>
	);
}

export { ColorInput, SizeInput };

import { cn } from "@ecom/shared/lib/utils";
import { Minus, Plus } from "lucide-react";
import { type ChangeEvent, useState, useEffect } from "react";

interface QuantityInputBasicProps {
	quantity: number;
	min?: number;
	minLength?: number;
	maxLength?: number | null;
	max?: number | null;
	step?: number;
	disabled?: boolean;
	onChange: (quantity: number) => void;
	className?: string;
}

const QuantityInput = ({
	className,
	disabled = false,
	max = null,
	min = 1,
	onChange,
	quantity,
	minLength = 1,
	maxLength = null,
	step = 1,
}: QuantityInputBasicProps) => {
	// Internal state to handle input field text during editing
	const [inputValue, setInputValue] = useState(quantity.toString());

	// Update internal input value when external quantity prop changes
	useEffect(() => {
		setInputValue(quantity.toString());
	}, [quantity]);

	const handleDecrease = () => {
		if (quantity - step >= min) {
			onChange(quantity - step);
		}
	};

	const handleIncrease = () => {
		if (max === null || quantity + step <= max) {
			onChange(quantity + step);
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		// Allow any input including empty string during editing
		setInputValue(e.target.value);

		// If the input is a valid number, update the parent component
		const value = parseInt(e.target.value);
		if (!isNaN(value) && value >= min && (max === null || value <= max)) {
			onChange(value);
		}
	};

	const handleBlur = () => {
		// When the field loses focus, ensure we have a valid value
		const value = parseInt(inputValue);
		if (isNaN(value) || value < min) {
			// If invalid or below min, reset to min
			setInputValue(min.toString());
			onChange(min);
		} else if (max !== null && value > max) {
			// If above max and max is defined, reset to max
			setInputValue(max.toString());
			onChange(max);
		} else {
			// Ensure the displayed value matches the actual value
			setInputValue(value.toString());
			onChange(value);
		}
	};

	return (
		<div
			className={cn("inline-flex w-fit cursor-pointer rounded-lg shadow-xs shadow-black/5", className)}
		>
			<button
				type="button"
				className={cn(
					"hover:bg-muted-foreground/10 flex cursor-pointer items-center justify-center rounded-s-lg border px-3 py-1 focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-50",
					disabled && "pointer-events-none",
				)}
				onClick={handleDecrease}
				disabled={disabled || quantity <= min}
				aria-label="Decrease quantity"
			>
				<Minus size={16} strokeWidth={2} aria-hidden="true" />
			</button>
			<input
				type="number"
				value={inputValue}
				onChange={handleInputChange}
				onBlur={handleBlur}
				className="w-12 border-y px-2 py-1 text-center font-mono outline-none"
				min={min}
				max={max !== null ? max : undefined}
				disabled={disabled}
				aria-label="Quantity"
				minLength={minLength}
				maxLength={maxLength != null ? maxLength : undefined}
			/>
			<button
				type="button"
				className={cn(
					"hover:bg-muted-foreground/10 flex cursor-pointer items-center justify-center rounded-e-lg border px-3 py-1 focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-50",
					disabled && "pointer-events-none",
				)}
				onClick={handleIncrease}
				disabled={disabled || (max !== null && quantity >= max)}
				aria-label="Increase quantity"
			>
				<Plus size={16} strokeWidth={2} aria-hidden="true" />
			</button>
		</div>
	);
};

export default QuantityInput;

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/Custom-Inputs/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { useState } from "react";

type DateTimePickerProps = {
	className?: string;
	value?: Date | null;
	onDateTimeChange?: (date: Date | undefined) => void;
	displayValueClassName?: string;
	disabled?: boolean;
};

type TimeChangeFuncArgs = {
	type: "hour" | "minute" | "ampm";
	value: string;
};

export default function DateTimePicker({
	className,
	displayValueClassName,
	value: controlledValue,
	onDateTimeChange: controlledOnChange,
	disabled,
	...rest
}: DateTimePickerProps) {
	const isControlled = controlledOnChange != null;
	const [internalState, setInternalState] = useState<Date | undefined>(new Date());

	const dateTime = isControlled ? controlledValue ?? undefined : internalState;

	function handleSelect(selectedDate: Date | undefined) {
		if (!selectedDate) {
			if (isControlled) {
				controlledOnChange(undefined);
			} else {
				setInternalState(undefined);
			}
			return;
		}

		// Preserve existing time if available, else set to current time
		const newDate = new Date(selectedDate);
		if (dateTime) {
			newDate.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0);
		} else {
			const now = new Date();
			newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
		}

		if (isControlled) {
			controlledOnChange(newDate);
		} else {
			setInternalState(newDate);
		}
	}

	function handleTimeChange({ type, value }: TimeChangeFuncArgs) {
		const currentDate = dateTime || new Date(); // Use current date if no dateTime
		const newDate = new Date(currentDate);

		if (type === "hour") {
			const hour = parseInt(value, 10);
			// Handle 12-hour format with AM/PM
			const isPM = newDate.getHours() >= 12;
			newDate.setHours(isPM ? hour + (hour === 12 ? 0 : 12) : hour === 12 ? 0 : hour);
		} else if (type === "minute") {
			newDate.setMinutes(parseInt(value, 10));
		} else if (type === "ampm") {
			const hours = newDate.getHours();
			if (value === "AM" && hours >= 12) {
				newDate.setHours(hours - 12);
			} else if (value === "PM" && hours < 12) {
				newDate.setHours(hours + 12);
			}
		}

		if (isControlled) {
			controlledOnChange(newDate);
		} else {
			setInternalState(newDate);
		}
	}

	return (
		<div {...rest} className={cn("w-full", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant={"outline"}
						className={cn(
							"w-full justify-start text-left font-normal",
							!dateTime && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{dateTime ? (
							<span className={cn("", displayValueClassName)}>
								{format(dateTime, "PPP hh:mm a")}
							</span>
						) : (
							<span>Select date and time</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full max-w-[min(100vw, 500px)] p-0" align="end">
					<div className="sm:flex">
						<Calendar
							mode="single"
							selected={dateTime}
							onSelect={handleSelect}
							className="w-full md:w-auto"
							autoFocus
						/>
						<div className="flex flex-col sm:flex-row sm:h-[335px] divide-y sm:divide-y-0 sm:divide-x h-full">
							<span className="divide-x-0 sm:divide-x" />
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex sm:flex-col p-2">
									{Array.from({ length: 12 }, (_, i) => i + 1)
										.reverse()
										.map((hour) => (
											<Button
												key={hour}
												size="icon"
												variant={
													dateTime && dateTime.getHours() % 12 === hour % 12
														? "default"
														: "ghost"
												}
												className="sm:w-full shrink-0 aspect-square"
												onClick={() =>
													handleTimeChange({ type: "hour", value: hour.toString() })
												}
											>
												{hour}
											</Button>
										))}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex sm:flex-col p-2">
									{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
										<Button
											key={minute}
											size="icon"
											variant={
												dateTime && dateTime.getMinutes() === minute
													? "default"
													: "ghost"
											}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() =>
												handleTimeChange({ type: "minute", value: minute.toString() })
											}
										>
											{minute.toString().padStart(2, "0")}
										</Button>
									))}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>
							<ScrollArea className="">
								<div className="flex sm:flex-col p-2">
									{["AM", "PM"].map((ampm) => (
										<Button
											key={ampm}
											size="icon"
											variant={
												dateTime &&
												((ampm === "AM" && dateTime.getHours() < 12) ||
													(ampm === "PM" && dateTime.getHours() >= 12))
													? "default"
													: "ghost"
											}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() => handleTimeChange({ type: "ampm", value: ampm })}
										>
											{ampm}
										</Button>
									))}
								</div>
							</ScrollArea>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

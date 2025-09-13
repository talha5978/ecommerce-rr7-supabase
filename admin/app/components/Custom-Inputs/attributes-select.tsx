import { useFormContext, Controller } from "react-hook-form";
import { FormControl, FormItem } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { AttributeType, ProductAttribute } from "@ecom/shared/types/attributes";
import { Button } from "~/components/ui/button";

interface AttributeSelectProps {
	name: string;
	attributeKey: AttributeType;
	options: ProductAttribute[];
	disabled?: boolean;
}

export default function AttributeSelect({ name, attributeKey, options, disabled }: AttributeSelectProps) {
	const { control } = useFormContext();

	return (
		<FormItem className="flex gap-2">
			<FormControl>
				<Controller
					control={control}
					name={name}
					render={({ field, fieldState }) => (
						<div className="flex flex-col gap-2 *:w-full w-full">
							<div className="flex items-start gap-2">
								<div className="w-fit">
									<Button
										variant="outline"
										className={`capitalize pointer-events-none ${
											fieldState.error ? "text-destructive" : ""
										}`}
										tabIndex={-1}
									>
										{attributeKey}
									</Button>
								</div>
								<div className="flex-1">
									<Select
										onValueChange={(value) => {
											if (value === "null") {
												return field.onChange("");
											}
											return field.onChange(value);
										}}
										value={field.value || ""}
										disabled={disabled}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={`Select ${attributeKey}`} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="null" className="w-full text-muted-foreground">
												Select {attributeKey}
											</SelectItem>
											{options.map((option) => (
												<SelectItem
													key={option.id}
													value={option.id}
													className="w-full"
												>
													{option.name} - {option.value}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							{fieldState.error && (
								<p className="text-destructive text-sm">{fieldState.error.message}</p>
							)}
						</div>
					)}
				/>
			</FormControl>
		</FormItem>
	);
}

import { type ChangeEvent, memo, useCallback, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Import } from "lucide-react";

type AcceptedFileTypes = ".csv" | ".txt";

type ImportEmailsButtonProps = {
	onImport: (emails: string[]) => void;
	accept?: AcceptedFileTypes[]; // e.g. ".csv,.txt"
	buttonLabel?: string;
	disabled?: boolean;
	buttonVariant?: "outline" | "default" | "secondary";
	buttonSize?: "sm" | "default" | "lg";
};

export const ImportEmailsButton = memo(({
	onImport,
	accept = [".csv", ".txt"],
	buttonLabel = "Import",
	disabled = false,
	buttonVariant = "outline",
	buttonSize = "sm",
}: ImportEmailsButtonProps) => {
	const fileRef = useRef<HTMLInputElement>(null);

	function handleClick() {
		fileRef.current?.click();
	}

	function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const text = String(reader.result);
			const emails = parseEmails(text);
			onImport(emails);
			e.target.value = ""; // reset so you can re-import same file
		};
		reader.readAsText(file);
	}

	const getAccptedFormats = useCallback(() => {
		return accept.join(",");
	}, [accept]);

	return (
		<>
			<Button
				type="button"
				onClick={handleClick}
				disabled={disabled}
				className="inline-flex items-center gap-2"
				size={buttonSize}
				variant={buttonVariant}
			>
				<Import className="w-4 h-4" />
				<span>{buttonLabel}</span>
			</Button>
			<input
				ref={fileRef}
				type="file"
				accept={getAccptedFormats()}
				className="hidden"
				onChange={handleFileChange}
			/>
		</>
	);
});

// Simple email extractor; you can swap in PapaParse if you need full CSV support
function parseEmails(input: string): string[] {
	return Array.from(
		new Set(
			input
				.split(/[\s,;]+/)
				.map((s) => s.trim())
				.filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)),
		),
	);
}

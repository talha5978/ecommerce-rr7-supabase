import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function TableCopyField({ id, message = "ID Copied" }: { id: string; message?: string }) {
	return (
		<div>
			<div
				className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
				onClick={() => {
					navigator.clipboard.writeText(id);
					toast.success(message.trim(), {
						description: id,
					});
				}}
			>
				<Copy strokeWidth={1.65} width={13} className="self-center" />
				<span>{id}</span>
			</div>
		</div>
	);
}

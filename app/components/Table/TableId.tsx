import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function TableId({ id }: { id: string }) {
    return (
        <div>
            <div
                className="flex gap-2 w-fit bg-table-row-muted-button dark:bg-muted rounded-sm px-3 py-1 cursor-pointer"
                onClick={() => {
                    navigator.clipboard.writeText(id);
                    toast.success("Sub category id copied", {
                        description: id,
                    });
                }}
            >
                <Copy strokeWidth={1.65} width={13} className="self-center" />
                <span>{id}</span>
            </div>
        </div>
    )
}
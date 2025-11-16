import type { HighLevelOrder } from "@ecom/shared/types/orders";
import StatusBadge from "~/components/status-badge";

export default function OrderStatusBadge({ status }: { status: HighLevelOrder["status"] }) {
	function getVariant(status: HighLevelOrder["status"]): [any, any] {
		if (status === "pending") {
			return ["warning", "dot"];
		} else if (status === "failed") {
			return ["destructive", "cross"];
		} else if (status === "paid") {
			return ["success", "dot"];
		} else if (status === "shipped") {
			return ["success", "tick"];
		} else if (status === "cancelled") {
			return ["default", "cross"];
		} else {
			throw new Error("Invalid order status");
		}
	}

	return (
		<StatusBadge variant={getVariant(status)[0]} icon={getVariant(status)[1]}>
			{status.charAt(0).toUpperCase() + String(status).slice(1)}
		</StatusBadge>
	);
}

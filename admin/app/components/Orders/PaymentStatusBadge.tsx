import { HighLevelOrder } from "@ecom/shared/types/orders";
import StatusBadge from "../status-badge";

export default function PaymentStatusBadge({ payment }: { payment: HighLevelOrder["payment"] }) {
	function getVariant(status: HighLevelOrder["payment"]["status"]): [any, any] {
		if (status === "pending") {
			return ["warning", "dot"];
		} else if (status === "failed") {
			return ["destructive", "cross"];
		} else if (status === "completed") {
			return ["success", "tick"];
		} else if (status === "partially_refunded") {
			return ["default", "dot"];
		} else if (status === "refunded") {
			return ["default", "tick"];
		} else {
			throw new Error("Invalid payment status");
		}
	}

	return (
		<StatusBadge variant={getVariant(payment.status)[0]} icon={getVariant(payment.status)[1]}>
			{payment.status.charAt(0).toUpperCase() + String(payment.status).slice(1)}
		</StatusBadge>
	);
}

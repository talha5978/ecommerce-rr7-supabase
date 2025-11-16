import { type ActionFunctionArgs } from "react-router";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { InvoiceService } from "@ecom/shared/services/invoice.service";
import type { Invoice } from "@ecom/shared/schemas/invoice.schema";
import { PAYMENT_CURRENCY } from "@ecom/shared/constants/constants";
import type { OrderDetails } from "@ecom/shared/types/orders";
import wordConverter from "number-to-words";

export const action = async ({ request }: ActionFunctionArgs) => {
	const data = await request.formData();
	const order = JSON.parse(data.get("order") as string) as OrderDetails;

	if (order == null) {
		throw new ApiError("Order not found", 404, []);
	}

	let payload: Invoice = {
		details: {
			currency: PAYMENT_CURRENCY.toUpperCase(),
			invoiceDate: new Date().toString(),
			invoiceNumber: order.id,
			items: order.order_items.map((item) => ({
				name: item.product_variant.product_name,
				description: item.sku,
				quantity: item.quantity,
				unitPrice: item.price,
				total: item.price * item.quantity,
			})),
			totalAmount: order.total,
			subTotal: order.sub_total,
			tax: order.tax_amount,
			discount: order.discount,
			shipping: order.shipping,
			totalAmountInWords: wordConverter.toWords(order.total),
			additionalNotes: "Items can be exchanged and refunded within 7 days with original packaging.",
		},
		receiver: {
			name: order.shipping_address.first_name + " " + order.shipping_address.last_name,
			address: order.shipping_address.address_name ?? "",
			city: order.shipping_address.city,
			email: order.shipping_address.email,
			phone: order.shipping_address.phone,
		},
		sender: {
			name: "ABC Store",
			address: "ABC Street, Xyz City",
			city: "Lahore",
			email: "hello@ecomstore.com",
			phone: "03146017667",
		},
	};

	const invoiceService = new InvoiceService();
	const resp = await invoiceService.generatePdf(payload);

	if (!resp.ok && resp instanceof ApiError) {
		throw resp;
	}

	return resp;
};

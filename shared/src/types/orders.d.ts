import type { Database } from "@ecom/shared/types/supabase";
import { type ApiError } from "@ecom/shared/utils/ApiError";

// Front Panel
interface CartSummary {
	subtotal: string;
	shipping: string;
	tax: string;
	discount: string;
	total: string;
	discountBreakdown: Record<string, string>;
	taxBreakdown: Record<string, string>;
}

export type InsertOrderItemsPayload = Database["public"]["Tables"]["order_items"]["Insert"][];

// The form schema type is copied here
export type PlaceOrderServicePayload = {
	shipping_address: {
		first_name: string;
		last_name: string;
		email: string;
		phone: string;
		city: string;
		address: {
			formattedAddress: string;
			lat: number;
			lng: number;
		};
		province?: string | undefined;
		postal_code?: string | undefined;
	};
	isBillingSameAsShipping: string;
	billing_address?:
		| {
				first_name: string;
				last_name: string;
				email: string;
				phone: string;
				city: string;
				address: {
					formattedAddress: string;
					lat: number;
					lng: number;
				};
				province?: string | undefined;
				postal_code?: string | undefined;
		  }
		| undefined;
	order_note?: string | undefined;
	cart_summary: CartSummary;
	cart_items: Omit<Database["public"]["Tables"]["order_items"]["Insert"], "order_id">[];
	payment_method: "cod" | "online";
};

// Admin Panel

export type OrderRaw = Database["public"]["Tables"]["orders"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_methods"];

export type HighLevelOrder = {
	id: string;
	created_at: string;
	status: OrderStatus;
	total: number;
	payment: {
		method: PaymentMethod;
		status: PaymentStatus;
	};
	user: {
		user_id: string;
		email: string;
		name: string;
		avatar: string;
	};
};

export type GetHighLevelOrders = {
	orders: HighLevelOrder[];
	total: number;
	error: ApiError | null;
};

type OrderAddress = {
	address_name: string | null;
	address_type: Database["public"]["Enums"]["address_type_enum"];
	city: string;
	createdAt: string | null;
	email: string;
	first_name: string;
	id: string;
	last_name: string;
	latitude: number | null;
	longitude: number | null;
	phone: string;
	province: string | null;
	user_id: string;
};

export type OrderDetails = {
	created_at: string;
	discount: number;
	id: string;
	order_note: string | null;
	shipping: number;
	status: OrderStatus;
	sub_total: number;
	tax_amount: number;
	total: number;
	user: {
		user_id: string;
		first_name: string;
		last_name: string;
		avatar: string;
		email: string;
		phone_number: string | null;
		role: {
			role_id: number;
			role_name: string;
		};
	};
	billing_address: OrderAddress | null;
	shipping_address: OrderAddress;
	order_items: {
		color: string;
		created_at: string;
		id: string;
		price: number;
		quantity: number;
		size: string;
		sku: string;
		product_variant: {
			id: string;
			images: string[];
			product_id: string;
			product_name: string;
		};
	}[];
	payment: {
		amount: number;
		created_at: string;
		currency: string;
		id: string;
		method: PaymentMethod;
		payment_intent_id: string | null;
		refund_proofs: string[] | null;
		refunded_amount: number | null;
		status: PaymentStatus;
	};
};

export type GetOrderDetails = {
	order: OrderDetails | null;
	error: ApiError | null;
};

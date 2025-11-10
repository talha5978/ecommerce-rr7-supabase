import type { Database } from "@ecom/shared/types/supabase";

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

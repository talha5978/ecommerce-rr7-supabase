export interface CartItem {
	id: string;
	variant_id: string;
	product_id: string;
	product_name: string;
	sku: string;
	size: string;
	color: string;
	image_url: string;
	quantity: number;
	stock: number;
	category_id: string;
	apply_shipping: boolean;
	original_price: number;
	applied_coupon_code?: string;
}

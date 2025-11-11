export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "12.2.3 (519615d)";
	};
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			addresses: {
				Row: {
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
				Insert: {
					address_name?: string | null;
					address_type: Database["public"]["Enums"]["address_type_enum"];
					city: string;
					createdAt?: string | null;
					email: string;
					first_name: string;
					id?: string;
					last_name: string;
					latitude?: number | null;
					longitude?: number | null;
					phone: string;
					province?: string | null;
					user_id: string;
				};
				Update: {
					address_name?: string | null;
					address_type?: Database["public"]["Enums"]["address_type_enum"];
					city?: string;
					createdAt?: string | null;
					email?: string;
					first_name?: string;
					id?: string;
					last_name?: string;
					latitude?: number | null;
					longitude?: number | null;
					phone?: string;
					province?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "addresses_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_users";
						referencedColumns: ["user_id"];
					},
					{
						foreignKeyName: "addresses_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
				];
			};
			app_users: {
				Row: {
					createdAt: string | null;
					first_name: string;
					last_name: string;
					phone_number: string | null;
					role: number;
					status: boolean;
					user_id: string;
				};
				Insert: {
					createdAt?: string | null;
					first_name: string;
					last_name: string;
					phone_number?: string | null;
					role: number;
					status?: boolean;
					user_id: string;
				};
				Update: {
					createdAt?: string | null;
					first_name?: string;
					last_name?: string;
					phone_number?: string | null;
					role?: number;
					status?: boolean;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "users_role_fkey";
						columns: ["role"];
						isOneToOne: false;
						referencedRelation: "user_roles";
						referencedColumns: ["id"];
					},
				];
			};
			attributes: {
				Row: {
					attribute_type: Database["public"]["Enums"]["attribute_type_enum"];
					id: string;
					name: string;
					value: string;
				};
				Insert: {
					attribute_type: Database["public"]["Enums"]["attribute_type_enum"];
					id?: string;
					name: string;
					value: string;
				};
				Update: {
					attribute_type?: Database["public"]["Enums"]["attribute_type_enum"];
					id?: string;
					name?: string;
					value?: string;
				};
				Relationships: [];
			};
			category: {
				Row: {
					category_name: string;
					createdAt: string;
					description: string;
					id: string;
					meta_details: string;
					sort_order: number;
				};
				Insert: {
					category_name: string;
					createdAt?: string;
					description: string;
					id?: string;
					meta_details: string;
					sort_order?: number;
				};
				Update: {
					category_name?: string;
					createdAt?: string;
					description?: string;
					id?: string;
					meta_details?: string;
					sort_order?: number;
				};
				Relationships: [
					{
						foreignKeyName: "category_meta_details_fkey";
						columns: ["meta_details"];
						isOneToOne: true;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
				];
			};
			collection_products: {
				Row: {
					collection_id: string;
					product_id: string;
				};
				Insert: {
					collection_id: string;
					product_id: string;
				};
				Update: {
					collection_id?: string;
					product_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "collection_products_collection_id_fkey";
						columns: ["collection_id"];
						isOneToOne: false;
						referencedRelation: "collections";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "collection_products_product_id_fkey";
						columns: ["product_id"];
						isOneToOne: false;
						referencedRelation: "product";
						referencedColumns: ["id"];
					},
				];
			};
			collections: {
				Row: {
					createdAt: string;
					description: string;
					id: string;
					image_url: string;
					meta_details: string;
					name: string;
					sort_order: number;
					status: boolean;
				};
				Insert: {
					createdAt?: string;
					description: string;
					id?: string;
					image_url: string;
					meta_details: string;
					name: string;
					sort_order?: number;
					status?: boolean;
				};
				Update: {
					createdAt?: string;
					description?: string;
					id?: string;
					image_url?: string;
					meta_details?: string;
					name?: string;
					sort_order?: number;
					status?: boolean;
				};
				Relationships: [
					{
						foreignKeyName: "collections_meta_details_fkey";
						columns: ["meta_details"];
						isOneToOne: false;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
				];
			};
			coupons: {
				Row: {
					code: string;
					coupon_id: number;
					coupon_type: Database["public"]["Enums"]["coupon_type_enum"];
					created_at: string | null;
					description: string | null;
					discount_type: Database["public"]["Enums"]["discount_type"];
					discount_value: number | null;
					end_timestamp: string;
					max_total_uses: number | null;
					one_use_per_customer: boolean | null;
					start_timestamp: string;
					status: boolean;
				};
				Insert: {
					code: string;
					coupon_id?: number;
					coupon_type?: Database["public"]["Enums"]["coupon_type_enum"];
					created_at?: string | null;
					description?: string | null;
					discount_type: Database["public"]["Enums"]["discount_type"];
					discount_value?: number | null;
					end_timestamp: string;
					max_total_uses?: number | null;
					one_use_per_customer?: boolean | null;
					start_timestamp: string;
					status?: boolean;
				};
				Update: {
					code?: string;
					coupon_id?: number;
					coupon_type?: Database["public"]["Enums"]["coupon_type_enum"];
					created_at?: string | null;
					description?: string | null;
					discount_type?: Database["public"]["Enums"]["discount_type"];
					discount_value?: number | null;
					end_timestamp?: string;
					max_total_uses?: number | null;
					one_use_per_customer?: boolean | null;
					start_timestamp?: string;
					status?: boolean;
				};
				Relationships: [];
			};
			customer_conditions: {
				Row: {
					coupon_id: number;
					customer_condition_id: number;
					customer_type: Database["public"]["Enums"]["customer_type"] | null;
					min_purchased_amount: number | null;
				};
				Insert: {
					coupon_id: number;
					customer_condition_id?: number;
					customer_type?: Database["public"]["Enums"]["customer_type"] | null;
					min_purchased_amount?: number | null;
				};
				Update: {
					coupon_id?: number;
					customer_condition_id?: number;
					customer_type?: Database["public"]["Enums"]["customer_type"] | null;
					min_purchased_amount?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "customer_conditions_coupon_id_fkey";
						columns: ["coupon_id"];
						isOneToOne: false;
						referencedRelation: "coupons";
						referencedColumns: ["coupon_id"];
					},
				];
			};
			customer_emails: {
				Row: {
					customer_condition_id: number;
					email: string;
					email_id: number;
				};
				Insert: {
					customer_condition_id: number;
					email: string;
					email_id?: number;
				};
				Update: {
					customer_condition_id?: number;
					email?: string;
					email_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "customer_emails_customer_condition_id_fkey";
						columns: ["customer_condition_id"];
						isOneToOne: false;
						referencedRelation: "customer_conditions";
						referencedColumns: ["customer_condition_id"];
					},
				];
			};
			hero_sections: {
				Row: {
					created_at: string;
					description: string;
					id: number;
					image: string;
					sort_order: number;
					status: boolean;
					url: string;
				};
				Insert: {
					created_at?: string;
					description: string;
					id?: number;
					image: string;
					sort_order?: number;
					status?: boolean;
					url: string;
				};
				Update: {
					created_at?: string;
					description?: string;
					id?: number;
					image?: string;
					sort_order?: number;
					status?: boolean;
					url?: string;
				};
				Relationships: [];
			};
			meta_details: {
				Row: {
					createdAt: string;
					id: string;
					meta_description: string;
					meta_keywords: string | null;
					meta_title: string;
					url_key: string;
				};
				Insert: {
					createdAt?: string;
					id?: string;
					meta_description: string;
					meta_keywords?: string | null;
					meta_title: string;
					url_key: string;
				};
				Update: {
					createdAt?: string;
					id?: string;
					meta_description?: string;
					meta_keywords?: string | null;
					meta_title?: string;
					url_key?: string;
				};
				Relationships: [];
			};
			order_items: {
				Row: {
					color: string;
					created_at: string;
					id: string;
					order_id: string;
					price: number;
					quantity: number;
					size: string;
					sku: string;
					variant_id: string;
				};
				Insert: {
					color: string;
					created_at?: string;
					id?: string;
					order_id: string;
					price: number;
					quantity: number;
					size: string;
					sku: string;
					variant_id: string;
				};
				Update: {
					color?: string;
					created_at?: string;
					id?: string;
					order_id?: string;
					price?: number;
					quantity?: number;
					size?: string;
					sku?: string;
					variant_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "order_items_order_id_fkey";
						columns: ["order_id"];
						isOneToOne: false;
						referencedRelation: "orders";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "order_items_variant_id_fkey";
						columns: ["variant_id"];
						isOneToOne: false;
						referencedRelation: "product_variant";
						referencedColumns: ["id"];
					},
				];
			};
			orders: {
				Row: {
					billing_address_id: string | null;
					created_at: string;
					discount: number;
					id: string;
					order_note: string | null;
					shipping: number;
					shipping_address_id: string;
					status: Database["public"]["Enums"]["order_status"];
					sub_total: number;
					tax_amount: number;
					total: number;
					user_id: string;
				};
				Insert: {
					billing_address_id?: string | null;
					created_at?: string;
					discount: number;
					id?: string;
					order_note?: string | null;
					shipping: number;
					shipping_address_id: string;
					status: Database["public"]["Enums"]["order_status"];
					sub_total: number;
					tax_amount: number;
					total: number;
					user_id: string;
				};
				Update: {
					billing_address_id?: string | null;
					created_at?: string;
					discount?: number;
					id?: string;
					order_note?: string | null;
					shipping?: number;
					shipping_address_id?: string;
					status?: Database["public"]["Enums"]["order_status"];
					sub_total?: number;
					tax_amount?: number;
					total?: number;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "orders_billing_address_id_fkey";
						columns: ["billing_address_id"];
						isOneToOne: false;
						referencedRelation: "addresses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "orders_shipping_address_id_fkey";
						columns: ["shipping_address_id"];
						isOneToOne: false;
						referencedRelation: "addresses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "orders_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_users";
						referencedColumns: ["user_id"];
					},
					{
						foreignKeyName: "orders_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "app_users";
						referencedColumns: ["user_id"];
					},
				];
			};
			payments: {
				Row: {
					amount: number;
					created_at: string;
					currency: string;
					id: string;
					method: Database["public"]["Enums"]["payment_methods"];
					order_id: string;
					payment_intent_id: string | null;
					refund_proofs: string[] | null;
					refunded_amount: number | null;
					status: Database["public"]["Enums"]["payment_status"];
				};
				Insert: {
					amount: number;
					created_at?: string;
					currency: string;
					id?: string;
					method: Database["public"]["Enums"]["payment_methods"];
					order_id: string;
					payment_intent_id?: string | null;
					refund_proofs?: string[] | null;
					refunded_amount?: number | null;
					status: Database["public"]["Enums"]["payment_status"];
				};
				Update: {
					amount?: number;
					created_at?: string;
					currency?: string;
					id?: string;
					method?: Database["public"]["Enums"]["payment_methods"];
					order_id?: string;
					payment_intent_id?: string | null;
					refund_proofs?: string[] | null;
					refunded_amount?: number | null;
					status?: Database["public"]["Enums"]["payment_status"];
				};
				Relationships: [
					{
						foreignKeyName: "payments_order_id_fkey";
						columns: ["order_id"];
						isOneToOne: false;
						referencedRelation: "orders";
						referencedColumns: ["id"];
					},
				];
			};
			product: {
				Row: {
					cover_image: string;
					createdAt: string;
					description: string;
					free_shipping: boolean;
					id: string;
					is_featured: boolean;
					meta_details: string | null;
					name: string;
					status: boolean;
					sub_category: string;
				};
				Insert: {
					cover_image: string;
					createdAt?: string;
					description: string;
					free_shipping?: boolean;
					id?: string;
					is_featured?: boolean;
					meta_details?: string | null;
					name: string;
					status?: boolean;
					sub_category: string;
				};
				Update: {
					cover_image?: string;
					createdAt?: string;
					description?: string;
					free_shipping?: boolean;
					id?: string;
					is_featured?: boolean;
					meta_details?: string | null;
					name?: string;
					status?: boolean;
					sub_category?: string;
				};
				Relationships: [
					{
						foreignKeyName: "product_meta_details_fkey";
						columns: ["meta_details"];
						isOneToOne: false;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "product_sub_category_fkey";
						columns: ["sub_category"];
						isOneToOne: false;
						referencedRelation: "sub_category";
						referencedColumns: ["id"];
					},
				];
			};
			product_attributes: {
				Row: {
					attribute_id: string;
					created_at: string;
					id: number;
					product_id: string;
				};
				Insert: {
					attribute_id: string;
					created_at?: string;
					id?: number;
					product_id: string;
				};
				Update: {
					attribute_id?: string;
					created_at?: string;
					id?: number;
					product_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "product_attributes_attribute_id_fkey";
						columns: ["attribute_id"];
						isOneToOne: false;
						referencedRelation: "attributes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "product_attributes_product_id_fkey";
						columns: ["product_id"];
						isOneToOne: false;
						referencedRelation: "product";
						referencedColumns: ["id"];
					},
				];
			};
			product_variant: {
				Row: {
					createdAt: string | null;
					id: string;
					images: string[];
					is_default: boolean;
					original_price: number;
					product_id: string;
					reorder_level: number;
					sale_price: number;
					sku: string;
					status: boolean;
					stock: number;
					weight: number | null;
				};
				Insert: {
					createdAt?: string | null;
					id?: string;
					images?: string[];
					is_default?: boolean;
					original_price?: number;
					product_id: string;
					reorder_level?: number;
					sale_price?: number;
					sku: string;
					status?: boolean;
					stock?: number;
					weight?: number | null;
				};
				Update: {
					createdAt?: string | null;
					id?: string;
					images?: string[];
					is_default?: boolean;
					original_price?: number;
					product_id?: string;
					reorder_level?: number;
					sale_price?: number;
					sku?: string;
					status?: boolean;
					stock?: number;
					weight?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "product_variant_product_id_fkey";
						columns: ["product_id"];
						isOneToOne: false;
						referencedRelation: "product";
						referencedColumns: ["id"];
					},
				];
			};
			specific_coupon_products: {
				Row: {
					coupon_id: number;
					created_at: string;
					id: number;
					variant_id: string;
				};
				Insert: {
					coupon_id: number;
					created_at?: string;
					id?: number;
					variant_id: string;
				};
				Update: {
					coupon_id?: number;
					created_at?: string;
					id?: number;
					variant_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "specific_coupon_products_coupon_id_fkey";
						columns: ["coupon_id"];
						isOneToOne: false;
						referencedRelation: "coupons";
						referencedColumns: ["coupon_id"];
					},
					{
						foreignKeyName: "specific_coupon_products_variant_id_fkey";
						columns: ["variant_id"];
						isOneToOne: false;
						referencedRelation: "product_variant";
						referencedColumns: ["id"];
					},
				];
			};
			store_settings: {
				Row: {
					created_at: string;
					email_1: string;
					email_2: string;
					id: string;
					phone_1: string;
					phone_2: string;
					shipping_rate: number;
					store_address: Json;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					email_1?: string;
					email_2?: string;
					id?: string;
					phone_1?: string;
					phone_2?: string;
					shipping_rate?: number;
					store_address?: Json;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					email_1?: string;
					email_2?: string;
					id?: string;
					phone_1?: string;
					phone_2?: string;
					shipping_rate?: number;
					store_address?: Json;
					updated_at?: string;
				};
				Relationships: [];
			};
			sub_category: {
				Row: {
					createdAt: string;
					description: string;
					id: string;
					meta_details: string;
					parent_id: string;
					sort_order: number;
					sub_category_name: string;
				};
				Insert: {
					createdAt?: string;
					description: string;
					id?: string;
					meta_details: string;
					parent_id: string;
					sort_order?: number;
					sub_category_name: string;
				};
				Update: {
					createdAt?: string;
					description?: string;
					id?: string;
					meta_details?: string;
					parent_id?: string;
					sort_order?: number;
					sub_category_name?: string;
				};
				Relationships: [
					{
						foreignKeyName: "sub_category_meta_details_fkey";
						columns: ["meta_details"];
						isOneToOne: true;
						referencedRelation: "meta_details";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "sub_category_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "category";
						referencedColumns: ["id"];
					},
				];
			};
			tax_applications_categories: {
				Row: {
					category_id: string;
					id: number;
					tax_rate_id: number;
				};
				Insert: {
					category_id: string;
					id?: number;
					tax_rate_id: number;
				};
				Update: {
					category_id?: string;
					id?: number;
					tax_rate_id?: number;
				};
				Relationships: [
					{
						foreignKeyName: "tax_applications_categories_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "category";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tax_applications_categories_tax_rate_id_fkey";
						columns: ["tax_rate_id"];
						isOneToOne: false;
						referencedRelation: "tax_rates";
						referencedColumns: ["id"];
					},
				];
			};
			tax_rates: {
				Row: {
					created_at: string;
					id: number;
					name: string;
					rate: number;
					status: boolean;
					type: number;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
					rate: number;
					status: boolean;
					type: number;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
					rate?: number;
					status?: boolean;
					type?: number;
				};
				Relationships: [
					{
						foreignKeyName: "tax_rates_type_fkey";
						columns: ["type"];
						isOneToOne: false;
						referencedRelation: "tax_types";
						referencedColumns: ["id"];
					},
				];
			};
			tax_types: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			user_roles: {
				Row: {
					createdAt: string;
					id: number;
					role_name: string;
				};
				Insert: {
					createdAt?: string;
					id?: number;
					role_name: string;
				};
				Update: {
					createdAt?: string;
					id?: number;
					role_name?: string;
				};
				Relationships: [];
			};
			variant_attributes: {
				Row: {
					attribute_id: string;
					created_at: string;
					id: string;
					variant_id: string;
				};
				Insert: {
					attribute_id: string;
					created_at?: string;
					id?: string;
					variant_id: string;
				};
				Update: {
					attribute_id?: string;
					created_at?: string;
					id?: string;
					variant_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "variant_attributes_attribute_id_fkey";
						columns: ["attribute_id"];
						isOneToOne: false;
						referencedRelation: "attributes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "variant_attributes_variant_id_fkey";
						columns: ["variant_id"];
						isOneToOne: false;
						referencedRelation: "product_variant";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			admin_users: {
				Row: {
					user_id: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			create_collection: {
				Args: {
					p_description: string;
					p_image_url: string;
					p_meta_description: string;
					p_meta_keywords: string;
					p_meta_title: string;
					p_name: string;
					p_product_ids: string[];
					p_sort_order: number;
					p_status: boolean;
					p_url_key: string;
				};
				Returns: string;
			};
			get_high_level_collections: {
				Args: {
					p_page?: number;
					p_page_size?: number;
					p_search_term?: string;
					p_sort_by?: string;
					p_sort_direction?: string;
				};
				Returns: {
					created_at: string;
					id: string;
					image_url: string;
					name: string;
					products_count: number;
					status: boolean;
					total_count: number;
					url_key: string;
				}[];
			};
			get_product_attribute_types: {
				Args: never;
				Returns: {
					attribute_type: Database["public"]["Enums"]["attribute_type_enum"];
					values_count: number;
				}[];
			};
			get_product_full_details: {
				Args: { p_product_id: string };
				Returns: Json;
			};
			update_collection: {
				Args: {
					p_added_product_ids: string[];
					p_collection_id: string;
					p_description: string;
					p_image_url: string;
					p_meta_description: string;
					p_meta_details_id: string;
					p_meta_keywords: string;
					p_meta_title: string;
					p_name: string;
					p_removed_product_ids: string[];
					p_sort_order: number;
					p_status: boolean;
					p_url_key: string;
				};
				Returns: undefined;
			};
		};
		Enums: {
			address_type_enum: "shipping" | "billing" | "both";
			attribute_type_enum: "color" | "size" | "material" | "style" | "brand";
			coupon_type_enum: "manual" | "automatic";
			customer_type: "admins" | "employee" | "all" | "consumer";
			discount_type: "fixed_order" | "percentage_order" | "fixed_product" | "percentage_product";
			order_status: "pending" | "paid" | "shipped" | "failed";
			payment_methods: "cod" | "online";
			payment_status: "pending" | "completed" | "failed" | "refunded" | "partially_refunded";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			address_type_enum: ["shipping", "billing", "both"],
			attribute_type_enum: ["color", "size", "material", "style", "brand"],
			coupon_type_enum: ["manual", "automatic"],
			customer_type: ["admins", "employee", "all", "consumer"],
			discount_type: ["fixed_order", "percentage_order", "fixed_product", "percentage_product"],
			order_status: ["pending", "paid", "shipped", "failed"],
			payment_methods: ["cod", "online"],
			payment_status: ["pending", "completed", "failed", "refunded", "partially_refunded"],
		},
	},
} as const;

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
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
					}
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
					}
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
					}
				];
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
					}
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
					}
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
					}
				];
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
					}
				];
			};
			users: {
				Row: {
					address_1: string | null;
					address_2: string | null;
					city: string | null;
					country: string | null;
					createdAt: string | null;
					first_name: string;
					is_admin: boolean;
					last_name: string;
					phone_number: string | null;
					postal_code: string | null;
					user_id: string;
				};
				Insert: {
					address_1?: string | null;
					address_2?: string | null;
					city?: string | null;
					country?: string | null;
					createdAt?: string | null;
					first_name: string;
					is_admin?: boolean;
					last_name: string;
					phone_number?: string | null;
					postal_code?: string | null;
					user_id: string;
				};
				Update: {
					address_1?: string | null;
					address_2?: string | null;
					city?: string | null;
					country?: string | null;
					createdAt?: string | null;
					first_name?: string;
					is_admin?: boolean;
					last_name?: string;
					phone_number?: string | null;
					postal_code?: string | null;
					user_id?: string;
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
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			get_product_attribute_types: {
				Args: Record<PropertyKey, never>;
				Returns: {
					attribute_type: Database["public"]["Enums"]["attribute_type_enum"];
					values_count: number;
				}[];
			};
		};
		Enums: {
			attribute_type_enum: "color" | "size" | "material" | "style" | "brand";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
	DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
	DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
	? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
	: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
	? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
	: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			attribute_type_enum: ["color", "size", "material", "style", "brand"],
		},
	},
} as const;

import { type RouteConfig, route, index, prefix } from "@react-router/dev/routes";

export default [
	...prefix("/login", [index("./routes/Auth/login.tsx"), route("otp", "./routes/Auth/otp.tsx")]),
	route("/logout", "./routes/_actions/logout.tsx"),

	route("/", "./routes/layout.tsx", [
		index("./routes/dashboard.tsx"),
		...prefix("/categories", [
			index("./routes/Category/categories.tsx"),
			route("create", "./routes/Category/create-category.tsx"),

			...prefix(":categoryId", [
				route("update", "./routes/Category/update-category.tsx"),
				...prefix("sub-categories", [
					index("./routes/SubCategory/sub-categories.tsx"),
					route("create", "./routes/SubCategory/create-sub-category.tsx"),
					route(":subCategoryId/update", "./routes/SubCategory/update-sub-category.tsx"),
				]),
			]),
		]),

		...prefix("/product-attributes", [
			route("", "./routes/ProductAttributes/product-attributes.tsx", [
				route("create", "./routes/ProductAttributes/create-product-attributes.tsx", {
					id: "create-attribute-main",
				}),
			]),

			route(":attributeType/values", "./routes/ProductAttributes/product-attributes-values.tsx", [
				route("create", "./routes/ProductAttributes/create-product-attributes.tsx", {
					id: "create-attribute-values",
				}),
				route(":attributeId/update", "./routes/ProductAttributes/update-product-attributes.tsx"),
			]),
		]),

		...prefix("/products", [
			index("./routes/Products/products.tsx"),
			route("create", "./routes/Products/create-product.tsx"),
			...prefix(":productId", [
				route("update", "./routes/Products/update-product.tsx"),
				...prefix("variants", [
					index("./routes/ProductVariants/product-variants.tsx"),
					route("create", "./routes/ProductVariants/create-product-variant.tsx"),
					route("duplicate", "./routes/_actions/create-product-variant-duplicate.tsx"),
					route(":variantId/update", "./routes/ProductVariants/update-product-variant.tsx"),
				]),
			]),
		]),

		route("/all-product-units", "./routes/Products/all-product-units.tsx"),

		...prefix("/collections", [
			index("./routes/Collections/collections.tsx"),
			route("create", "./routes/Collections/create-collection.tsx"),
			route(":collectionId/update", "./routes/Collections/update-collection.tsx"),
		]),

		...prefix("/coupons", [
			index("./routes/Coupons/coupons.tsx"),
			route("coupon/:couponId", "./routes/Coupons/coupon-details.tsx"),
			route("create/:couponType", "./routes/Coupons/create-coupon.tsx"),
		]),
	]),

	route("*", "./routes/Error/404.tsx"),
] satisfies RouteConfig;

import { type RouteConfig, route, index, prefix, layout } from "@react-router/dev/routes";

export default [
	...prefix("/login", [
		index("./routes/login.tsx"),
		route("otp", "./routes/otp.tsx"),
	]),

	route("/logout", "./routes/_actions/logout.tsx"),

	route("/", "./routes/layout.tsx", [
		index("./routes/dashboard.tsx"),
		...prefix("/categories", [
			index("./routes/categories.tsx"),
			route("create", "./routes/CategoryForms/create-category.tsx"),

			...prefix(":categoryId", [
				route("update", "./routes/CategoryForms/update-category.tsx"),
				// route("delete", "./routes/_actions/delete-category.tsx"),

				...prefix("sub-categories", [
					index("./routes/sub-categories.tsx"),
					route("create", "./routes/CategoryForms/create-sub-category.tsx"),
					route(":subCategoryId/update", "./routes/CategoryForms/update-sub-category.tsx"),
				]),
			]),
		]),

		...prefix("/product-attributes", [
			route("", "./routes/product-attributes.tsx", [
				route("create", "./routes/create-product-attributes.tsx", { id: "create-attribute-main" }),
			]),

			route(":attributeType/values", "./routes/product-attributes-values.tsx", [
				route("create", "./routes/create-product-attributes.tsx", { id: "create-attribute-values" }),
				route(":attributeId/update", "./routes/update-product-attributes.tsx"),
			]),
		]),
		
		...prefix("/products", [
			index("./routes/products.tsx"),
			route("create", "./routes/create-product.tsx"),
			...prefix(":productId", [
				route("update", "./routes/update-product.tsx"),
				// route("delete", "./routes/_actions/delete-product.tsx"),

				...prefix("variants", [
					index("./routes/product-variants.tsx"),
					route("create", "./routes/create-product-variant.tsx"),
					route("duplicate", "./routes/_actions/create-product-variant-duplicate.tsx"),
					route(":variantId/update", "./routes/update-product-variant.tsx"),
				])
			]),
		]),

		route("/all-product-units", "./routes/all-product-units.tsx"),

		...prefix("/collections", [
			index("./routes/collections.tsx"),
			route("create", "./routes/create-collection.tsx"),
			// route(":collectionId/update", "./routes/update-collection.tsx"),
			
		]),
	]),
] satisfies RouteConfig;

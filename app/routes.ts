import { type RouteConfig, route, index, prefix } from "@react-router/dev/routes";

export default [
	...prefix("/login", [
		index("./routes/login.tsx"),
		route("otp", "./routes/otp.tsx"),
	]),

	route("/logout", "./routes/_actions/logout.tsx"),

	route("/", "./routes/layout.tsx", [
		index("./routes/index-redirect.tsx"),
		route("dashboard", "./routes/dashboard.tsx"),
		...prefix("/categories", [
			index("./routes/categories.tsx"),
			route("create", "./routes/CategoryForms/create-category.tsx"),

			...prefix(":categoryId", [
				route("update", "./routes/CategoryForms/update-category.tsx"),
				// route("delete", "./routes/_actions/delete-category.tsx"),

				...prefix("sub-categories", [
					route("", "./routes/sub-categories.tsx"),
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
			route("", "./routes/products.tsx"),
			route("create", "./routes/create-product.tsx"),
			...prefix(":productId", [
				route("update", "./routes/update-product.tsx"),
				// route("delete", "./routes/_actions/delete-product.tsx"),

				...prefix("variants", [
					route("", "./routes/product-variants.tsx"),
					route("create", "./routes/create-product-variant.tsx"),
					route("duplicate", "./routes/_actions/create-product-variant-duplicate.tsx"),
					route(":variantId/update", "./routes/update-product-variant.tsx"),
				])
			]),
		]),
	]),
] satisfies RouteConfig;

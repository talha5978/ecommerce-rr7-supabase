import { type RouteConfig, layout, route, index, prefix } from "@react-router/dev/routes";

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
			route(":categoryId/update", "./routes/CategoryForms/update-category.tsx"),
			
			route(":categoryId/sub-categories", "./routes/sub-categories.tsx"),
			route(":categoryId/sub-categories/create", "./routes/CategoryForms/create-sub-category.tsx"),
			route(":categoryId/sub-categories/:subCategoryId/update", "./routes/CategoryForms/update-sub-category.tsx"),
			//TODO: DELETE KRNAY WALAY ROUTE BNANAY HAIN!
			// category deletion route (badd mien bnana hain!! 🤐)
			route("delete/:categoryId", "./routes/_actions/delete-category.tsx"),
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
			route(":productId/update", "./routes/update-product.tsx"),

			route(":productId/variants", "./routes/product-variants.tsx"),
			// route(":productId/update", "./routes/update-product.tsx"),
		]),
	]),
] satisfies RouteConfig;

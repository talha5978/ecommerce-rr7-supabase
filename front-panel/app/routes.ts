import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	layout("./routes/layout.tsx", [
		index("routes/Home/home.tsx"),
		route("/product/:productId/:metaUrl", "./routes/Products/product-details.tsx"),
	]),
	route("*", "./routes/Error/404.tsx"),
] satisfies RouteConfig;

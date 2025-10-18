import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	route("/login", "./routes/Login/login.tsx"),
	route("/login/google", "./routes/_actions/google-login.tsx"),
	route("/logout", "./routes/_actions/logout.tsx"),
	route("/auth/callback", "./routes/Login/google-login-callback.tsx"),

	layout("./routes/layout.tsx", [
		index("routes/Home/home.tsx"),
		route("/product/:productId/:metaUrl", "./routes/Products/product-details.tsx"),
	]),
	route("*", "./routes/Error/404.tsx"),
] satisfies RouteConfig;

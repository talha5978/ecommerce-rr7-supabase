import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	route("/login", "./routes/Login/login.tsx"),
	route("/login/google", "./routes/_actions/google-login.tsx"),
	route("/logout", "./routes/_actions/logout.tsx"),
	route("/auth/callback", "./routes/Login/google-login-callback.tsx"),

	layout("./routes/layout.tsx", [
		index("routes/Home/home.tsx"),
		route("/product/:productId/:metaUrl", "./routes/Products/product-details.tsx"),
		route("/search", "./routes/Details/Search.tsx"),

		...prefix("/cart", [
			route("", "./routes/Cart/cart.tsx"),
			...prefix("/checkout", [
				index("./routes/Checkout/CheckoutSummary.tsx"),
				route("payment", "./routes/Checkout/Payment.tsx"),
			]),
		]),

		route("/favourites", "./routes/Favourites/favourites.tsx"),
	]),
	route("*", "./routes/Error/404.tsx"),
] satisfies RouteConfig;

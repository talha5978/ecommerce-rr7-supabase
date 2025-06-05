import { type RouteConfig, layout, route, index, prefix } from "@react-router/dev/routes";

export default [
	...prefix("/login", [
		index("./routes/login.tsx"),
		route("otp", "./routes/otp.tsx"),
	]),

	route("/logout", "./routes/logout.tsx"),

	route("/", "./routes/layout.tsx", [
		index("./routes/index-redirect.tsx"),
		route("dashboard", "./routes/dashboard.tsx"),
		...prefix("/categories", [
			index("./routes/categories.tsx"),
			route("/:categoryId", "./routes/category-form.tsx"),
		])
	]),
] satisfies RouteConfig;

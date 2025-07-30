import { Route } from "./+types/dashboard";

export async function loader({ request }: Route.LoaderArgs) {
	return {};
}

export default function Dashboard() {
	return (
		<div>
			<h1 className="text-2xl">Dashboard</h1>
			<div className="h-1 w-full bg-gray-400" />
			<p className="text-2xl">PROTECTED</p>
		</div>
	);
}

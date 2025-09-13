import { type LoaderFunctionArgs } from "react-router";
import Header from "~/components/Header/Header";

export const loader = ({ request }: LoaderFunctionArgs) => {
	// get categories and collections here
};

export default function HomePage() {
	return (
		<>
			<Header />
			<div>Body content of home page</div>
		</>
	);
}

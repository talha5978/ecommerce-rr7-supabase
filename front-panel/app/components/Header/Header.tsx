import MainHeader from "~/components/Header/MainHeader";
import { type FP_HeaderCategory } from "@ecom/shared/types/category";

export default function Header({ categories }: { categories: FP_HeaderCategory[] }) {
	return (
		<header className="max-container mb-4">
			<div>
				<MainHeader categories={categories} />
			</div>
		</header>
	);
}

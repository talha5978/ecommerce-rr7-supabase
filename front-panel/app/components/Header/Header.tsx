import MainHeader from "~/components/Header/MainHeader";
import CategoriesSubHeader from "~/components/Header/CategoriesSubHeader";
import { type FP_HeaderCategory } from "@ecom/shared/types/category";

export default function Header({ categories }: { categories: FP_HeaderCategory[] }) {
	return (
		<header className="max-container mb-4">
			<div>
				<MainHeader />
				<CategoriesSubHeader categories={categories} />
			</div>
		</header>
	);
}

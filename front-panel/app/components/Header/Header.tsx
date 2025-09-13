import MainHeader from "~/components/Header/MainHeader";
import BlocksSubHeader from "~/components/Header/SubHeader_Blocks";

export default function Header() {
	return (
		<header className="w-full border-b-2 border-b-accent">
			<div className="flex flex-col gap-5">
				<MainHeader />
				{/* <BlocksSubHeader /> */}
			</div>
		</header>
	);
}

import { Layers, MoveRight, Search, Workflow } from "lucide-react";
import { type ChangeEvent, memo, useRef, useState } from "react";
import { Link } from "react-router";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { useGlobalSearch } from "~/hooks/use-global-search";
import { Button } from "../ui/button";

const Menu = memo(function Menu({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
	const { results, search } = useGlobalSearch();

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Search..." onValueChange={(val) => search(val)} />
			<CommandList>
				<CommandList>
					{results.length === 0 ? (
						<CommandEmpty>No results found.</CommandEmpty>
					) : (
						<CommandGroup heading="Results">
							{results.map((entry) => (
								<Link key={entry.id} to={entry.url}>
									<CommandItem
										value={`${entry.label} ${entry.keywords?.join(" ") ?? ""}`}
										onSelect={() => {
											if (entry.entry_type === "action" && entry.action) {
												entry.action();
											}
											setOpen(false);
										}}
										className="flex justify-between"
									>
										<div className="flex gap-3 items-center">
											{entry.entry_type === "page" ? <Layers /> : <Workflow />}
											<span>{entry.label}</span>
										</div>
										{entry.entry_type === "page" && <MoveRight />}
									</CommandItem>
								</Link>
							))}
						</CommandGroup>
					)}
				</CommandList>
			</CommandList>
		</CommandDialog>
	);
});

export default function GlobalSearch() {
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleInputClick = () => {
		setOpen(true);
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.value.length > 0) {
			setOpen(true);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		}
	};

	return (
		<>
			<div>
				<div className="sm:hidden inline">
					<Button variant={"outline"} onClick={handleInputClick}>
						<Search width={18} />
					</Button>
				</div>
				<div className="sm:inline hidden">
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search..."
							name="global_search"
							className="w-full px-9"
							id="search"
							onClick={handleInputClick}
							onChange={handleInputChange}
							ref={inputRef}
						/>
					</div>
				</div>
			</div>
			<Menu open={open} setOpen={setOpen} />
		</>
	);
}

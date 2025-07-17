import {
	IconNotification,
	IconSettings,
	IconUserCircle,
} from "@tabler/icons-react";
import { useLoaderData } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function UserButton() {
	const { user } = useLoaderData();
	
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild tabIndex={0}>
				<Avatar className="h-8 w-8 rounded-full my-1 ml-1 border-2 border-primary cursor-pointer">
					<AvatarImage src={"https://bundui-images.netlify.app/avatars/01.png"} alt={user?.name} />
					<AvatarFallback className="rounded-lg">AD</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
				side={"bottom"}
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user?.name || "Admin"}</span>
							<span className="truncate font-normal text-muted-foreground">{user?.email}</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<IconUserCircle />
						Account
					</DropdownMenuItem>
					<DropdownMenuItem>
						<IconNotification />
						Notifications
					</DropdownMenuItem>
					<DropdownMenuItem>
						<IconSettings />
						Settings
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

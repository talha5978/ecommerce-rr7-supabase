import { IconNotification, IconSettings, IconUserCircle } from "@tabler/icons-react";
import { Mail } from "lucide-react";
import { useRouteLoaderData } from "react-router";
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
import type { AdminUser } from "@ecom/shared/types/user";

export function UserButton() {
	const { user } = useRouteLoaderData("root");
	const currentUser: AdminUser = user as AdminUser;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild tabIndex={0}>
				<Avatar className="h-8 w-8 rounded-full my-1 ml-1 border-2 border-primary cursor-pointer">
					<AvatarImage
						src={"https://bundui-images.netlify.app/avatars/01.png"}
						alt={currentUser?.last_name ?? "Admin"}
					/>
					<AvatarFallback className="rounded-lg">
						{currentUser?.first_name![0]}
						{currentUser?.last_name![0]}
					</AvatarFallback>
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
						<div className="grid flex-1 text-left text-sm gap-1">
							<span className="truncate font-medium">
								{currentUser?.first_name} {currentUser?.last_name}
							</span>
							<div className="flex gap-3 items-center">
								<Mail className="h-4 w-4 text-muted-foreground" />
								<span className="truncate font-normal text-muted-foreground">
									{currentUser?.email}
								</span>
							</div>
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

import { IconNotification, IconSettings, IconUserCircle } from "@tabler/icons-react";
import { Mail, User } from "lucide-react";
import { useRouteLoaderData } from "react-router";
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

export default function AccountSection() {
	const { user } = useRouteLoaderData("root");
	const currentUser: AdminUser = user as AdminUser;

	return (
		<div className="py-2 px-0 flex gap-2 justify-between text-sm font-medium">
			<div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild tabIndex={0} className="cursor-pointer">
						<User className="w-6 h-6" />
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
			</div>
		</div>
	);
}

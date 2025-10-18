import { IconNotification, IconSettings, IconUserCircle } from "@tabler/icons-react";
import { Loader2, LogIn, LogOutIcon, User } from "lucide-react";
import { Form, Link, useActionData, useNavigation, useRouteLoaderData } from "react-router";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { FullUser } from "@ecom/shared/types/user";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AccountSection() {
	const { user } = useRouteLoaderData("root");
	const currentUser: FullUser = user as FullUser;

	const navigation = useNavigation();
	const actionData = useActionData();

	const isLoggingOut =
		navigation.state === "submitting" &&
		navigation.formAction === "/logout" &&
		navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData?.error) {
			toast.error(actionData.error);
		} else if (actionData == undefined && navigation.formAction === "/logout") {
			toast.success("Logged out successfully");
		}
	}, [actionData]);

	return (
		<div className="py-2 px-0 flex gap-2 justify-between text-sm font-medium">
			{!currentUser ? (
				<Link to={"/login"}>
					<div>
						<User className="w-6 h-6" />
					</div>
				</Link>
			) : (
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
											👋 Hello, {currentUser?.last_name}!
										</span>
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
								{!currentUser ? (
									<Link to={"/login"}>
										<DropdownMenuItem>
											<LogIn />
											Login
										</DropdownMenuItem>
									</Link>
								) : (
									<Form action="/logout" method="POST">
										<button
											disabled={isLoggingOut}
											type="submit"
											className="w-full rounded-sm"
										>
											<DropdownMenuItem variant="destructive" disabled={isLoggingOut}>
												{isLoggingOut ? (
													<Loader2 className="animate-spin" />
												) : (
													<LogOutIcon />
												)}
												Logout
											</DropdownMenuItem>
										</button>
									</Form>
								)}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);
}

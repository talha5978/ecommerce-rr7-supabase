import { LoaderFunctionArgs, redirect } from "react-router";
import { getCurrentUserFromRequest } from "~/hooks/useGetServerUser";

export async function loader({ request }: LoaderFunctionArgs) {
	const { user } = await getCurrentUserFromRequest(request);

	if (user) {
		throw redirect("/dashboard");
	} else {
		throw redirect("/login");
	}
}

export default function IndexRedirect() {
	return null;
}
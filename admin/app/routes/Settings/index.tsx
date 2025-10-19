import { redirect } from "react-router";

export async function loader() {
	return redirect("/settings/store-details");
}

export default function SettingsIndex() {
	return null;
}

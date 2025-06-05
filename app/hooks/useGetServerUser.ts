import { createSupabaseServerClient } from "~/lib/supabase.server";
import { getCache, setCache } from "~/lib/cache";

// Only use for server components
export async function getCurrentUserFromRequest(request: Request) {
    const userCacheKey = "user";
	const cachedUser = getCache(userCacheKey);
	if (cachedUser) {
        console.log("cache hit 📕");
        return { user: cachedUser };
    }

	const { supabase } = createSupabaseServerClient(request);
	const {
		data: { user },
	} = await supabase.auth.getUser();
	console.log("NO cache hit 📕");

    setCache(userCacheKey, user, 25 * 60 * 1000);
	return { user };
}
import { type ServiceBase } from "@ecom/shared/services/service";
import { format } from "date-fns";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { createServiceMiddleware } from "@ecom/shared/middlewares/utils";

export const loggerMiddleware = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
	try {
		console.log(`📑 [${ctx.methodName}] called at ${currentDate}`);
		const next_process = await next();
		console.log(`\x1b[32m📑 [${ctx.methodName}] successfully finished \x1b[0m`);
		return next_process;
	} catch (error) {
		if (error instanceof ApiError && error.details.length) {
			console.error(
				`🔴 ${error.statusCode} ERROR - ${error.message} - ${currentDate}\n`,
				error.details.map((detail) => detail?.stack),
			);
		} else {
			console.error(`🔴 ERROR - `, error, currentDate);
		}
		throw error;
	}
});

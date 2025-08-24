import { type ServiceBase } from "@ecom/shared/services/service";
import { format } from "date-fns";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { createServiceMiddleware } from "@ecom/shared/middlewares/utils";

export const loggerMiddleware = createServiceMiddleware<ServiceBase>(async (ctx, next) => {
	const currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");
	try {
		console.log(`\x1b[35m📑 [${ctx.methodName}] service called at ${currentDate} \x1b[0m`);
		const next_process = await next();
		console.log(`\x1b[35m [${ctx.methodName}] service successfully finished \x1b[0m`);
		return next_process;
	} catch (error) {
		if (error instanceof ApiError && error.details.length) {
			console.error(
				`🔴\x1b[31m ${error.statusCode} ERROR - ${error.message} - ${currentDate}\x1b[0m \n`,
				error.details.map((detail) => detail?.stack),
			);
		} else {
			console.error(`🔴\x1b[31m ERROR - `, error, currentDate, "\x1b[0m");
		}
		throw error;
	}
});

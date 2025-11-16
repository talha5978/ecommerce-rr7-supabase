import { TAILWIND_CDN } from "@ecom/shared/constants/invoice";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { type Invoice } from "@ecom/shared/schemas/invoice.schema";
import chromium from "@sparticuz/chromium";

export class InvoiceService {
	async generatePdf(body: Invoice) {
		let browser;
		let page;

		try {
			const ReactDOMServer = (await import("react-dom/server")).default;
			const InvoiceTemplate = await import("@ecom/shared/components/Invoice/InvoiceTemplate").then(
				(module) => module.default,
			);
			const htmlTemplate = ReactDOMServer.renderToStaticMarkup(InvoiceTemplate(body));

			// console.log(htmlTemplate);

			if (process.env.VITE_ENV === "production") {
				const puppeteer = (await import("puppeteer-core")).default;
				browser = await puppeteer.launch({
					args: [...chromium.args, "--disable-dev-shm-usage", "--ignore-certificate-errors"],
					executablePath: await chromium.executablePath(),
					headless: true,
				});
			} else {
				const puppeteer = (await import("puppeteer")).default;
				browser = await puppeteer.launch({
					args: ["--no-sandbox", "--disable-setuid-sandbox"],
					headless: true,
				});
			}

			if (!browser) {
				throw new Error("Failed to launch browser");
			}

			page = await browser.newPage();
			await page.setContent(htmlTemplate, {
				waitUntil: ["networkidle0", "load", "domcontentloaded"],
				timeout: 30000,
			});

			await page.addStyleTag({
				url: TAILWIND_CDN,
			});

			const pdf: Uint8Array = await page.pdf({
				format: "a4",
				printBackground: true,
				preferCSSPageSize: true,
			});

			return new Response(new Blob([pdf as any], { type: "application/pdf" }), {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename=${Date.now().toString()}_invoice.pdf`,
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				},
				status: 200,
			});
		} catch (error: any) {
			console.error("PDF Generation Error:", error);
			return new ApiError("Failed to generate PDF", 500, [error]);
		} finally {
			if (page) {
				try {
					await page.close();
				} catch (e) {
					console.error("Error closing page:", e);
				}
			}
			if (browser) {
				try {
					const pages = await browser.pages();
					await Promise.all(pages.map((p) => p.close()));
					await browser.close();
				} catch (e) {
					console.error("Error closing browser:", e);
				}
			}
		}
	}
}

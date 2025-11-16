import type { ReactNode } from "react";
import type { Invoice } from "@ecom/shared/schemas/invoice.schema";

type InvoiceLayoutProps = {
	data: Invoice;
	children: ReactNode;
};

export default function InvoiceLayout({ data: _, children }: InvoiceLayoutProps) {
	const head = (
		<>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			<link
				href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
				rel="stylesheet"
			></link>
		</>
	);

	return (
		<>
			{head}
			<section style={{ fontFamily: "Outfit, sans-serif" }}>
				<div className="flex flex-col p-4 sm:p-10 bg-white rounded-xl min-h-[60rem]">{children}</div>
			</section>
		</>
	);
}

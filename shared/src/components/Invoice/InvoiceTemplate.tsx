import React from "react";
import { Invoice } from "@ecom/shared/schemas/invoice.schema";
import InvoiceLayout from "@ecom/shared/components/Invoice/InvoiceLayout";
import { DATE_OPTIONS } from "@ecom/shared/constants/invoice";

/**
 * Formats a number with commas and decimal places
 *
 * @param {number} number - Number to format
 * @returns {string} A styled number to be displayed on the invoice
 */
const formatNumberWithCommas = (number: number) => {
	return number.toLocaleString("en-US", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

const InvoiceTemplate = (data: Invoice) => {
	const { sender, receiver, details } = data;

	return (
		<InvoiceLayout data={data}>
			<div className="flex justify-between">
				<div>
					{details.invoiceLogo && (
						<img
							src={details.invoiceLogo}
							width={140}
							height={100}
							alt={`Logo of ${sender.name}`}
						/>
					)}
					<h1 className="mt-2 text-lg md:text-xl font-semibold text-indigo-500">{sender.name}</h1>
				</div>
				<div className="text-right">
					<h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Invoice #</h2>
					<span className="mt-1 block text-gray-500">{details.invoiceNumber}</span>
					<address className="mt-4 not-italic text-gray-800">
						{sender.address}
						<br />
						{sender.city}
						<br />
					</address>
				</div>
			</div>

			<div className="mt-6 grid sm:grid-cols-2 gap-3">
				<div>
					<h3 className="text-lg font-semibold text-gray-800">Bill to:</h3>
					<h3 className="text-lg font-semibold text-gray-800">{receiver.name}</h3>
					{}
					<address className="mt-2 not-italic text-gray-500">
						{receiver.address && receiver.address.length > 0 ? receiver.address : null}
						<br />
						{receiver.city}
						<br />
					</address>
				</div>
				<div className="sm:text-right space-y-2">
					<dl className="grid sm:grid-cols-6 gap-x-3">
						<dt className="col-span-3 font-semibold text-gray-800">Invoice date:</dt>
						<dd className="col-span-3 text-gray-500">
							{new Date(details.invoiceDate).toLocaleDateString("en-US", DATE_OPTIONS)}
						</dd>
					</dl>
				</div>
			</div>

			<div className="mt-3">
				<div className="border border-gray-200 p-1 rounded-lg space-y-1">
					<div className="hidden sm:grid sm:grid-cols-5">
						<div className="sm:col-span-2 text-xs font-medium text-gray-500 uppercase">Item</div>
						<div className="text-left text-xs font-medium text-gray-500 uppercase">Quantity</div>
						<div className="text-left text-xs font-medium text-gray-500">Rate</div>
						<div className="text-right text-xs font-medium text-gray-500 uppercase">Amount</div>
					</div>
					<div className="hidden sm:block border-b border-gray-200"></div>
					<div className="grid grid-cols-3 sm:grid-cols-5 gap-y-1">
						{details.items.map((item, index) => (
							<React.Fragment key={index}>
								<div className="col-span-full sm:col-span-2 border-b border-gray-300">
									<p className="font-medium text-gray-800">{item.name}</p>
									<p className="text-xs text-gray-600 whitespace-pre-line">
										{item.description}
									</p>
								</div>
								<div className="border-b border-gray-300">
									<p className="text-gray-800">{item.quantity}</p>
								</div>
								<div className="border-b border-gray-300">
									<p className="text-gray-800">
										{item.unitPrice} {details.currency}
									</p>
								</div>
								<div className="border-b border-gray-300">
									<p className="sm:text-right text-gray-800">
										{item.total} {details.currency}
									</p>
								</div>
							</React.Fragment>
						))}
					</div>
					<div className="sm:hidden border-b border-gray-200"></div>
				</div>
			</div>

			<div className="mt-2 flex sm:justify-end">
				<div className="sm:text-right space-y-2">
					<div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-2">
						<dl className="grid sm:grid-cols-5 gap-x-3">
							<dt className="col-span-3 font-semibold text-gray-800">Subtotal:</dt>
							<dd className="col-span-2 text-gray-500">
								{formatNumberWithCommas(Number(details.subTotal))} {details.currency}
							</dd>
						</dl>
						<dl className="grid sm:grid-cols-5 gap-x-3">
							<dt className="col-span-3 font-semibold text-gray-800">Discount:</dt>
							<dd className="col-span-2 text-gray-500">
								{formatNumberWithCommas(Number(details.discount))} {details.currency}
							</dd>
						</dl>
						<dl className="grid sm:grid-cols-5 gap-x-3">
							<dt className="col-span-3 font-semibold text-gray-800">Shipping:</dt>
							<dd className="col-span-2 text-gray-500">
								{formatNumberWithCommas(Number(details.shipping))} {details.currency}
							</dd>
						</dl>
						<dl className="grid sm:grid-cols-5 gap-x-3">
							<dt className="col-span-3 font-semibold text-gray-800">Total:</dt>
							<dd className="col-span-2 text-gray-500">
								{formatNumberWithCommas(Number(details.totalAmount))} {details.currency}
							</dd>
						</dl>
						{details.totalAmountInWords && (
							<dl className="grid sm:grid-cols-5 gap-x-3">
								<dt className="col-span-3 font-semibold text-gray-800">Total in words:</dt>
								<dd className="col-span-2 text-gray-500">
									<em>
										{details.totalAmountInWords} {details.currency}
									</em>
								</dd>
							</dl>
						)}
					</div>
				</div>
			</div>

			<div>
				<div className="my-2">
					<p className="font-semibold text-indigo-500">Additional notes:</p>
					<p className="font-regular text-gray-800">{details.additionalNotes}</p>
				</div>
				<p className="text-gray-500 text-sm">
					If you have any questions concerning this invoice, use the following contact information:
				</p>
				<div>
					<p className="block text-sm font-medium text-gray-800">{sender.email}</p>
					<p className="block text-sm font-medium text-gray-800">{sender.phone}</p>
				</div>
			</div>
		</InvoiceLayout>
	);
};

export default InvoiceTemplate;

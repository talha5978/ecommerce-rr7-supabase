import { z } from "zod";
import { DATE_OPTIONS } from "@ecom/shared/constants/invoice";

const fieldValidators = {
	name: z.string().min(2, { message: "Must be at least 2 characters" }),

	address: z.string().min(2, { message: "Must be at least 2 characters" }),

	city: z.string().min(1, { message: "Must be between 1 and 50 characters" }),
	email: z
		.string()
		.email({ message: "Email must be a valid email" })
		.min(5, { message: "Must be between 5 and 30 characters" }),
	phone: z.string().min(1, { message: "Must be between 1 and 50 characters" }).max(50, {
		message: "Must be between 1 and 50 characters",
	}),

	date: z.date().transform((date) => new Date(date).toLocaleDateString("en-US", DATE_OPTIONS)),

	quantity: z.coerce.number().gt(0, { message: "Must be a number greater than 0" }),
	unitPrice: z.coerce
		.number()
		.gt(0, { message: "Must be a number greater than 0" })
		.lte(Number.MAX_SAFE_INTEGER, { message: `Must be ≤ ${Number.MAX_SAFE_INTEGER}` }),

	string: z.string(),
	stringMin1: z.string().min(1, { message: "Must be at least 1 character" }),
	stringToNumber: z.coerce.number(),

	stringOptional: z.string().optional(),

	nonNegativeNumber: z.coerce.number().nonnegative({
		message: "Must be a positive number",
	}),
};

const InvoiceSenderSchema = z.object({
	name: fieldValidators.name,
	address: fieldValidators.address,
	city: fieldValidators.city,
	email: fieldValidators.email,
	phone: fieldValidators.phone,
});

const InvoiceReceiverSchema = z.object({
	name: fieldValidators.name,
	address: fieldValidators.address,
	city: fieldValidators.city,
	email: fieldValidators.email,
	phone: fieldValidators.phone,
});

const ItemSchema = z.object({
	name: fieldValidators.stringMin1,
	description: fieldValidators.stringOptional,
	quantity: fieldValidators.quantity,
	unitPrice: fieldValidators.unitPrice,
	total: fieldValidators.stringToNumber,
});

const InvoiceDetailsSchema = z.object({
	invoiceLogo: fieldValidators.stringOptional,
	invoiceNumber: fieldValidators.stringMin1,
	invoiceDate: fieldValidators.date,
	purchaseOrderNumber: fieldValidators.stringOptional,
	currency: fieldValidators.string,
	items: z.array(ItemSchema),
	tax: fieldValidators.nonNegativeNumber,
	discount: fieldValidators.nonNegativeNumber,
	shipping: fieldValidators.nonNegativeNumber,
	subTotal: fieldValidators.nonNegativeNumber,
	totalAmount: fieldValidators.nonNegativeNumber,
	totalAmountInWords: fieldValidators.string,
	additionalNotes: fieldValidators.stringOptional,
});

export const InvoiceSchema = z.object({
	sender: InvoiceSenderSchema,
	receiver: InvoiceReceiverSchema,
	details: InvoiceDetailsSchema,
});

export type Invoice = z.infer<typeof InvoiceSchema>;

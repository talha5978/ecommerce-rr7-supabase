import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { lazy, Suspense, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useRouteLoaderData,
	useSubmit,
} from "react-router";
import { Breadcrumbs } from "~/components/SEO/Breadcrumbs";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
	calculateCartSummary,
	type CartSummary,
	findAppliedDiscount,
	getCart,
	removeFromCart,
} from "~/utils/manageCart";
import { type loader as rootLoader } from "~/root";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { ArrowRight, ChevronUp, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { type CheckoutFormData, CheckoutSchema } from "~/schema/checkout.schema";
import { queryClient } from "@ecom/shared/lib/query-client/queryClient";
import { TaxesQuery } from "~/queries/taxes.q";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Textarea } from "~/components/ui/textarea";
import type { PlaceOrderServicePayload } from "@ecom/shared/types/orders";
import { FP_OrdersService } from "@ecom/shared/services/orders.service";
import type { ActionResponse, ActionReturn } from "@ecom/shared/types/action-data";
import { ApiError } from "@ecom/shared/utils/ApiError";
import { StripeService } from "@ecom/shared/services/stripe.service";
import { FP_PaymentsService } from "@ecom/shared/services/payments.service";

const AddressPicker = lazy(() => import("~/components/Custom-Inputs/address-picker"));

type ActionReturnType = Promise<ActionReturn & { clientSecret: string | null; order_id: string | null }>;
type ActionResponseType =
	| (ActionResponse & { clientSecret: string | null; order_id: string | null })
	| undefined;

export const action = async ({ request }: ActionFunctionArgs): ActionReturnType => {
	const formData = await request.formData();

	type p = PlaceOrderServicePayload;
	const payload: p = {
		shipping_address: JSON.parse(
			formData.get("shipping_address") as string,
		) as unknown as p["shipping_address"],
		billing_address: JSON.parse(formData.get("billing_address") as string) as unknown as
			| p["billing_address"]
			| undefined,
		cart_summary: JSON.parse(formData.get("cart_summary") as string) as unknown as p["cart_summary"],
		order_note: JSON.parse(formData.get("order_note") as string) as unknown as p["order_note"],
		isBillingSameAsShipping: formData.get(
			"isBillingSameAsShipping",
		) as unknown as p["isBillingSameAsShipping"],
		cart_items: JSON.parse(formData.get("cart_items") as string) as unknown as p["cart_items"],
		payment_method: formData.get("payment_method") as unknown as p["payment_method"],
	};

	let order_id: string | null = null;
	let clientSecret: string | null = null;
	let paymentIntentId: string | null = null;

	try {
		try {
			const order_svc = new FP_OrdersService(request);
			const { order_id: svc_order_id } = await order_svc.placeInitialOrder({
				// @ts-ignore
				billing_address: payload.billing_address === "" ? undefined : payload.billing_address,
				...payload,
			});
			order_id = svc_order_id;
		} catch (error: any) {
			return {
				success: false,
				clientSecret: null,
				order_id,
				error: error instanceof ApiError ? error.message : error.message || "Failed to place order",
			};
		}

		if (order_id == null) {
			return {
				success: false,
				clientSecret: null,
				order_id,
				error: new ApiError("Failed to place order", 500, []),
			};
		}

		if (payload.payment_method == "online") {
			const stripe_svc = new StripeService();
			const {
				clientSecret: svc_clientSecret,
				error: paymentIntent_err,
				paymentIntentId: svc_paymentIntentId,
			} = await stripe_svc.createPaymentIntent({
				orderId: order_id,
				amount: Number(payload.cart_summary.total),
			});

			clientSecret = svc_clientSecret;
			paymentIntentId = svc_paymentIntentId;

			if (paymentIntent_err != null) {
				return {
					success: false,
					clientSecret,
					order_id,
					error:
						paymentIntent_err instanceof ApiError
							? paymentIntent_err.message
							: "Failed to initiate payment process",
				};
			}
		}

		const payment_svc = new FP_PaymentsService(request);
		const payment_res = await payment_svc.insertInitialPaymentEntry({
			order_id,
			amount: Number(payload.cart_summary.total),
			method: payload.payment_method,
			payment_intent_id: paymentIntentId ?? undefined,
			status: "pending",
		});

		if (payment_res.error != null) {
			return {
				success: false,
				clientSecret,
				order_id,
				error: payment_res.error,
			};
		}

		return { success: true, clientSecret, order_id, error: null };
	} catch (error: any) {
		return {
			success: false,
			clientSecret,
			order_id,
			error: error instanceof ApiError ? error.message : error.message || "Failed to place order",
		};
	}
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const taxes = await queryClient.fetchQuery(TaxesQuery({ request }));
	return taxes;
};

export default function CheckoutPage() {
	const { taxes } = useLoaderData<typeof loader>();
	const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
	const coupons = rootLoaderData?.coupons ?? [];
	const shipping_rate = rootLoaderData?.store_details.store_settings?.shipping_rate ?? 0;

	const actionData: ActionResponseType = useActionData();
	const navigation = useNavigation();
	const navigate = useNavigate();
	const submit = useSubmit();

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	const [cartSummary, setCartSummary] = useState<CartSummary>(
		calculateCartSummary({
			coupons,
			shippingRate: shipping_rate,
			taxRates: taxes ?? [],
			manualCoupon: null,
		}),
	);

	const { discount, shipping, subtotal, tax, total, discountBreakdown, taxBreakdown } = cartSummary;

	const form = useForm<CheckoutFormData>({
		resolver: zodResolver(CheckoutSchema as any),
		mode: "onSubmit",
		defaultValues: {
			shipping_address: {
				first_name: "Ahmed",
				last_name: "Iqbal",
				email: "ahmediqbal@gmail.com",
				phone: "03146013775",
				province: "punjab",
				city: "Bahawalpur",
				postal_code: undefined,
				address: {
					formattedAddress: "",
					lat: 29.394644,
					lng: 71.6638747,
				},
			},
			isBillingSameAsShipping: "y",
			billing_address: undefined,
			manual_coupon: "",
			order_note: "",
			payment_method: "online",
		},
	});

	const { handleSubmit, control, getValues, setValue } = form;

	const cartItems = getCart();

	const isBillingSameAsShipping = useWatch({ control, name: "isBillingSameAsShipping" });
	const payment_method = useWatch({ control, name: "payment_method" });

	const onFormSubmit = (data: CheckoutFormData) => {
		console.log(data);
		console.log(cartSummary);

		// return;
		if (cartItems.length == 0) {
			toast.error("No product found in cart..");
			return;
		}

		const formData = new FormData();
		formData.set("shipping_address", JSON.stringify(data.shipping_address));
		formData.set("isBillingSameAsShipping", data.isBillingSameAsShipping);
		formData.set("billing_address", JSON.stringify(data.billing_address ?? ""));
		formData.set("order_note", JSON.stringify(data.order_note ?? ""));
		formData.set("cart_summary", JSON.stringify(cartSummary));

		let filtered_items = cartItems.flatMap((item) => {
			return {
				color: item.color,
				price: item.original_price,
				quantity: item.quantity,
				size: item.size,
				sku: item.sku,
				variant_id: item.variant_id,
			};
		});

		formData.set("cart_items", JSON.stringify(filtered_items));
		formData.set("payment_method", payment_method ?? data.payment_method);

		submit(formData, { method: "POST" });
	};

	const handleManualCouponsApply = () => {
		const user_input = getValues("manual_coupon");
		if (!user_input) {
			toast.warning("Please enter a coupon code");
			return;
		}

		const manual_coupons = coupons.filter((c) => c.coupon_type === "manual");
		const coupon = manual_coupons.find((c) => c.code === user_input);

		if (!coupon) {
			toast.error("Invalid coupon code");
			return;
		}

		const updatedSummary = calculateCartSummary({
			coupons,
			shippingRate: shipping_rate,
			taxRates: taxes ?? [],
			manualCoupon: coupon,
		});

		setCartSummary(updatedSummary);

		toast.success("Coupon applied successfully");
		setValue("manual_coupon", "");
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				const isCod = form.getValues("payment_method") === "cod";
				if (isCod) {
					toast.success("Order placed successfully");
				} else {
					navigate(
						`payment?success=${actionData.success}&order_id=${actionData.order_id}&client_secret=${actionData.clientSecret}`,
					);
				}
				cartItems.forEach((item) => removeFromCart(item.id));
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData, navigate]);

	// console.log(cartItems);

	return (
		<>
			<section className="max-container px-8 mx-auto mb-12">
				<Breadcrumbs />
				<h1 className="text-2xl font-semibold mb-4">Checkout</h1>
				<form
					action=""
					className="flex gap-4 lg:flex-row flex-col"
					onSubmit={handleSubmit(onFormSubmit)}
				>
					<Form {...form}>
						<div className="lg:w-2/3 flex flex-col gap-4">
							<Card className="flex flex-col gap-2">
								<CardContent className="flex flex-col gap-6">
									<h2 className="text-lg font-semibold">Shipping Address</h2>
									<div className="space-y-4">
										<div className="flex gap-4 md:flex-row flex-col [&>*]:flex-1">
											<FormField
												control={control}
												name="shipping_address.first_name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>First Name</FormLabel>
														<FormControl>
															<Input placeholder="e.g. John" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name="shipping_address.last_name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Last Name</FormLabel>
														<FormControl>
															<Input placeholder="e.g. Doe" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="flex gap-4 md:flex-row flex-col [&>*]:flex-1">
											<FormField
												control={control}
												name="shipping_address.email"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Email</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. hondoe@gmail.com"
																type="email"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name="shipping_address.phone"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Phone No.</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. 031460774"
																type="tel"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="flex gap-4 md:flex-row flex-col [&>*]:flex-1">
											<FormField
												control={control}
												name="shipping_address.province"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Province</FormLabel>
														<FormControl>
															<div className="*:w-full">
																<Select
																	{...field}
																	value={field.value}
																	onValueChange={field.onChange}
																>
																	<SelectTrigger
																		className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden cursor-pointer"
																		size="sm"
																		aria-label="Select a value"
																	>
																		<SelectValue placeholder="Select province" />
																	</SelectTrigger>
																	<SelectContent>
																		{[
																			"punjab",
																			"balochistan",
																			"sindh",
																			"KPK",
																		].map((item) => (
																			<SelectItem
																				key={item}
																				value={item}
																				className="cursor-pointer"
																			>
																				{item
																					.charAt(0)
																					.toUpperCase() +
																					item.slice(1)}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															</div>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={control}
												name="shipping_address.city"
												render={({ field }) => (
													<FormItem>
														<FormLabel>City</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g. Lahore"
																type="text"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
										<div className="flex flex-col gap-2">
											<Label>Address</Label>
											<Suspense
												fallback={
													<Skeleton className="w-full h-[var(--map-height)]" />
												}
											>
												<Controller
													name="shipping_address.address"
													control={control}
													render={({ field }) => (
														<Suspense
															fallback={
																<Skeleton className="w-full h-[var(--map-height)]" />
															}
														>
															<AddressPicker
																value={field.value}
																onChange={field.onChange}
															/>
														</Suspense>
													)}
												/>
											</Suspense>
										</div>
										<div className="my-6">
											<Controller
												name="isBillingSameAsShipping"
												control={control}
												render={({ field }) => (
													<Label className="flex items-center px-2 py-1 cursor-pointer">
														<Checkbox
															checked={field.value == "y"}
															onCheckedChange={() =>
																field.onChange(field.value == "y" ? "n" : "y")
															}
															className="mr-2 cursor-pointer"
														/>
														Use same address for billing?
													</Label>
												)}
											/>
										</div>
									</div>
								</CardContent>

								{isBillingSameAsShipping == "n" && (
									<CardContent className="flex flex-col gap-6">
										<h2 className="text-lg font-semibold">Billing Address</h2>
										<div className="space-y-4">
											<div className="flex gap-4 md:flex-row flex-col [&>*]:flex-1">
												<FormField
													control={control}
													name="billing_address.first_name"
													render={({ field }) => (
														<FormItem>
															<FormLabel>First Name</FormLabel>
															<FormControl>
																<Input placeholder="e.g. John" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="billing_address.last_name"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Last Name</FormLabel>
															<FormControl>
																<Input placeholder="e.g. Doe" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="flex gap-4 md:flex-row flex-col [&>*]:flex-1">
												<FormField
													control={control}
													name="billing_address.email"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Email</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. hondoe@gmail.com"
																	type="email"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="billing_address.phone"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Phone No.</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. 031460774"
																	type="tel"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="flex gap-4 md:flex-row flex-col [&>*]:flex-1">
												<FormField
													control={control}
													name="billing_address.province"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Province</FormLabel>
															<FormControl>
																<div className="*:w-full">
																	<Select
																		{...field}
																		value={field.value}
																		onValueChange={field.onChange}
																	>
																		<SelectTrigger
																			className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden cursor-pointer"
																			size="sm"
																			aria-label="Select a value"
																		>
																			<SelectValue placeholder="Select province" />
																		</SelectTrigger>
																		<SelectContent>
																			{[
																				"punjab",
																				"balochistan",
																				"sindh",
																				"KPK",
																			].map((item) => (
																				<SelectItem
																					key={item}
																					value={item}
																					className="cursor-pointer"
																				>
																					{item
																						.charAt(0)
																						.toUpperCase() +
																						item.slice(1)}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</div>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={control}
													name="billing_address.city"
													render={({ field }) => (
														<FormItem>
															<FormLabel>City</FormLabel>
															<FormControl>
																<Input
																	placeholder="e.g. Lahore"
																	type="text"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
											<div className="flex flex-col gap-2">
												<Label>Address</Label>
												<Suspense
													fallback={
														<Skeleton className="w-full h-[var(--map-height)]" />
													}
												>
													<Controller
														name="billing_address.address"
														control={control}
														render={({ field }) => (
															<Suspense
																fallback={
																	<Skeleton className="w-full h-[var(--map-height)]" />
																}
															>
																<AddressPicker
																	value={field.value}
																	onChange={field.onChange}
																/>
															</Suspense>
														)}
													/>
												</Suspense>
											</div>
										</div>
									</CardContent>
								)}

								<CardContent className={`${isBillingSameAsShipping ? "mt-4" : ""}`}>
									<FormField
										control={control}
										name="order_note"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Special Note</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Give Any Special Note/Instructions here..."
														maxLength={500}
														rows={5}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>
						<div className="lg:w-1/3 lg:sticky lg:top-10 lg:self-start">
							<Card>
								<CardHeader>
									<h2 className="text-xl font-semibold">Your Order</h2>
								</CardHeader>
								<CardContent className="flex lg:flex-col md:flex-row flex-col [&>*]:flex-1 gap-6">
									<div id="cart-items" className="flex flex-col gap-4">
										{cartItems.map((item) => {
											return (
												<div className="flex items-center" key={item.id}>
													<div className="relative">
														<img
															src={
																SUPABASE_IMAGE_BUCKET_PATH +
																"/" +
																item.image_url
															}
															alt={item.product_name}
															className="w-20 h-24 object-cover rounded-lg mr-4"
															loading="lazy"
														/>
														{item.applied_coupon_code &&
															findAppliedDiscount(
																coupons,
																item.applied_coupon_code,
																item.variant_id,
															).discount_value > 0 && (
																<div className="absolute top-0 right-4 p-1 bg-success/80 text-white text-xs rounded">
																	-
																	{
																		findAppliedDiscount(
																			coupons,
																			item.applied_coupon_code,
																			item.variant_id,
																		).discount_value
																	}
																	{findAppliedDiscount(
																		coupons,
																		item.applied_coupon_code,
																		item.variant_id,
																	).isPercent
																		? "%"
																		: " PKR"}{" "}
																	OFF
																</div>
															)}
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-semibold text-lg truncate">
															{item.product_name}
														</h3>
														<div className="flex gap-2 items-center">
															<h4 className="text-sm">{item.sku}</h4>
															<Badge
																className="text-xs whitespace-nowrap select-none"
																variant={"outline"}
															>
																x {item.quantity}
															</Badge>
														</div>
														<p className="text-xs text-muted-foreground mb-1">
															{item.size && `Size: ${item.size} | `}
															{item.color && `Color: ${item.color}`}
														</p>
														{item.applied_coupon_code ? (
															<div className="flex gap-2 items-center">
																{findAppliedDiscount(
																	coupons,
																	item.applied_coupon_code,
																	item.variant_id,
																).isPercent ? (
																	<p>
																		PKR{" "}
																		{item.original_price -
																			item.original_price *
																				(findAppliedDiscount(
																					coupons,
																					item.applied_coupon_code,
																					item.variant_id,
																				).discount_value /
																					100)}
																	</p>
																) : (
																	<p>
																		PKR{" "}
																		{item.original_price -
																			findAppliedDiscount(
																				coupons,
																				item.applied_coupon_code,
																				item.variant_id,
																			).discount_value}
																	</p>
																)}
																<del className="text-sm text-destructive">
																	PKR {item.original_price}
																</del>
															</div>
														) : (
															<p>PKR {item.original_price}</p>
														)}
													</div>
												</div>
											);
										})}
									</div>
									<div className="flex flex-col gap-6">
										<div className="flex flex-col gap-4">
											<div
												id="real-summary"
												className="[&>div>h3]:font-semibold [&>div]:flex [&>div]:gap-2 [&>div]:flex-row [&>div]:justify-between flex flex-col gap-1"
											>
												<div id="sub-total">
													<h3>Sub Total</h3>
													<p>PKR {subtotal}</p>
												</div>
												<div id="shipping-charges">
													<h3>Shipping Charges</h3>
													<p>PKR {shipping}</p>
												</div>
												<div className=" mt-2 mb-1">
													<FormField
														control={control}
														name="manual_coupon"
														render={({ field }) => (
															<FormItem className="w-full">
																<FormControl>
																	<Input
																		placeholder="Enter coupon"
																		type="text"
																		className="w-full"
																		{...field}
																		value={field.value ?? ""}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<Button type="button" onClick={handleManualCouponsApply}>
														Apply
													</Button>
												</div>
												<div id="coupons-discount" className="mt-2">
													<div className="flex flex-col w-full gap-1.5">
														<Separator />
														<Accordion
															transition={{ duration: 0.2, ease: "easeInOut" }}
															className="flex w-full flex-col divide-y divide-secondary"
														>
															<AccordionItem value={"coupons"}>
																<AccordionTrigger className="w-full text-left">
																	<div className="flex justify-between">
																		<h3 className="font-semibold">
																			Discount
																		</h3>
																		<div className="flex gap-2 items-center">
																			<p>PKR {discount}</p>
																			<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
																		</div>
																	</div>
																</AccordionTrigger>
																<AccordionContent>
																	<div className="my-1 flex flex-col gap-1">
																		{Object.keys(discountBreakdown)
																			.length > 0 ? (
																			Object.keys(
																				discountBreakdown,
																			).map((key) => {
																				return (
																					<div
																						key={key}
																						className="flex justify-between [&>p]:text-sm"
																					>
																						<p>{key}</p>
																						<p>
																							{
																								discountBreakdown[
																									key
																								]
																							}
																						</p>
																					</div>
																				);
																			})
																		) : (
																			<p className="text-sm text-muted-foreground">
																				No discount applied
																			</p>
																		)}
																	</div>
																</AccordionContent>
															</AccordionItem>
														</Accordion>
													</div>
												</div>
												<Separator />
												<div id="cart-taxes" className="mt-1">
													<div className="flex flex-col w-full gap-1.5">
														<Accordion
															transition={{ duration: 0.2, ease: "easeInOut" }}
															className="flex w-full flex-col divide-y divide-secondary"
														>
															<AccordionItem value={"coupons"}>
																<AccordionTrigger className="w-full text-left">
																	<div className="flex justify-between">
																		<h3 className="font-semibold">
																			Taxes
																		</h3>
																		<div className="flex gap-2 items-center">
																			<p>PKR {tax}</p>
																			<ChevronUp className="h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180" />
																		</div>
																	</div>
																</AccordionTrigger>
																<AccordionContent>
																	<div className="my-1 flex flex-col gap-1">
																		{Object.keys(taxBreakdown).length >
																		0 ? (
																			Object.keys(taxBreakdown).map(
																				(key) => {
																					return (
																						<div
																							key={key}
																							className="flex justify-between gap-2 [&>p]:text-sm"
																						>
																							<p>{key}</p>
																							<p>
																								{
																									taxBreakdown[
																										key
																									]
																								}
																							</p>
																						</div>
																					);
																				},
																			)
																		) : (
																			<p className="text-sm text-muted-foreground">
																				No tax applied
																			</p>
																		)}
																	</div>
																</AccordionContent>
															</AccordionItem>
														</Accordion>
														<Separator />
													</div>
												</div>
												<div id="grand-total" className="mt-2">
													<h3>Grand Total</h3>
													<p className="font-semibold">PKR {total}</p>
												</div>
											</div>
											<div className="flex-1">
												<FormField
													control={control}
													name="payment_method"
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Select
																	value={field.value}
																	onValueChange={field.onChange}
																>
																	<SelectTrigger className="cursor-pointer w-full">
																		<SelectValue
																			placeholder={`Select payment method`}
																		/>
																	</SelectTrigger>
																	<SelectContent>
																		{(["cod", "online"] as const).map(
																			(option) => (
																				<SelectItem
																					key={option}
																					value={option}
																					className="w-full cursor-pointer"
																				>
																					{option == "cod"
																						? "Cash On Delivery"
																						: "Online Payment"}
																				</SelectItem>
																			),
																		)}
																	</SelectContent>
																</Select>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>
										<Button
											className={`w-full ${isSubmitting && "hover:gap-3 transition-all duration-150"}`}
											size="lg"
											type="submit"
											disabled={isSubmitting}
										>
											Confirm Checkout
											{isSubmitting ? (
												<Loader2 className="animate-spin" />
											) : (
												<ArrowRight className="w-4 h-4" />
											)}
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}

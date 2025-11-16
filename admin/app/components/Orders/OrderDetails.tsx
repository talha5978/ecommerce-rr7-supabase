import { memo, useRef, useCallback, useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, DownloadCloud, Loader2 } from "lucide-react";
import type { GetOrderDetails, OrderDetails as Order } from "@ecom/shared/types/orders";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "~/components/ui/card";
import { ArrowLeft, Box, PencilLineIcon } from "lucide-react";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@ecom/shared/constants/constants";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import OrderStatusBadge from "~/components/Orders/OrderStatusBadge";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { toast } from "sonner";

const shortId = (id?: string) => (!id ? "N/A" : id.length <= 14 ? id : id.slice(0, 8) + "…" + id.slice(-4));

const formatCurrency = (value: number | string | undefined) => {
	if (value == null || value === "") return "N/A";
	const num = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(num)) return String(value);
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "PKR",
		maximumFractionDigits: 2,
	}).format(num);
};

const formatDate = (iso?: string) => {
	if (!iso) return "N/A";
	try {
		return new Date(iso).toLocaleString();
	} catch (e) {
		return iso;
	}
};

export const OrderDetails = memo(({ data }: { data: GetOrderDetails }) => {
	const order = data.order;
	const [orderNoteCopied, setOrderNoteCopied] = useState<boolean>(false);
	const [orderIdCopied, setOrderIdCopied] = useState<boolean>(false);

	const handleOrderNoteCopyClick = () => {
		navigator.clipboard?.writeText(String(order?.order_note || ""));
		setOrderNoteCopied(true);

		setTimeout(() => {
			setOrderNoteCopied(false);
		}, 1500);
	};

	const handleOrderIDCopyClick = () => {
		navigator.clipboard?.writeText(String(order?.id || ""));
		setOrderIdCopied(true);

		setTimeout(() => {
			setOrderIdCopied(false);
		}, 1500);
	};

	if (!order || data.error) {
		return <p className="text-sm text-muted-foreground">No data</p>;
	}

	return (
		<Card className="rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-150">
			<CardHeader className="border-b px-6 py-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-md">
							<Box
								className={`h-6 w-6
                                ${order.status === "pending" ? "text-warning" : order.status === "failed" ? "text-destructive" : order.status === "paid" || order.status === "shipped" ? "text-primary" : order.status === "cancelled" ? "text-default" : ""}`}
							/>
						</div>
						<div>
							<CardTitle className="flex gap-2 items-center">
								<h1 className="text-lg font-semibold tracking-tight">
									Order #{shortId(order.id)}
								</h1>
								<div>
									<Button
										size="sm"
										variant="ghost"
										disabled={
											orderIdCopied ||
											order.order_note === null ||
											order.order_note === ""
										}
										onClick={handleOrderIDCopyClick}
									>
										{orderIdCopied ? (
											<Check
												strokeWidth={1.65}
												width={13}
												className="self-center shrink-0"
											/>
										) : (
											<Copy
												strokeWidth={1.65}
												width={13}
												className="self-center shrink-0"
											/>
										)}
									</Button>
								</div>
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Created at {formatDate(order.created_at)}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<OrderStatusBadge status={order.status} />
						<div className="hidden sm:flex items-center gap-2">
							<Link to="/orders" viewTransition prefetch="intent">
								<Button variant="ghost" size="sm" className="gap-2">
									<ArrowLeft className="h-4 w-4" />
									<span className="text-sm">Back</span>
								</Button>
							</Link>
							<Button size="sm" className="gap-2">
								<PencilLineIcon className="h-4 w-4" />
								<span className="text-sm">Update</span>
							</Button>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-6 py-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Left column: Summary / Actions */}
					<aside className="md:col-span-1 space-y-4">
						<div className="rounded-lg border p-4 pb-6 bg-muted/5">
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">Order Total</p>
								<p className="text-2xl font-semibold">{formatCurrency(order.total)}</p>
							</div>

							<div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground [&>div]:space-y-1">
								<div>
									<div className="text-xs">Subtotal</div>
									<div className="font-medium text-foreground">
										{formatCurrency(order.sub_total)}
									</div>
								</div>
								<div>
									<div className="text-xs">Shipping</div>
									<div className="font-medium text-foreground">
										{formatCurrency(order.shipping)}
									</div>
								</div>
								<div>
									<div className="text-xs">Tax</div>
									<div className="font-medium text-foreground">
										{formatCurrency(order.tax_amount)}
									</div>
								</div>
								<div>
									<div className="text-xs">Discount</div>
									<div className="font-medium text-foreground">
										{formatCurrency(order.discount)}
									</div>
								</div>
							</div>
						</div>

						<div className="rounded-lg border p-4">
							<div className="flex justify-between items-center">
								<h4 className="text-sm font-semibold mb-2">Customer</h4>
								{order.user.role.role_name != "consumer" && (
									<Badge
										variant={
											order.user.role.role_name === "admin"
												? "default"
												: order.user.role.role_name === "employee"
													? "outline"
													: "default"
										}
									>
										{order.user.role.role_name.charAt(0).toUpperCase() +
											order.user.role.role_name.slice(1)}
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 rounded-full my-1 ml-1 cursor-pointer">
									<AvatarImage
										src={order.user.avatar ?? ""}
										alt={order.user.first_name + " " + order.user.last_name || "Avatar"}
									/>
									<AvatarFallback className="rounded-lg bg-muted-foreground/30" />
								</Avatar>
								<div className="text-sm">
									<div className="font-medium">
										{order.user.first_name} {order.user.last_name}
									</div>
									<a
										className="text-xs text-muted-foreground hover:underline cursor-pointer underline-offset-4"
										href={`mailto:${order.user.email}`}
										target="_blank"
									>
										{order.user.email}
									</a>
									{order.user.phone_number && (
										<div className="text-xs text-muted-foreground">
											{order.user.phone_number}
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="rounded-lg border p-4">
							<h4 className="text-sm font-semibold mb-2">Addresses</h4>
							<AddressBlock address={order.shipping_address} />
							<AddressBlock address={order.billing_address} />
						</div>
					</aside>

					{/* Right column: Items, Payment, Notes */}
					<main className="md:col-span-2 space-y-6">
						<section>
							<h3 className="text-lg font-semibold mb-4">Items</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{order.order_items.map((item) => (
									<div
										key={item.id}
										className="flex flex-col rounded-lg  border overflow-hidden"
									>
										<ImageCarousel
											images={item.product_variant.images}
											altPrefix={item.product_variant.product_name}
											className="rounded-t-md"
										/>
										<div className="p-3 flex flex-col gap-1">
											<div>
												<div className="flex items-center gap-2 justify-between">
													<Link
														viewTransition
														to={`/products/${item.product_variant.product_id}/variants`}
													>
														<div className="text-sm font-semibold hover:underline underline-offset-4 cursor-pointer">
															{item.product_variant.product_name}
														</div>
													</Link>
													<Badge className="" variant={"outline"}>
														x{item.quantity}
													</Badge>
												</div>
												<Link
													viewTransition
													to={`/products/${item.product_variant.product_id}/variants/${item.product_variant.id}/update`}
												>
													<div className="text-xs text-muted-foreground hover:underline underline-offset-4 cursor-pointer">
														{item.sku}
													</div>
												</Link>
											</div>
											<div className="text-xs text-muted-foreground">
												{formatCurrency(item.price)}
											</div>
											<div className="flex items-center mt-1 gap-2">
												<div className="text-xs">Size: {item.size || "-"}</div>
												<div className="text-xs">Color: {item.color || "-"}</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</section>

						<PaymentBlock order={order} />

						<section className="rounded-lg border p-4">
							<div className="flex justify-between gap-2">
								<h3 className="text-lg font-semibold mb-2">Order Note</h3>
								<div>
									<Button
										size="sm"
										variant="ghost"
										disabled={
											orderNoteCopied ||
											order.order_note === null ||
											order.order_note === ""
										}
										onClick={handleOrderNoteCopyClick}
									>
										{orderNoteCopied ? (
											<Check
												strokeWidth={1.65}
												width={13}
												className="self-center shrink-0"
											/>
										) : (
											<Copy
												strokeWidth={1.65}
												width={13}
												className="self-center shrink-0"
											/>
										)}
									</Button>
								</div>
							</div>
							<p className="text-sm text-muted-foreground">
								{order.order_note || "No special notes."}
							</p>
						</section>
					</main>
				</div>
			</CardContent>

			<CardFooter className="px-6 py-4 border-t flex justify-end gap-2 sm:hidden">
				<Link to="/orders" viewTransition prefetch="intent">
					<Button variant="outline">Back to list</Button>
				</Link>
				<Button>Update</Button>
			</CardFooter>
		</Card>
	);
});

const AddressBlock = memo(
	({ address }: { address: Order["shipping_address"] | Order["billing_address"] }) => {
		if (address == null) {
			return <></>;
		}

		return (
			<div className="text-xs">
				<div className="mb-2 [&>p]:text-muted-foreground flex flex-col gap-1">
					<h5 className="font-medium mb-1">
						{address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
					</h5>
					<p>{address?.address_name || ""}</p>
					<p>
						{address?.city},{" "}
						{address?.province?.charAt(0).toUpperCase() + (address?.province ?? "").slice(1)}
					</p>
					<p>{address.first_name + " " + address.last_name}</p>
					<a
						className="hover:underline cursor-pointer text-muted-foreground underline-offset-4"
						href={`mailto:${address.email}`}
					>
						{address.email}
					</a>
					{address.phone && <p>{address.phone}</p>}
					<a
						href={`https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`}
						target="_blank"
						className="hover:underline cursor-pointer text-primary underline-offset-4"
					>
						Open Google Maps
					</a>
				</div>
			</div>
		);
	},
);

const PaymentBlock = ({ order }: { order: Order }) => {
	const [copied, setCopied] = useState<{ value: string; state: boolean }>({
		value: "",
		state: false,
	});

	const [generatingPdf, setGeneratingPdf] = useState(false);

	const payment = order.payment;

	if (!payment) {
		return (
			<section className="rounded-lg border p-4">
				<h3 className="text-lg font-semibold mb-2">Payment</h3>
				<p className="text-sm text-muted-foreground">No payment information available.</p>
			</section>
		);
	}

	const handleInvoiceClick = () => {
		setGeneratingPdf(true);
		const data = new FormData();
		data.set("order", JSON.stringify(order));
		MakePdfRequest(data);
	};

	async function MakePdfRequest(fd: FormData) {
		try {
			const response = await fetch("/generate-invoice-pdf", {
				method: "POST",
				body: fd,
			});

			if (!response.ok) {
				const text = await response.text();
				console.error("PDF request failed:", response.status, text);
				toast.error("Failed to generate invoice");
				return;
			}

			const blob = await response.blob();

			if (blob && blob.size > 0) {
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${Date.now().toString()}_invoice.pdf`;
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);
			} else {
				toast.error("Received empty file");
			}
		} catch (err) {
			console.error("MakePdfRequest error", err);
			toast.error("Failed to download invoice");
		} finally {
			setGeneratingPdf(false);
		}
	}

	const isCOD = payment.method === "cod";

	const copy = async (value: string, txt?: string) => {
		if (!txt) return;
		await navigator.clipboard.writeText(txt);
		setCopied({ value, state: true });
		setTimeout(() => setCopied({ value: "", state: false }), 1500);
	};

	return (
		<section className="rounded-xl border p-6 space-y-6 ">
			<div className="space-y-4">
				<div className="flex gap-2 justify-between items-center">
					<div>
						<h3 className="text-lg font-semibold">Payment</h3>
						<p className="text-muted-foreground text-sm">
							Created at {formatDate(payment.created_at)}
						</p>
					</div>
					<div className="flex gap-2 items-center">
						<Badge className="text-xs" variant={isCOD ? "default" : "outline"}>
							{isCOD ? "Cash on Delivery" : "Online"}
						</Badge>
						<PaymentStatusBadge payment={payment} />
					</div>
				</div>

				<div className="flex gap-2">
					<div className="p-4 rounded-lg border bg-muted/5">
						<p className="text-xs text-muted-foreground mb-1">Amount</p>
						<p className="text-md font-semibold">{formatCurrency(payment.amount)}</p>
					</div>

					{payment.payment_intent_id != null && (
						<div className="p-4 rounded-lg border bg-muted/5">
							<p className="text-xs text-muted-foreground mb-1">Payment Intent ID</p>
							<div className="flex items-center gap-3">
								<code className="py-1 rounded text-xs">
									{shortId(payment.payment_intent_id)}
								</code>

								<button
									onClick={() => copy("intent_id", payment.payment_intent_id as string)}
									className="text-muted-foreground hover:text-foreground cursor-pointer"
								>
									{copied.value === "intent_id" ? (
										<Check className="h-3 w-3" />
									) : (
										<Copy className="h-3 w-3" />
									)}
								</button>
							</div>
						</div>
					)}

					<div className="p-4 rounded-lg border bg-muted/5">
						<p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
						<div className="flex items-center gap-3">
							<code className="py-1 rounded text-xs">{shortId(payment.id)}</code>

							<button
								onClick={() => copy("db_id", payment.id)}
								className="text-muted-foreground hover:text-foreground cursor-pointer"
							>
								{copied.value === "db_id" ? (
									<Check className="h-3 w-3" />
								) : (
									<Copy className="h-3 w-3" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* {payment.refunded_amount ? (
					<p className="text-xs text-muted-foreground">
						Refunded:{" "}
						<span className="font-medium">{formatCurrency(payment.refunded_amount)}</span>
					</p>
				) : null} */}
			</div>

			<div className="flex flex-wrap gap-2 ml-auto w-fit">
				<Button
					size="sm"
					variant="outline"
					className="gap-2"
					type="button"
					onClick={handleInvoiceClick}
					disabled={generatingPdf}
				>
					{generatingPdf ? (
						<Loader2 className="animate-spin h-4 w-4" />
					) : (
						<DownloadCloud className="h-4 w-4" />
					)}
					Invoice
				</Button>

				{payment.status === "completed" ? (
					<Button size="sm" variant="destructive" type="button">
						Refund
					</Button>
				) : null}
			</div>
		</section>
	);
};

type ImageCarouselProps = {
	images?: string[] | null;
	altPrefix?: string;
	className?: string;
};

const ImageCarousel = memo(({ images = [], altPrefix = "", className = "" }: ImageCarouselProps) => {
	const scrollerRef = useRef<HTMLDivElement | null>(null);
	const leftBtnRef = useRef<HTMLButtonElement | null>(null);
	const rightBtnRef = useRef<HTMLButtonElement | null>(null);

	const scrollByPage = useCallback((dir: "left" | "right") => {
		const el = scrollerRef.current;
		if (!el) return;
		const offset = dir === "left" ? -el.clientWidth : el.clientWidth;
		el.scrollBy({ left: offset, behavior: "smooth" });
	}, []);

	// fallback single image
	if (!images || images.length === 0) {
		return (
			<div
				className={`h-36 w-full bg-muted/5 flex items-center justify-center overflow-hidden ${className}`}
			>
				<img
					src={`${SUPABASE_IMAGE_BUCKET_PATH}placeholder.png`}
					alt={altPrefix || "image"}
					className="object-cover h-full bg-muted-foreground w-full"
				/>
			</div>
		);
	}

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;

		const handle = () => {
			const current = Math.round(el.scrollLeft / el.clientWidth);
			const last = images.length - 1;

			// Disable left
			if (leftBtnRef.current) {
				leftBtnRef.current.disabled = current === 0;
				leftBtnRef.current.style.opacity = current === 0 ? "0.4" : "1";
				leftBtnRef.current.style.cursor = current === 0 ? "not-allowed" : "pointer";
			}

			// Disable right
			if (rightBtnRef.current) {
				rightBtnRef.current.disabled = current === last;
				rightBtnRef.current.style.opacity = current === last ? "0.4" : "1";
				rightBtnRef.current.style.cursor = current === last ? "not-allowed" : "pointer";
			}
		};

		el.addEventListener("scroll", handle, { passive: true });
		handle(); // run once on mount

		return () => el.removeEventListener("scroll", handle);
	}, [images.length]);

	return (
		<div className={`relative ${className}`}>
			{/* scroller */}
			<div
				ref={scrollerRef}
				className="flex gap-2 overflow-x-hidden scroll-smooth snap-x snap-mandatory -mx-0.5"
				style={{ WebkitOverflowScrolling: "touch" }}
			>
				{images.map((src, idx) => (
					<div
						key={idx}
						className="flex-shrink-0 w-full snap-center h-36 md:h-44 lg:h-48 overflow-hidden rounded-t-lg"
						style={{ minWidth: "100%" }}
					>
						<img
							src={SUPABASE_IMAGE_BUCKET_PATH + src}
							alt={`${altPrefix} ${idx + 1}`}
							className="w-full h-full object-cover"
							loading="lazy"
							decoding="async"
						/>
					</div>
				))}
			</div>

			{/* left chevron */}
			<button
				ref={leftBtnRef}
				onClick={() => scrollByPage("left")}
				aria-label="Previous image"
				className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg border shadow-sm backdrop-blur-sm bg-muted cursor-pointer hidden sm:flex"
				type="button"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			{/* right chevron */}
			<button
				ref={rightBtnRef}
				onClick={() => scrollByPage("right")}
				aria-label="Next image"
				className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg border shadow-sm backdrop-blur-sm bg-muted cursor-pointer  hidden sm:flex"
				type="button"
			>
				<ChevronRight className="h-4 w-4" />
			</button>

			{/* small pager dots (optional, lightweight) */}
			<div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex gap-1">
				{images.length > 1 &&
					images.map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full border" />)}
			</div>
		</div>
	);
});

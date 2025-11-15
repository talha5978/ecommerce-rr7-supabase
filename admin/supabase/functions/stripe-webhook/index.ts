// @ts-ignore
import Stripe from "https://esm.sh/stripe@14?target=denonext";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")! as string, {
	httpClient: Stripe.createFetchHttpClient(),
	apiVersion: "2024-11-20",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();
// @ts-ignore
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
// @ts-ignore
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
// @ts-ignore
Deno.serve(async (request) => {
	if (request.method !== "POST") {
		return new Response("Method Not Allowed", { status: 405 });
	}

	const signature = request.headers.get("stripe-signature")!;

	// CRITICAL: Read raw body as ArrayBuffer (exact bytes)
	const payloadBuffer = await request.arrayBuffer();
	const payload = new TextDecoder("utf-8").decode(payloadBuffer);

	let event;
	try {
		event = await stripe.webhooks.constructEventAsync(
			payload,
			signature,
			webhookSecret,
			undefined,
			cryptoProvider,
		);
	} catch (err: any) {
		console.log("Webhook signature failed:", err.message);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	if (event.type === "payment_intent.succeeded") {
		const pi = event.data.object as any;
		const paymentIntentId = pi.id;

		const { error: paymentError } = await supabase
			.from("payments")
			.update({ status: "completed" })
			.eq("payment_intent_id", paymentIntentId);

		if (paymentError) {
			console.error("Payments update failed:", paymentError);
			return new Response("Supabase error", { status: 500 });
		}

		const { error: orderError } = await supabase
			.from("orders")
			.update({ status: "paid" })
			.eq("id", pi.metadata.orderId);

		if (orderError) console.error("Orders update failed:", orderError);

		console.log(`Payment ${paymentIntentId} succeeded`);
	}

	if (event.type === "payment_intent.payment_failed") {
		const pi = event.data.object as any;
		await supabase.from("payments").update({ status: "failed" }).eq("payment_intent_id", pi.id);
	}

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

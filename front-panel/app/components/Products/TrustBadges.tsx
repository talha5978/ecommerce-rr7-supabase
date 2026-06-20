import { Truck, ShieldCheck, RotateCcw, CreditCard } from "lucide-react";

function TrustBadges() {
	return (
		<div className="mt-10 border-t border-b border-border">
			<div className="grid sm:grid-cols-2 grid-cols-1 md:grid-cols-4 text-center">
				{/* Free Delivery */}
				<div className="trust-badge">
					<div className="icon-wrapper">
						<Truck className="trust-icon" />
					</div>
					<div>
						<p className="trust-heading">Free Shipping</p>
						<p className="trust-sub-heading">On orders under PKR 2500</p>
					</div>
				</div>

				{/* Secure Payment */}
				<div className="trust-badge">
					<div className="icon-wrapper">
						<ShieldCheck className="trust-icon" />
					</div>
					<div>
						<p className="trust-heading">Secure Payment</p>
						<p className="trust-sub-heading">100% Secure Checkout</p>
					</div>
				</div>

				{/* Easy Returns */}
				<div className="trust-badge">
					<div className="icon-wrapper">
						<RotateCcw className="trust-icon" />
					</div>
					<div>
						<p className="trust-heading">Easy Returns</p>
						<p className="trust-sub-heading">7 Days Return Policy</p>
					</div>
				</div>

				{/* Original Products */}
				<div className="trust-badge">
					<div className="icon-wrapper">
						<CreditCard className="trust-icon" />
					</div>
					<div>
						<p className="trust-heading">100% Original</p>
						<p className="trust-sub-heading">Genuine Products</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TrustBadges;

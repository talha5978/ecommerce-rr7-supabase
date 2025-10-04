import { type OpenStreetMapProvider } from "leaflet-geosearch";
import { ApiError } from "@ecom/shared/utils/ApiError";
import type { searchAddressesResp } from "@ecom/shared/types/addresses.d";

export class AddressService {
	private provider: null | OpenStreetMapProvider;

	constructor() {
		this.provider = null;
	}

	async initProvider() {
		if (!this.provider) {
			const module = await import("leaflet-geosearch");
			this.provider = new module.OpenStreetMapProvider();
		}
	}

	async searchAddresses({ query }: { query: string }): Promise<searchAddressesResp> {
		await this.initProvider();
		if (!this.provider) throw new ApiError("Geosearch provider not initialized", 400, []);
		const results = await this.provider.search({ query });

		return {
			addresses: results.map((result) => ({
				formattedAddress: result.label,
				lat: result.y,
				lng: result.x,
			})),
			count: results.length,
		};
	}

	async reverseGeocode({ lat, lng }: { lat: number; lng: number }): Promise<string> {
		try {
			const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
			const response = await fetch(url);

			if (!response.ok) {
				throw new ApiError("Failed to reverse geocode", response.status, []);
			}

			const data = await response.json();
			return data.display_name || "Selected Location";
		} catch (error) {
			return "Selected Location";
		}
	}
}

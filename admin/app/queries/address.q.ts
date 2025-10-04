import { queryOptions } from "@tanstack/react-query";
import { AddressService } from "@ecom/shared/services/address.service";
import type { searchAddressesResp } from "@ecom/shared/types/addresses";

export const addressSearchQuery = ({ query }: { query: string }) => {
	return queryOptions<searchAddressesResp>({
		queryKey: ["a_store_address_search", query],
		queryFn: async () => {
			const addressService = new AddressService();
			const result = await addressService.searchAddresses({ query: query ?? "" });
			return result;
		},
		staleTime: 24 * 60 * 60 * 1000,
		enabled: (query?.length || 0) > 2,
	});
};

export const reverseGeocodeQuery = ({ lat, lng }: { lat: number; lng: number }) => {
	return queryOptions<string>({
		queryKey: ["a_reverse_geocode", lat, lng],
		queryFn: async () => {
			const addressService = new AddressService();
			const result = await addressService.reverseGeocode({ lat, lng });
			return result;
		},
		staleTime: 24 * 60 * 60 * 1000,
	});
};

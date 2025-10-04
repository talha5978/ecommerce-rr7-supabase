import type { StoreAddress } from "@ecom/shared/types/store-settings";

export type searchAddressesResp = {
	addresses: StoreAddress[];
	count: number;
};

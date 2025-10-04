import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Map } from "leaflet";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { addressSearchQuery, reverseGeocodeQuery } from "~/queries/address.q";
import { MapPin } from "lucide-react";
import type { StoreAddress } from "@ecom/shared/types/store-settings";

const MAP = lazy(() => import("~/components/Map/ClientMap.client"));

interface AddressPickerProps {
	value?: {
		formattedAddress: string;
		lat: number;
		lng: number;
	};
	onChange?: (value: { formattedAddress: string; lat: number; lng: number }) => void;
}

const defaultCenter: [number, number] = [29.394644, 71.6638747]; // Bahawalpur, Pakistan

const MapSkeleton = () => {
	return <Skeleton className="w-full h-[var(--map-height)]" />;
};

const schema = z.object({
	searchTerm: z.string(),
	showSuggestions: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const AddressPicker = ({ value, onChange }: AddressPickerProps) => {
	const mapRef = useRef<Map | null>(null);
	const formattedAddress = value?.formattedAddress ?? "";
	const mapCenter: [number, number] = value ? [value.lat, value.lng] : defaultCenter;
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);
	const [isClient, setIsClient] = useState(false);
	const [reverseGeocodeCoords, setReverseGeocodeCoords] = useState<{ lat: number; lng: number } | null>(
		null,
	);

	const { control, setValue } = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			searchTerm: formattedAddress,
			showSuggestions: false,
		},
	});

	const searchTerm = useWatch({ control, name: "searchTerm" });
	const showSuggestions = useWatch({ control, name: "showSuggestions" });

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		setValue("searchTerm", formattedAddress);
	}, [formattedAddress, setValue]);

	// Address search query
	const { data: searchData, isFetching: isFetchingSearch } = useQuery({
		...addressSearchQuery({ query: searchTerm }),
		enabled: isClient && (searchTerm?.length || 0) > 2 && searchTerm !== formattedAddress,
	});

	// useEffect(() => {
	// 	console.log(formattedAddress);
	// }, [formattedAddress]);

	const suggestions = searchData?.addresses || [];

	useEffect(() => {
		if (suggestions.length > 0 && searchTerm.length > 2 && formattedAddress != searchTerm) {
			setValue("showSuggestions", true);
		} else {
			setValue("showSuggestions", false);
		}
	}, [suggestions, searchTerm, setValue, formattedAddress]);

	// Reverse geocoding query
	const { data: reverseGeocodeAddress } = useQuery({
		...reverseGeocodeQuery(reverseGeocodeCoords || { lat: 0, lng: 0 }),
		enabled: isClient && !!reverseGeocodeCoords,
	});

	useEffect(() => {
		if (reverseGeocodeAddress && reverseGeocodeCoords) {
			const newValue = {
				formattedAddress: reverseGeocodeAddress || "Selected Location",
				lat: reverseGeocodeCoords.lat,
				lng: reverseGeocodeCoords.lng,
			};
			setValue("searchTerm", newValue.formattedAddress, { shouldValidate: true });
			setValue("showSuggestions", false);
			if (onChange) {
				onChange(newValue);
			}
			if (mapRef.current) {
				mapRef.current.setView([newValue.lat, newValue.lng], 15);
			}
		}
	}, [reverseGeocodeAddress, reverseGeocodeCoords, onChange, setValue]);

	const handleMarkerChange = (lat: number, lng: number) => {
		setReverseGeocodeCoords({ lat, lng });
		setValue("searchTerm", "", { shouldValidate: true });
		setValue("showSuggestions", false);
	};

	const handleSelect = (result: StoreAddress) => {
		const newValue = {
			formattedAddress: result.formattedAddress,
			lat: result.lat,
			lng: result.lng,
		};
		setValue("searchTerm", result.formattedAddress, { shouldValidate: true });
		setValue("showSuggestions", false);
		setReverseGeocodeCoords(null);
		if (onChange) {
			onChange(newValue);
		}
		if (mapRef.current) {
			mapRef.current.setView([newValue.lat, newValue.lng], 15);
		}
	};

	const handleInputChange =
		(onChange: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const queryValue = e.target.value;
			onChange(queryValue);

			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}

			debounceTimer.current = setTimeout(() => {
				if (queryValue.length > 2) {
					setValue("showSuggestions", true);
				}
			}, 500);
		};

	return (
		<div className="space-y-4">
			<div className="relative">
				<Controller
					name="searchTerm"
					control={control}
					render={({ field }) => (
						<div className="relative">
							<MapPin
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={15}
							/>
							<Input
								{...field}
								onChange={handleInputChange(field.onChange)}
								placeholder="Search or click/drag on map to select store address"
								className="w-full mb-2 pl-8 pr-5"
							/>
						</div>
					)}
				/>
				{showSuggestions && suggestions.length > 0 && (
					<ul className="absolute z-[1000] w-full bg-secondary rounded-md shadow-lg max-h-60 overflow-y-auto">
						{suggestions.map((result, index) => (
							<li
								key={index}
								className="p-2 hover:bg-secondary/50 cursor-pointer"
								onClick={() => handleSelect(result)}
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										// console.log(result, "selected");
										handleSelect(result);
									}
								}}
							>
								{result.formattedAddress}{" "}
							</li>
						))}
					</ul>
				)}
				{isFetchingSearch && (
					<p className="text-xs italic text-muted-foreground font-medium mt-2">
						Loading suggestions...
					</p>
				)}
			</div>
			{formattedAddress && (
				<p className="text-xs italic text-muted-foreground font-medium">{formattedAddress}</p>
			)}
			{isClient && (
				<Suspense fallback={<MapSkeleton />}>
					<MAP
						ref={mapRef}
						center={mapCenter}
						zoom={value ? 15 : 10}
						value={value}
						onMarkerChange={handleMarkerChange}
					/>
				</Suspense>
			)}
		</div>
	);
};

export default AddressPicker;

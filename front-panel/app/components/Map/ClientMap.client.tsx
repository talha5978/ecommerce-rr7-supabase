import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Map, LeafletMouseEvent } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { forwardRef, memo } from "react";

const DefaultIcon = L.icon({
	iconUrl: icon,
	shadowUrl: iconShadow,
	iconSize: [23, 35],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ClientMapProps {
	center: [number, number];
	zoom: number;
	value?: {
		lat: number;
		lng: number;
	};
	onMarkerChange?: (lat: number, lng: number) => void;
}

const ClientMap = forwardRef<Map, ClientMapProps>(({ center, zoom, value, onMarkerChange }, ref) => {
	const MapEvents = () => {
		useMapEvents({
			click(e: LeafletMouseEvent) {
				if (onMarkerChange) {
					onMarkerChange(e.latlng.lat, e.latlng.lng);
				}
			},
		});
		return null;
	};

	const handleDragEnd = (e: L.DragEndEvent) => {
		if (onMarkerChange) {
			const latlng = e.target.getLatLng();
			onMarkerChange(latlng.lat, latlng.lng);
		}
	};

	return (
		<MapContainer
			center={center}
			zoom={zoom}
			style={{
				height: "var(--map-height)",
				width: "100%",
				zIndex: 0,
				borderRadius: "var(--radius-sm)",
			}}
			ref={ref}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<MapEvents />
			{value && (
				<Marker
					position={[value.lat, value.lng]}
					draggable={true}
					eventHandlers={{
						dragend: (e) => handleDragEnd(e),
					}}
				>
					<Popup>Selected Location</Popup>
				</Marker>
			)}
		</MapContainer>
	);
});

export default memo(ClientMap);

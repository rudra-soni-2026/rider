import React, { useEffect } from "react";
import sendDataToReactNative from "../utils/nativeCommunication";
import { currentLocation } from "../state/userState";

import { OlaMaps } from "olamaps-web-sdk";
import AppBar from "../components/appBar";
import { useLocation, useNavigate } from "react-router";
import { customRequest } from "../utils/customRequest";
import { showAlertPopup } from "../state/uiState";



type Location = {
    latitude: number;
    longitude: number;
};


const olaMaps = new OlaMaps({
    apiKey: "LZ9q8is5UNlRpphGqeGSH7fPK8uqWgOeb76reivs",
})

export default function DeliveryMapScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, orderLongitude, orderLatitude, payment_mode } = location.state || {};
    const [distance, setDistance] = React.useState<string | null>(null);
    const [swipeX, setSwipeX] = React.useState(0);
    const [isSwiping, setIsSwiping] = React.useState(false);
    const [orderCompleted, setOrderCompleted] = React.useState(false);
    const swipeRef = React.useRef<HTMLDivElement>(null);

    // Refs for map, markers, and route
    const mapRef = React.useRef<any>(null);
    const riderMarkerRef = React.useRef<any>(null);
    const routeSourceId = "route";
    const routeLayerId = "route";

    const getCurrentPosition = () => {
        sendDataToReactNative({ action: 'get-current-position' });
    }


    function decodePolyline(str: string): [number, number][] {
        let index = 0, lat = 0, lng = 0, coordinates: [number, number][] = [];
        while (index < str.length) {
            let b, shift = 0, result = 0;
            do {
                b = str.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = str.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            coordinates.push([lng / 1e5, lat / 1e5]);
        }
        return coordinates;
    }

    type MapInstance = {
        addPolyline: (opts: { path: { lng: number; lat: number }[]; color: string; width: number }) => void;
    };

    // Draw or update the route polyline on the map
    const drawOrUpdateRoute = async (origin: Location, destination: Location) => {
        if (!mapRef.current) return;
        const mapInstance = mapRef.current;
        // Remove old route if exists
        if (mapInstance.getLayer && mapInstance.getLayer(routeLayerId)) {
            mapInstance.removeLayer(routeLayerId);
        }
        if (mapInstance.getSource && mapInstance.getSource(routeSourceId)) {
            mapInstance.removeSource(routeSourceId);
        }
        // Fetch new route
        const response = await fetch(`https://api.olamaps.io/routing/v1/directions?origin=${origin.latitude}%2C${origin.longitude}&destination=${destination.latitude}%2C${destination.longitude}&api_key=LZ9q8is5UNlRpphGqeGSH7fPK8uqWgOeb76reivs`, { method: "POST" });
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const overviewPolyline = data.routes[0].overview_polyline;
            const coordinates = decodePolyline(overviewPolyline);
            mapInstance.addSource(routeSourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                    },
                },
            });
            mapInstance.addLayer({
                id: routeLayerId,
                type: 'line',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                source: routeSourceId,
                paint: {
                    'line-color': 'rgb(59 130 246)',
                    'line-width': 6,
                },
            });
            if (data.routes[0].legs && data.routes[0].legs.length > 0) {
                setDistance((data.routes[0].legs[0].distance / 1000).toFixed(2));
            }
        }
    };


    const completeOrder = async () => {
        // If payment_mode is COD, show confirmation popup
        if (payment_mode === "COD") {
            showAlertPopup.value = {
                message: "Have you collected payment?",
                buttons: [
                    { label: "Yes, payment collected", value: "yes" },
                    { label: "No", value: "no" }
                ],
                onButtonClick: async (val: string) => {
                    if (val === "yes") {
                        const res = await customRequest('/complete-order', { method: "POST", data: { order_id: orderId } });
                        if (res.status === 200) {
                            setOrderCompleted(true);
                            setTimeout(() => {
                                navigate(-1);
                            }, 3000);
                        } else {
                            showAlertPopup.value = "Something went wrong...";
                        }
                    }
                    // If "no", do nothing
                }
            };
        } else {
            // Not COD, complete order directly
            const res = await customRequest('/complete-order', { method: "POST", data: { order_id: orderId } });
            if (res.status === 200) {
                setOrderCompleted(true);
                setTimeout(() => {
                    navigate(-1);
                }, 3000);
            } else {
                showAlertPopup.value = "Something went wrong...";
            }
        }
    };


    // Swipe handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsSwiping(true);
        setSwipeX(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSwiping) return;
        const delta = e.clientX - swipeX;
        if (swipeRef.current) {
            swipeRef.current.style.transform = `translateX(${Math.max(0, delta)}px)`;
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsSwiping(false);
        const delta = e.clientX - swipeX;
        if (swipeRef.current) {
            swipeRef.current.style.transform = '';
        }
        if (delta > 150) {
            completeOrder();
        }
    };


    // Initialize map and destination marker only once
    useEffect(() => {
        try {
            const loc = currentLocation.value as Location | undefined;
            // if (typeof orderLatitude !== "number" || typeof orderLongitude !== "number") {
            //     console.error("Order coordinates missing");
            //     return;
            // }
            // Ensure map container exists
            const mapDiv = document.getElementById('map');
            console.log("OlaMaps object:", olaMaps);
            console.log("OlaMaps keys:", Object.keys(olaMaps));
            console.log("OlaMaps.init type:", typeof olaMaps.init);
            if (!mapDiv) {
                console.error("Map container div not found");
                return;
            }
            console.log("Map container found:", mapDiv);
            // Use last known location or fallback to order location
            const initialCenter = loc && typeof loc.latitude === "number" && typeof loc.longitude === "number"
                ? [loc.longitude, loc.latitude]
                : [orderLongitude, orderLatitude];
            let myMap;
            try {
                myMap = olaMaps.init({
                    style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json",
                    container: 'map',
                    center: initialCenter,
                    zoom: 15,
                });
                console.log("OlaMaps.init returned:", myMap);
            } catch (e) {
                console.error("OlaMaps.init threw error:", e);
                return;
            }
            mapRef.current = myMap;
            console.log("Map initialized", myMap);

            // Add destination marker
            olaMaps
                .addMarker({ offset: [0, 0], anchor: "bottom" })
                .setLngLat([orderLongitude, orderLatitude])
                .addTo(myMap);

            // Add rider marker if location available
            if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
                const riderCustomMarker = document.createElement('img');
                riderCustomMarker.src = "https://cdn-icons-png.flaticon.com/128/9561/9561688.png";
                riderCustomMarker.alt = "Driver Marker";
                riderCustomMarker.style.width = "40px";
                riderCustomMarker.style.height = "40px";
                const marker = olaMaps
                    .addMarker({ element: riderCustomMarker, offset: [0, 0], anchor: "bottom" })
                    .setLngLat([loc.longitude, loc.latitude])
                    .addTo(myMap);
                riderMarkerRef.current = marker;
                drawOrUpdateRoute(loc, { latitude: orderLatitude, longitude: orderLongitude });
            }
        } catch (err) {
            console.error("Error initializing map:", err);
        }
        // eslint-disable-next-line
    }, []);

    // Update rider marker and polyline when location changes
    useEffect(() => {
        const loc = currentLocation.value as Location | undefined;
        if (!mapRef.current || !loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number" || typeof orderLatitude !== "number" || typeof orderLongitude !== "number") return;
        // updateLocation(loc);
        // Update rider marker position
        if (riderMarkerRef.current && riderMarkerRef.current.setLngLat) {
            riderMarkerRef.current.setLngLat([loc.longitude, loc.latitude]);
        } else {
            // If marker doesn't exist, create it
            const riderCustomMarker = document.createElement('img');
            riderCustomMarker.src = "https://cdn-icons-png.flaticon.com/128/9561/9561688.png";
            riderCustomMarker.alt = "Driver Marker";
            riderCustomMarker.style.width = "40px";
            riderCustomMarker.style.height = "40px";
            const marker = olaMaps
                .addMarker({ element: riderCustomMarker, offset: [0, 0], anchor: "bottom" })
                .setLngLat([loc.longitude, loc.latitude])
                .addTo(mapRef.current);
            riderMarkerRef.current = marker;
        }
        // Update route polyline
        drawOrUpdateRoute(loc, { latitude: orderLatitude, longitude: orderLongitude });
        // eslint-disable-next-line
    }, [currentLocation.value]);

    // Periodically fetch rider's current location every 3 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            getCurrentPosition();
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const updateLocation = async (location: Location | null) => {
        if (!location) return;
        const res = await customRequest('/update-location', { method: "POST", data: { latitude: location.latitude, longitude: location.longitude } });
        console.log(JSON.stringify(res));
    }

    return (
        <div className="h-full w-full relative">
            <AppBar title="Order Delivery Map" onBackPress={true} share={false} />
            {distance && (
                <div className="text-center py-2 text-lg font-semibold text-blue-500 bg-white shadow">
                    Distance to order: {distance} km
                </div>
            )}
            <div
                id="map"
                className='h-[calc(100vh-54px)] w-full'
                style={{ minHeight: 300, minWidth: 300 }}
            ></div>
            {/* Open in Google Maps button and Swipe to complete order button */}
            {/* distance && parseFloat(distance) <= 1500 && */}
            {!orderCompleted && (() => {
                const loc = currentLocation.value as Location | undefined;
                const hasCoords = loc && typeof loc.latitude === "number" && typeof loc.longitude === "number"

                // && typeof orderLatitude === "number" && typeof orderLongitude === "number";
                const googleMapsUrl = hasCoords
                    ? `https://www.google.com/maps/dir/?api=1&origin=${loc.latitude},${loc.longitude}&destination=${orderLatitude},${orderLongitude}&travelmode=driving`
                    : "#";
                return (
                    <div className="fixed bottom-4 left-0 w-full flex flex-col items-center z-50 space-y-2">
                        {hasCoords && (
                            <button
                                className="mb-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-6 py-3 shadow transition"
                                style={{ width: 280 }}
                                onClick={() => window.open(googleMapsUrl, "_blank")}
                            >
                                Open in Google Maps
                            </button>
                        )}
                        <div
                            ref={swipeRef}
                            className="bg-green-500 text-white font-bold rounded-full shadow-lg px-8 py-4 cursor-pointer select-none transition-transform duration-200"
                            style={{ touchAction: 'none', userSelect: 'none', width: 280, textAlign: 'center' }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                        >
                            Swipe to Complete Order
                        </div>
                    </div>
                );
            })()}
            {orderCompleted && (
                <div className="fixed bottom-4 left-0 w-full flex justify-center z-50">
                    <div className="bg-blue-500 text-white font-bold rounded-full shadow-lg px-8 py-4">
                        Order Completed!
                    </div>
                </div>
            )}
        </div>
    )
}

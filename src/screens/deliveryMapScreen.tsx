import React, { useEffect, useRef } from "react";
import sendDataToReactNative from "../utils/nativeCommunication";
import { currentLocation } from "../state/userState";
import { useLocation, useNavigate } from "react-router";
import { customRequest } from "../utils/customRequest";
import { showAlertPopup } from "../state/uiState";
import { loadMultipleLibraries } from "../utils/googleMapsLoader";



type Location = {
    latitude: number;
    longitude: number;
};



export default function DeliveryMapScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, orderLongitude, orderLatitude, payment_mode, riderId } = location.state || {};



    const [distance, setDistance] = React.useState<string | null>(null);
    const [swipeX, setSwipeX] = React.useState(0);
    const [isSwiping, setIsSwiping] = React.useState(false);
    const [orderCompleted, setOrderCompleted] = React.useState(false);

    // ✅ NEW: Track location availability states
    const [isLocationLoading, setIsLocationLoading] = React.useState(true);
    const [locationError, setLocationError] = React.useState<'denied' | 'unavailable' | null>(null);

    const swipeRef = React.useRef<HTMLDivElement>(null);



    // Map container ref
    const mapContainerRef = useRef<HTMLDivElement>(null);



    // Google Maps refs
    const mapRef = React.useRef<google.maps.Map | null>(null);
    const riderMarkerRef = React.useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const destinationMarkerRef = React.useRef<google.maps.marker.AdvancedMarkerElement | null>(null);



    // Haversine distance calculation
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };



    const getCurrentPosition = () => {
        sendDataToReactNative({ action: 'get-current-position' });
    };



    // Generate Google Maps URL for external navigation
    const getGoogleMapsUrl = (riderLoc: Location, orderLoc: Location): string => {
        return `https://www.google.com/maps/dir/?api=1&origin=${riderLoc.latitude},${riderLoc.longitude}&destination=${orderLoc.latitude},${orderLoc.longitude}&travelmode=driving`;
    };

    // Generate Google Maps URL with destination only (fallback when rider location unavailable)
    const getGoogleMapsUrlDestinationOnly = (orderLoc: Location): string => {
        return `https://www.google.com/maps/dir/?api=1&destination=${orderLoc.latitude},${orderLoc.longitude}&travelmode=driving`;
    };



    // Send PiP updates to React Native
    const sendPipUpdate = (status: 'active' | 'cancelled' | 'completed', dist?: string) => {
        sendDataToReactNative({
            action: 'update_pip_status',
            status: status,
            distance: dist || distance || '0.0',
        });
        console.log('📺 PiP Update sent:', status, dist);
    };



    const completeOrder = async () => {
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
                            // Send order completion message to React Native to close floating widget
                            sendDataToReactNative({
                                action: 'order_completed',
                                order_id: orderId
                            });
                            // Send PiP update
                            sendPipUpdate('completed');
                            setTimeout(() => {
                                navigate(-1);
                            }, 3000);
                        } else {
                            showAlertPopup.value = "Something went wrong...";
                        }
                    }
                }
            };
        } else {
            const res = await customRequest('/complete-order', { method: "POST", data: { order_id: orderId } });
            if (res.status === 200) {
                setOrderCompleted(true);
                // Send order completion message to React Native to close floating widget
                sendDataToReactNative({
                    action: 'order_completed',
                    order_id: orderId
                });
                // Send PiP update
                sendPipUpdate('completed');
                setTimeout(() => {
                    navigate(-1);
                }, 3000);
            } else {
                showAlertPopup.value = "Something went wrong...";
            }
        }
    };



    // Swipe handlers (unchanged)
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



    // Initialize Google Map (simplified - no directions)
    useEffect(() => {
        const initializeMap = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 0));



                const mapDiv = mapContainerRef.current;
                if (!mapDiv) {
                    console.warn("Map container not ready, retrying...");
                    setTimeout(() => initializeMap(), 100);
                    return;
                }



                if (!(mapDiv instanceof HTMLElement)) {
                    console.error("Map container is not a valid HTMLElement");
                    return;
                }



                const loc = currentLocation.value as Location | undefined;
                const destLat = Number(orderLatitude);
                const destLng = Number(orderLongitude);



                if (isNaN(destLat) || isNaN(destLng)) {
                    console.error("Invalid destination coordinates:", { orderLatitude, orderLongitude });
                    return;
                }



                // Load Google Maps libraries
                const [{ Map }, { AdvancedMarkerElement }] = await loadMultipleLibraries(['maps', 'marker']);



                const initialCenter = loc && typeof loc.latitude === "number" && typeof loc.longitude === "number"
                    ? { lat: Number(loc.latitude), lng: Number(loc.longitude) }
                    : { lat: destLat, lng: destLng };



                // Simplified map - no directions, no tilt
                const myMap = new Map(mapDiv, {
                    center: initialCenter,
                    zoom: 16,
                    mapId: "DEMO_MAP_ID",
                    disableDefaultUI: true,
                    zoomControl: false,
                    gestureHandling: 'greedy',
                    mapTypeId: 'roadmap',
                });



                mapRef.current = myMap;



                // Wait for map to load
                await new Promise<void>(resolve => {
                    google.maps.event.addListenerOnce(myMap, 'tilesloaded', () => resolve());
                });



                console.log("🗺️ Simplified Google Map initialized");



                // Destination marker (static)
                destinationMarkerRef.current = new AdvancedMarkerElement({
                    map: myMap,
                    position: { lat: destLat, lng: destLng },
                    title: "Delivery Location",
                });



                // Rider marker if location available
                if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
                    const riderLat = Number(loc.latitude);
                    const riderLng = Number(loc.longitude);



                    if (!isNaN(riderLat) && !isNaN(riderLng)) {
                        const riderIcon = document.createElement('div');
                        riderIcon.innerHTML = `
                            <div style="position: relative; width: 24px; height: 24px;">
                                <div style="
                                    position: absolute;
                                    width: 20px;
                                    height: 20px;
                                    background: #4285F4;
                                    border: 4px solid white;
                                    border-radius: 50%;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                    top: 2px;
                                    left: 2px;
                                "></div>
                                <div style="
                                    position: absolute;
                                    width: 0;
                                    height: 0;
                                    border-left: 8px solid transparent;
                                    border-right: 8px solid transparent;
                                    border-bottom: 16px solid #4285F4;
                                    top: -14px;
                                    left: 4px;
                                    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
                                "></div>
                            </div>
                        `;



                        riderMarkerRef.current = new AdvancedMarkerElement({
                            map: myMap,
                            position: { lat: riderLat, lng: riderLng },
                            content: riderIcon,
                            title: "Your Location",
                        });



                        // Update distance
                        const dist = calculateDistance(riderLat, riderLng, destLat, destLng);
                        setDistance(dist.toFixed(1));
                    }
                }



            } catch (err) {
                console.error("Error initializing Google Map:", err);
            }
        };
        initializeMap();
    }, []);



    // Update rider marker and distance when location changes
    useEffect(() => {
        const loc = currentLocation.value as Location | undefined;
        if (!mapRef.current || !loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return;



        const riderLat = Number(loc.latitude);
        const riderLng = Number(loc.longitude);
        const destLat = Number(orderLatitude);
        const destLng = Number(orderLongitude);



        if (isNaN(riderLat) || isNaN(riderLng) || isNaN(destLat) || isNaN(destLng)) return;



        // Update rider marker position
        if (riderMarkerRef.current) {
            riderMarkerRef.current.position = { lat: riderLat, lng: riderLng };
        }



        // Update distance
        const dist = calculateDistance(riderLat, riderLng, destLat, destLng);
        const distanceStr = dist.toFixed(1);
        setDistance(distanceStr);



        // Send update to PiP
        sendPipUpdate('active', distanceStr);



        // Center map between rider and destination
        mapRef.current.setCenter({
            lat: (riderLat + destLat) / 2,
            lng: (riderLng + destLng) / 2
        });



        // Update backend location (your existing endpoint)
        updateLocation(loc);
    }, [currentLocation.value]);



    // ✅ NEW: Request location once on mount so the map and buttons
    // are not stuck waiting for BackgroundLocationService's first watchPosition
    // tick. Clears the loading state when a response (success or error) arrives.
    useEffect(() => {
        setIsLocationLoading(true);
        getCurrentPosition();

        // Fallback: if no location arrives within 10s, stop showing spinner
        const timeout = setTimeout(() => {
            const loc = currentLocation.value as Location | undefined;
            if (!loc || typeof loc.latitude !== 'number') {
                setIsLocationLoading(false);
                setLocationError('unavailable');
            }
        }, 10000);

        return () => clearTimeout(timeout);
    }, []);



    // ✅ REMOVED: setInterval polling every 10s that called getCurrentPosition.
    // BackgroundLocationService.watchPosition is now the single source of location
    // truth. It fires every 10s (or 10m distance), calls /update-location directly,
    // emits 'background_location_update' via DeviceEventEmitter → WebViewScreen
    // forwards it into the WebView as 'update_current_location' → received below.
    // Having both running caused duplicate /update-location API calls.
    //
    // useEffect(() => {
    //     getCurrentPosition();
    //     const interval = setInterval(() => {
    //         getCurrentPosition();
    //     }, 10000);
    //     return () => clearInterval(interval);
    // }, []);



    const updateLocation = async (location: Location | null) => {
        if (!location) return;
        try {
            await customRequest('/update-location', {
                method: "POST",
                data: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            });
        } catch (error) {
            console.error("Failed to update location:", error);
        }
    };



    // Handle "Open in Google Maps" button click
    const handleOpenGoogleMaps = () => {
        const riderLoc = currentLocation.value as Location | undefined;
        const hasRiderLoc = riderLoc &&
            typeof riderLoc.latitude === "number" &&
            typeof riderLoc.longitude === "number";

        // ✅ NEW: If location is denied, prompt rider to enable it in settings
        if (locationError === 'denied') {
            showAlertPopup.value = {
                message: "Location permission is required for navigation. Please enable it in your device settings.",
                buttons: [
                    { label: "Cancel", value: "cancel" },
                    { label: "Open Settings", value: "settings" },
                ],
                onButtonClick: (val: string) => {
                    if (val === "settings") {
                        sendDataToReactNative({ action: 'open-settings' });
                    }
                }
            };
            return;
        }

        // ✅ NEW: If location is still loading or unavailable, open Google Maps
        // with destination only so rider can still navigate without origin pin.
        if (!hasRiderLoc) {
            console.warn("Rider location unavailable — opening Google Maps with destination only");
            sendDataToReactNative({
                action: 'open-google-maps-with-widget',
                order_id: orderId,
                order_latitude: orderLatitude,
                order_longitude: orderLongitude,
                google_maps_url: getGoogleMapsUrlDestinationOnly({
                    latitude: orderLatitude,
                    longitude: orderLongitude
                })
            });
            return;
        }

        const googleMapsUrl = getGoogleMapsUrl(riderLoc, {
            latitude: orderLatitude,
            longitude: orderLongitude
        });

        // Send message to React Native to show PiP and open Google Maps
        sendDataToReactNative({
            action: 'open-google-maps-with-widget',
            order_id: orderId,
            order_latitude: orderLatitude,
            order_longitude: orderLongitude,
            google_maps_url: googleMapsUrl
        });
    };



    // Listen for location updates from React Native when app is in background with floating widget.
    // BackgroundLocationService → DeviceEventEmitter → WebViewScreen.sendDataToWebView
    // → this handler → updates currentLocation signal → triggers map marker useEffect above.
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;


                if (data.action === 'update_current_location') {
                    // Update currentLocation state with location from background tracking
                    currentLocation.value = data.location;
                    // ✅ Clear loading/error state on first successful location
                    setIsLocationLoading(false);
                    setLocationError(null);
                    console.log('📍 Background location update received:', data.location);
                }

                // ✅ NEW: Handle location errors from React Native
                if (data.action === 'current_position') {
                    currentLocation.value = data.position;
                    setIsLocationLoading(false);
                    setLocationError(null);
                }

                if (data.action === 'current_position_error') {
                    console.warn('📍 Location error from RN:', data.error);
                    setIsLocationLoading(false);
                    if (data.error?.toLowerCase().includes('denied') ||
                        data.error?.toLowerCase().includes('blocked') ||
                        data.error?.toLowerCase().includes('permission')) {
                        setLocationError('denied');
                    } else {
                        setLocationError('unavailable');
                    }
                }

                // Listen for order cancellation from backend
                if (data.action === 'order_cancelled' && data.order_id === orderId) {
                    console.log('❌ Order cancelled by customer');
                    sendPipUpdate('cancelled');
                    showAlertPopup.value = "Order has been cancelled by the customer!";
                }
            } catch (error) {
                // Not a JSON message or different format, ignore
            }
        };


        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [orderId]);



    // Derived location state
    const riderLoc = currentLocation.value as Location | undefined;
    const hasRiderLocation = riderLoc &&
        typeof riderLoc.latitude === "number" &&
        typeof riderLoc.longitude === "number";
    console.log('Order data', JSON.stringify(location.state));
    console.log('Rider Location', JSON.stringify(riderLoc));
    const hasOrderLocation = typeof orderLatitude === "number" && typeof orderLongitude === "number";



    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>



            {/* Distance Display */}
            {distance && (
                <div className="absolute top-4 right-4 z-20 bg-white rounded-xl shadow-lg px-6 py-3">
                    <div className="text-2xl font-bold text-blue-600">{distance} km</div>
                    <div className="text-xs text-gray-500">Distance to delivery</div>
                </div>
            )}



            {/* Map Container */}
            <div
                ref={mapContainerRef}
                className='absolute inset-0 w-full h-full'
            />



            {/* ✅ FIXED: Buttons now always visible when order not completed
                and order location is available. hasRiderLocation no longer
                gates visibility — location state is handled inside the buttons. */}
            {!orderCompleted && hasOrderLocation && (
                <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center space-y-3 px-4">

                    {/* ✅ NEW: Location status banner — shown above buttons */}
                    {isLocationLoading && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 flex items-center space-x-2 w-full max-w-sm">
                            <svg className="animate-spin w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <span className="text-yellow-700 text-sm">Getting your location...</span>
                        </div>
                    )}

                    {!isLocationLoading && locationError === 'denied' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center justify-between w-full max-w-sm">
                            <span className="text-red-700 text-sm">📍 Location permission denied</span>
                            <button
                                onClick={() => sendDataToReactNative({ action: 'get-current-position' })}
                                className="text-red-600 font-semibold text-sm underline ml-2"
                            >
                                Enable
                            </button>
                        </div>
                    )}

                    {!isLocationLoading && locationError === 'unavailable' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 flex items-center justify-between w-full max-w-sm">
                            <span className="text-orange-700 text-sm">📍 Location unavailable</span>
                            <button
                                onClick={() => {
                                    setIsLocationLoading(true);
                                    setLocationError(null);
                                    getCurrentPosition();
                                }}
                                className="text-orange-600 font-semibold text-sm underline ml-2"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Open Google Maps Button */}
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-8 py-4 shadow-xl transition w-full max-w-sm"
                        onClick={handleOpenGoogleMaps}
                    >
                        {!hasRiderLocation
                            ? "Open in Google Maps (No GPS)"
                            : "Open in Google Maps"
                        }
                    </button>



                    {/* Swipe to Complete */}
                    <div
                        ref={swipeRef}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-xl px-8 py-4 cursor-pointer select-none transition-all w-full max-w-sm text-center"
                        style={{ touchAction: 'none', userSelect: 'none' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    >
                        Swipe to Complete Order →
                    </div>
                </div>
            )}



            {/* Order Completed */}
            {orderCompleted && (
                <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center">
                    <div className="bg-blue-600 text-white font-bold rounded-full shadow-2xl px-8 py-4">
                        Order Completed! ✅
                    </div>
                </div>
            )}
        </div>
    );
}

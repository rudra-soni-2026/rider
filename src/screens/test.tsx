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

export default function DeliveryMapScreenTest() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, orderLongitude, orderLatitude, payment_mode } = location.state || {};

    const [distance, setDistance] = React.useState<string | null>(null);
    const [duration, setDuration] = React.useState<string | null>(null);
    const [nextInstruction, setNextInstruction] = React.useState<string>("");
    const [currentStepDistance, setCurrentStepDistance] = React.useState<string>("");
    const [swipeX, setSwipeX] = React.useState(0);
    const [isSwiping, setIsSwiping] = React.useState(false);
    const [orderCompleted, setOrderCompleted] = React.useState(false);
    const swipeRef = React.useRef<HTMLDivElement>(null);

    // Map container ref - CRITICAL FIX
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Refs for Google Maps
    const mapRef = React.useRef<google.maps.Map | null>(null);
    const riderMarkerRef = React.useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const destinationMarkerRef = React.useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const directionsServiceRef = React.useRef<google.maps.DirectionsService | null>(null);
    const directionsRendererRef = React.useRef<google.maps.DirectionsRenderer | null>(null);

    // Route caching and optimization refs
    const routeCacheRef = React.useRef(new Map());
    const lastRouteFetchRef = React.useRef({ riderLat: null as number | null, riderLng: null as number | null });
    const currentRouteStepsRef = React.useRef<google.maps.DirectionsStep[]>([]);
    const currentStepIndexRef = React.useRef<number>(0);
    const lastHeadingRef = React.useRef<number>(0);
    const locationUpdateIntervalRef = React.useRef<number | null>(null);

    const getCurrentPosition = () => {
        sendDataToReactNative({ action: 'get-current-position' });
    };

    // Calculate distance between two points using Haversine formula
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

    // Calculate bearing (heading) between two points
    const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const dLon = ((lng2 - lng1) * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
        const x =
            Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
            Math.sin((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.cos(dLon);
        let bearing = Math.atan2(y, x) * (180 / Math.PI);
        return (bearing + 360) % 360;
    };

    // Smooth camera update with rotation
    const updateCameraPosition = (lat: number, lng: number, newHeading: number) => {
        if (!mapRef.current) return;

        // Interpolate heading to avoid sudden spins
        let heading = newHeading;
        const lastHeading = lastHeadingRef.current;
        const headingDiff = ((heading - lastHeading + 540) % 360) - 180;

        // Smooth heading transition (max 30° change per update)
        if (Math.abs(headingDiff) > 30) {
            heading = lastHeading + (headingDiff > 0 ? 30 : -30);
        }

        lastHeadingRef.current = heading;

        // Smooth camera movement
        mapRef.current.moveCamera({
            center: { lat, lng },
            zoom: 18,
            heading: heading,
            tilt: 45,
        });
    };

    // Update navigation instructions based on current position
    const updateNavigationInstructions = (steps: google.maps.DirectionsStep[], currentLat: number, currentLng: number) => {
        if (!steps || steps.length === 0) return;

        // Find the closest step to current position
        let closestStepIndex = 0;
        let minDistance = Infinity;

        steps.forEach((step, index) => {
            const stepLat = step.start_location.lat();
            const stepLng = step.start_location.lng();
            const dist = calculateDistance(currentLat, currentLng, stepLat, stepLng);

            if (dist < minDistance) {
                minDistance = dist;
                closestStepIndex = index;
            }
        });

        // If we're close to end of step, move to next
        if (closestStepIndex < steps.length - 1) {
            const currentStep = steps[closestStepIndex];
            const endLat = currentStep.end_location.lat();
            const endLng = currentStep.end_location.lng();
            const distToEnd = calculateDistance(currentLat, currentLng, endLat, endLng);

            if (distToEnd < 0.05) { // Within 50 meters
                closestStepIndex++;
            }
        }

        currentStepIndexRef.current = closestStepIndex;
        const currentStep = steps[closestStepIndex];

        // Extract instruction text (remove HTML tags)
        const instruction = currentStep.instructions.replace(/<[^>]*>/g, '');
        setNextInstruction(instruction);

        // Set distance for this step
        if (currentStep.distance) {
            const distInMeters = currentStep.distance.value;
            if (distInMeters < 1000) {
                setCurrentStepDistance(`${Math.round(distInMeters)} m`);
            } else {
                setCurrentStepDistance(`${(distInMeters / 1000).toFixed(1)} km`);
            }
        }
    };

    // Cost-optimized route fetching with caching
    const drawOrUpdateRoute = async (origin: Location, destination: Location) => {
        if (!mapRef.current || !directionsServiceRef.current || !directionsRendererRef.current) return;

        // Round coordinates to ~100m precision for caching
        const roundedOriginLat = Number(origin.latitude.toFixed(3));
        const roundedOriginLng = Number(origin.longitude.toFixed(3));
        const roundedDestLat = Number(destination.latitude.toFixed(4));
        const roundedDestLng = Number(destination.longitude.toFixed(4));

        // Check if route needs updating (>100m change)
        const lastFetch = lastRouteFetchRef.current;
        if (
            lastFetch.riderLat === roundedOriginLat &&
            lastFetch.riderLng === roundedOriginLng
        ) {
            console.log("📍 Using existing route (rider moved <100m)");
            return;
        }

        // Create cache key
        const cacheKey = `${roundedOriginLat}_${roundedOriginLng}_${roundedDestLat}_${roundedDestLng}`;

        // Check cache (10-minute validity)
        const cachedRoute = routeCacheRef.current.get(cacheKey);
        if (cachedRoute && Date.now() - cachedRoute.timestamp < 600000) {
            console.log("✅ Using cached route");
            directionsRendererRef.current.setDirections(cachedRoute.response);

            if (cachedRoute.response.routes[0]?.legs[0]) {
                const leg = cachedRoute.response.routes[0].legs[0];
                if (leg.distance) {
                    setDistance((leg.distance.value / 1000).toFixed(1));
                }
                if (leg.duration) {
                    setDuration(leg.duration.text);
                }
                if (leg.steps) {
                    currentRouteStepsRef.current = leg.steps;
                    updateNavigationInstructions(leg.steps, origin.latitude, origin.longitude);
                }
            }

            lastRouteFetchRef.current = {
                riderLat: roundedOriginLat,
                riderLng: roundedOriginLng,
            };
            return;
        }

        // Fetch new route from Google Maps API
        console.log("🌐 Fetching new route from Google Maps API");

        try {
            const request: google.maps.DirectionsRequest = {
                origin: { lat: origin.latitude, lng: origin.longitude },
                destination: { lat: destination.latitude, lng: destination.longitude },
                travelMode: google.maps.TravelMode.DRIVING,
            };

            directionsServiceRef.current.route(request, (response, status) => {
                if (status === google.maps.DirectionsStatus.OK && response) {
                    directionsRendererRef.current?.setDirections(response);

                    // Extract distance, duration, and steps
                    const leg = response.routes[0]?.legs[0];
                    if (leg) {
                        if (leg.distance) {
                            setDistance((leg.distance.value / 1000).toFixed(1));
                        }
                        if (leg.duration) {
                            setDuration(leg.duration.text);
                        }
                        if (leg.steps) {
                            currentRouteStepsRef.current = leg.steps;
                            updateNavigationInstructions(leg.steps, origin.latitude, origin.longitude);
                        }
                    }

                    // Cache the response
                    routeCacheRef.current.set(cacheKey, {
                        response: response,
                        timestamp: Date.now(),
                    });

                    // Update last fetch tracker
                    lastRouteFetchRef.current = {
                        riderLat: roundedOriginLat,
                        riderLng: roundedOriginLng,
                    };

                    // Limit cache size (FIFO eviction)
                    if (routeCacheRef.current.size > 50) {
                        const firstKey = routeCacheRef.current.keys().next().value;
                        routeCacheRef.current.delete(firstKey);
                    }

                    console.log(`✅ Route fetched - Distance: ${(leg?.distance?.value || 0) / 1000} km, ETA: ${leg?.duration?.text}`);
                } else {
                    console.warn('Directions request failed:', status);
                }
            });
        } catch (error) {
            console.error('Error fetching route:', error);
        }
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

    // Initialize Google Map
    useEffect(() => {
        const initializeMap = async () => {
            try {
                // CRITICAL FIX: Wait for next tick to ensure DOM is fully rendered
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

                // Validate coordinates FIRST
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

                // Initialize map - ref is now guaranteed to be attached
                const myMap = new Map(mapDiv, {
                    center: initialCenter,
                    zoom: 18,
                    mapId: "DEMO_MAP_ID",
                    disableDefaultUI: true,
                    zoomControl: false,
                    gestureHandling: 'greedy',
                    heading: 0,
                    tilt: 45,
                    mapTypeId: 'roadmap',
                });

                mapRef.current = myMap;

                // Wait for map to be fully ready
                await new Promise<void>(resolve => {
                    google.maps.event.addListenerOnce(myMap, 'tilesloaded', () => resolve());
                });

                console.log("🗺️ Google Map initialized");

                // Initialize DirectionsService and Renderer
                directionsServiceRef.current = new google.maps.DirectionsService();
                directionsRendererRef.current = new google.maps.DirectionsRenderer({
                    map: myMap,
                    suppressMarkers: true,
                    suppressInfoWindows: true,
                    suppressBicyclingLayer: true,
                    polylineOptions: {
                        strokeColor: '#4285F4',
                        strokeOpacity: 0.9,
                        strokeWeight: 8,
                    },
                });

                // Create destination marker
                destinationMarkerRef.current = new AdvancedMarkerElement({
                    map: myMap,
                    position: { lat: destLat, lng: destLng },
                    title: "Delivery Location",
                });

                // Add rider marker if location available
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

                        // Draw initial route
                        await drawOrUpdateRoute(loc, { latitude: destLat, longitude: destLng });
                    }
                }

                console.log("📍 Markers added and route drawn");
            } catch (err) {
                console.error("Error initializing Google Map:", err);
            }
        };

        initializeMap();
        // eslint-disable-next-line
    }, []);

    // Update rider marker and route when location changes
    useEffect(() => {
        const loc = currentLocation.value as Location | undefined;
        if (!mapRef.current || !loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return;

        const prevLoc = lastRouteFetchRef.current;

        // Calculate heading if we have previous location
        let heading = lastHeadingRef.current;
        if (prevLoc.riderLat && prevLoc.riderLng) {
            heading = calculateBearing(prevLoc.riderLat, prevLoc.riderLng, loc.latitude, loc.longitude);
        }

        // Update camera position with smooth rotation
        updateCameraPosition(loc.latitude, loc.longitude, heading);

        // Update or create rider marker
        if (riderMarkerRef.current) {
            const riderLat = Number(loc.latitude);
            const riderLng = Number(loc.longitude);

            if (!isNaN(riderLat) && !isNaN(riderLng)) {
                riderMarkerRef.current.position = { lat: riderLat, lng: riderLng };
            }
        } else {
            // Create marker if doesn't exist
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

                (async () => {
                    const [{ AdvancedMarkerElement }] = await loadMultipleLibraries(['marker']);
                    riderMarkerRef.current = new AdvancedMarkerElement({
                        map: mapRef.current!,
                        position: { lat: riderLat, lng: riderLng },
                        content: riderIcon,
                        title: "Your Location",
                    });
                })();
            }
        }

        // Update route (with caching)
        const destLat = Number(orderLatitude);
        const destLng = Number(orderLongitude);

        if (!isNaN(destLat) && !isNaN(destLng)) {
            drawOrUpdateRoute(loc, { latitude: destLat, longitude: destLng });
        }

        // Update navigation instructions
        if (currentRouteStepsRef.current.length > 0) {
            updateNavigationInstructions(currentRouteStepsRef.current, loc.latitude, loc.longitude);
        }

        // Update backend location (throttled)
        updateLocation(loc);
        // eslint-disable-next-line
    }, [currentLocation.value]);

    // Periodically fetch rider's current location
    useEffect(() => {
        // Initial fetch
        getCurrentPosition();

        // Set up interval for subsequent fetches
        locationUpdateIntervalRef.current = window.setInterval(() => {
            getCurrentPosition();
        }, 5000); // Every 5 seconds for smooth updates

        return () => {
            if (locationUpdateIntervalRef.current) {
                clearInterval(locationUpdateIntervalRef.current);
            }
        };
    }, []);

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

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
            {/* Navigation Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation Instruction Card */}
            {nextInstruction && (
                <div className="absolute top-20 left-4 right-4 z-20 bg-white rounded-2xl shadow-2xl p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                {currentStepDistance}
                            </div>
                            <div className="text-base text-gray-700 leading-snug">
                                {nextInstruction}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ETA and Distance Bar */}
            <div className="absolute top-4 right-4 z-20 bg-white rounded-xl shadow-lg px-4 py-2">
                <div className="flex items-center gap-3">
                    {duration && (
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{duration}</div>
                            <div className="text-xs text-gray-500">ETA</div>
                        </div>
                    )}
                    {distance && (
                        <div className="text-center border-l border-gray-200 pl-3">
                            <div className="text-lg font-bold text-blue-600">{distance} km</div>
                            <div className="text-xs text-gray-500">Distance</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Container - Full Screen - USE REF INSTEAD OF ID */}
            <div
                ref={mapContainerRef}
                className='absolute inset-0 w-full h-full'
            ></div>

            {/* Bottom Complete Order Button */}
            {!orderCompleted && (
                <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center px-4">
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

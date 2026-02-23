// googleMapsLoader.ts

// Type definitions for Google Maps bootstrap loader config
interface GoogleMapsConfig {
    key: string;
    v: string;
}

// Type definitions for address components
export interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

// Type definitions for geocoding result
export interface GeocodeResult {
    formatted_address: string;
    address_components: AddressComponent[];
}

// Type definitions for place details
export interface PlaceDetails {
    geometry?: google.maps.places.PlaceGeometry;
    formatted_address?: string;
    address_components?: google.maps.GeocoderAddressComponent[];
    name?: string;
}

// Initialize Google Maps with inline bootstrap loader
const initializeGoogleMaps = (() => {
    let initialized = false;

    return (): void => {
        if (initialized) return;
        initialized = true;

        // Inline bootstrap loader
        ((g: GoogleMapsConfig) => {
            let h: Promise<void> | undefined;
            let a: HTMLScriptElement;
            let k: string;
            const p = "The Google Maps JavaScript API";
            const c = "google";
            const l = "importLibrary";
            const q = "__ib__";
            const m = document;
            const b = window as any;

            b[c] = b[c] || {};
            const d = b[c].maps || (b[c].maps = {});
            const r = new Set<string>();
            const e = new URLSearchParams();

            const u = (): Promise<void> => {
                if (h) return h;

                h = new Promise(async (f, n) => {
                    a = m.createElement("script");
                    e.set("libraries", [...r].join(","));

                    for (k in g) {
                        e.set(
                            k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()),
                            (g as any)[k]
                        );
                    }

                    e.set("callback", c + ".maps." + q);
                    a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
                    d[q] = f;
                    a.onerror = () => n(Error(p + " could not load."));
                    a.nonce = (m.querySelector("script[nonce]") as HTMLScriptElement)?.nonce || "";
                    m.head.append(a);
                });

                return h;
            };

            if (d[l]) {
                console.warn(p + " only loads once. Ignoring:", g);
            } else {
                d[l] = (f: string, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n));
            }
        })({
            key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
            v: "weekly"
        });
    };
})();


// Initialize on first import
initializeGoogleMaps();

/**
 * Load a single Google Maps library
 * @param library - Library name to load (e.g., 'places', 'maps', 'marker')
 * @returns Promise that resolves with the library object
 */
export async function loadGoogleMapsLibrary<T = any>(library: string): Promise<T>;

/**
 * Load multiple Google Maps libraries
 * @param libraries - Array of library names to load
 * @returns Promise that resolves with array of library objects
 */
export async function loadGoogleMapsLibrary<T = any>(libraries: string[]): Promise<T[]>;

/**
 * Implementation
 */
export async function loadGoogleMapsLibrary<T = any>(
    libraries: string | string[]
): Promise<T | T[]> {
    try {
        // Handle single library
        if (typeof libraries === 'string') {
            return await google.maps.importLibrary(libraries) as T;
        }

        // Handle multiple libraries
        if (Array.isArray(libraries)) {
            return await Promise.all(
                libraries.map(lib => google.maps.importLibrary(lib))
            ) as T[];
        }

        throw new Error('Invalid library parameter. Expected string or array of strings.');
    } catch (error) {
        console.error('Failed to load Google Maps library:', error);
        throw error;
    }
}

/**
 * Load Google Maps Places library
 * @returns Promise resolving to Places library
 */
export const loadPlacesLibrary = async (): Promise<google.maps.PlacesLibrary> => {
    return await loadGoogleMapsLibrary('places');
};

/**
 * Load Google Maps Core library
 * @returns Promise resolving to Maps library
 */
export const loadMapsLibrary = async (): Promise<google.maps.MapsLibrary> => {
    return await loadGoogleMapsLibrary('maps');
};

/**
 * Load Google Maps Marker library
 * @returns Promise resolving to Marker library
 */
export const loadMarkerLibrary = async (): Promise<google.maps.MarkerLibrary> => {
    return await loadGoogleMapsLibrary('marker');
};

/**
 * Load multiple libraries concurrently
 * @param libraryNames - Array of library names
 * @returns Promise resolving to array of library objects
 */
export const loadMultipleLibraries = async (
    libraryNames: string[]
): Promise<any[]> => {
    return await loadGoogleMapsLibrary(libraryNames);
};

/**
 * Reverse geocode coordinates to get formatted address with address components
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise that resolves with address data
 */
export const reverseGeocode = async (
    lat: number,
    lng: number
): Promise<GeocodeResult> => {
    try {
        const { Geocoder } = await loadGoogleMapsLibrary<{ Geocoder: typeof google.maps.Geocoder }>('geocoding');
        const geocoder = new Geocoder();

        const response = await geocoder.geocode({
            location: { lat, lng }
        });

        if (response.results && response.results[0]) {
            return {
                formatted_address: response.results[0].formatted_address,
                address_components: response.results[0].address_components
            };
        } else {
            throw new Error('No results found for the given coordinates');
        }
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        throw error;
    }
};

/**
 * Get place autocomplete predictions
 * @param input - Search input text
 * @returns Promise that resolves with predictions array
 */
export const getAutocompletePredictions = async (
    input: string
): Promise<google.maps.places.AutocompletePrediction[]> => {
    try {
        const { AutocompleteService } = await loadGoogleMapsLibrary<{
            AutocompleteService: typeof google.maps.places.AutocompleteService
        }>('places');

        const service = new AutocompleteService();
        const response = await service.getPlacePredictions({ input });

        return response.predictions || [];
    } catch (error) {
        console.error('Autocomplete predictions failed:', error);
        return [];
    }
};

/**
 * Get place details by place_id
 * @param placeId - Google Place ID
 * @returns Promise that resolves with place details
 */
export const getPlaceDetails = async (
    placeId: string
): Promise<PlaceDetails> => {
    try {
        const { PlacesService } = await loadGoogleMapsLibrary<{
            PlacesService: typeof google.maps.places.PlacesService
        }>('places');

        // PlacesService requires a map or div element
        const div = document.createElement('div');
        const service = new PlacesService(div);

        return new Promise<PlaceDetails>((resolve, reject) => {
            service.getDetails(
                {
                    placeId: placeId,
                    fields: ['geometry', 'formatted_address', 'address_components', 'name']
                },
                (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                        resolve(place as PlaceDetails);
                    } else {
                        reject(new Error(`Place details request failed: ${status}`));
                    }
                }
            );
        });
    } catch (error) {
        console.error('Get place details failed:', error);
        throw error;
    }
};

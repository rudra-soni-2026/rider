import { Signal, signal } from "@preact/signals-react";

export interface SupportResource {
    title: string;
    type: string;
    url: string;
}

export interface UserProfile {
    // Define the structure of the profile object if known, else use any
    [key: string]: any;
}

export interface LoggedInUserData {
    id: string;
    phone: string;
    code: string;
    profile: UserProfile;
    rating: number;
    store_name: string | null;
    fleet_coach: string;
    referral_bonus: number;
    support: SupportResource[];
    knowledge_resources: SupportResource[];
    // Add any other fields as needed
}

export const loggedInUser: Signal<LoggedInUserData | null> = signal(null);

export const pocketData: Signal<unknown> = signal(null);

export const availableRidesData: Signal<any[]> = signal([]);

export const currentLocation: Signal<any> = signal(null);

export const qrCodeScanResult: Signal<string | null> = signal(null);

export const riderInfoData: Signal<LoggedInUserData | null> = signal(null);

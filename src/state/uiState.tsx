import { Signal, signal } from "@preact/signals-react";


export const currentSelectedBottomTabIndex: Signal<number> = signal(1)

export const availableForRide: Signal<boolean> = signal(false);
export const showAlertPopup: Signal<unknown> = signal(null);
export const showAlertPopupImage: Signal<unknown> = signal(null);
export const showAlertPopupTitle: Signal<unknown> = signal(null);

export const appStatusBarHeight: Signal<unknown> = signal(37); 

export const paymentSuccessCaptured: Signal<unknown> = signal(null);

import secureLocalStorage from "react-secure-storage";
import { currentLocation, loggedInUser, qrCodeScanResult } from "../state/userState";
import { appStatusBarHeight, availableForRide, paymentSuccessCaptured } from "../state/uiState";
import { customRequest } from "./customRequest";

export default function sendDataToReactNative(data: any) {
    try {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
    } catch (error) {

    }
}

export const handleDataReceiveFromReactNative = async (data: any) => {
    if (data.action === "current_position") {
        currentLocation.value = data.position;
        await customRequest('/update-location', { method: "POST", data: { latitude: data.position.latitude, longitude: data.position.longitude } });
    } else if (data.action === "qr-code-result") {
        qrCodeScanResult.value = data.result;
    } else if (data.action === "get-key-value" && data.key === "available_for_ride") {
        availableForRide.value = data.value === "Yes";
    } else if (data.action === "get-key-value" && data.key === "token") {
        secureLocalStorage.setItem("key", data.value)
    } else if (data.action === "get-key-value" && data.key === "user") {
        const user = JSON.parse(data.value)
        secureLocalStorage.setItem('user', user);
        loggedInUser.value = user;

        console.log(loggedInUser.value);

    } else if (data.action === "get-key-value") {
        secureLocalStorage.setItem(data.key, data.value);
    } else if (data.action === "handle-app-type") {
        // isApp.value = data.app;

        appStatusBarHeight.value = data.statusBarHeight;
        if (data.statusBarHeight) {
            document.documentElement.style.setProperty('--status-bar-size', data.statusBarHeight + "px");
        } else {
            document.documentElement.style.setProperty('--status-bar-size', "37px")
        }
    } else if (data.action === "payment_success") {
        paymentSuccessCaptured.value = data
    }
    console.log('Data received from React Native:', data);
}
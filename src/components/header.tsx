import React from "react";
import { useNavigate } from "react-router";
import { customRequest } from "../utils/customRequest";
import sendDataToReactNative from "../utils/nativeCommunication";
import { availableForRide } from "../state/uiState";

export const AppHeader: React.FC = () => {
    const navigate = useNavigate();

    const updateStatus = async (status: boolean) => {
        const res = await customRequest('/change-status', { method: "POST", data: { online: status } });
        if (res.status === 200) {
            sendDataToReactNative({
                action: "show-toast",
                message: res.data.message
            })
        }
    }

    const changeStatus = async () => {
        availableForRide.value = !availableForRide.value;

        sendDataToReactNative({
            action: 'store-key-value',
            key: "available_for_ride",
            value: availableForRide.value ? "Yes" : "No"
        })

        updateStatus(availableForRide.value);
    }


    return (
        <div className="flex flex-col bg-white">
            {/* Status bar spacer supporting safe areas */}
            <div className="h-[env(safe-area-inset-top,var(--status-bar-size,0px))]"></div>

            <div className="z-10 flex justify-between items-center py-2.5 px-4 shadow-sm">
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={availableForRide.value}
                        onChange={changeStatus}
                    />
                    <div className={`w-16 h-8 rounded-full relative flex items-center px-1.5 transition-colors duration-300 ${availableForRide.value ? "bg-blue-500" : "bg-gray-300"}`}>
                        <span
                            className={`absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-sm transition-transform duration-300 ${availableForRide.value ? "translate-x-8" : "translate-x-0"}`}
                        ></span>
                        <span className={`text-[10px] font-bold z-10 uppercase tracking-tighter ${availableForRide.value ? "text-white ml-0" : "ml-auto text-gray-600"}`}>
                            {availableForRide.value ? "Online" : "Offline"}
                        </span>
                    </div>
                </label>
                <div className="flex items-center space-x-3">
                    <img
                        src="https://cdn-icons-png.flaticon.com/128/1999/1999625.png"
                        className="w-10 h-10 rounded-full border border-gray-100 shadow-sm active:scale-95 transition"
                        alt="profile"
                        onClick={() => { navigate("/profile") }}
                    />
                </div>
            </div>
        </div>
    )
}
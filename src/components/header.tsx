import { Siren } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { customRequest } from "../utils/customRequest";
import sendDataToReactNative from "../utils/nativeCommunication";
import { availableForRide } from "../state/uiState";

export const AppHeader: React.FC = () => {
    const navigate = useNavigate();

    const updateStatus = async (status) => {
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
        <div className="flex flex-col">
            <div className="bg-white h-[var(--status-bar-size)]"></div>

            <div className="z-10 bg-white flex justify-between items-center py-2 px-3  shadow-xs">
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={availableForRide.value}
                        onChange={changeStatus}
                    />
                    <div className={`w-19 h-8 rounded-full relative flex items-center px-1 ${availableForRide.value ? "bg-blue-500" : "bg-gray-200"}`}>
                        <span
                            className={`absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full transition-transform ${availableForRide.value ? "translate-x-11" : ""}`}
                        ></span>
                        <span className={`text-xs font-medium z-10 ml-1 mr-1 ${availableForRide.value ? "text-white mr-auto" : "ml-auto text-gray-500"}`}>
                            {availableForRide.value ? "Online" : "Offline"}
                        </span>
                    </div>
                </label>
                <div className="flex items-center space-x-2">
                    {/* <div className="bg-red-500 w-7 h-7 rounded-full text-white text-xs flex items-center justify-center"><Siren size={16} /></div> */}
                    <img src="https://cdn-icons-png.flaticon.com/128/1999/1999625.png" className="w-10 h-10 rounded-full" alt="profile" onClick={() => { navigate("/profile") }} />
                </div>
            </div>

        </div>
    )
}
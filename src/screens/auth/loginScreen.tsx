import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BeatLoader } from "react-spinners";
import { secondaryPrimary } from "../../consts/colors";
import { showAlertPopup } from "../../state/uiState";
import { customRequest } from "../../utils/customRequest";
import sendDataToReactNative from "../../utils/nativeCommunication";

const LoginScreen = () => {
    const navigate = useNavigate();
    const [sendingOtp, setSendingOtp] = useState(false);
    const [phone, setPhone] = useState<string | null>(null);

    useEffect(() => {
        sendDataToReactNative({ action: 'changeStatusBarColor', color: secondaryPrimary, translucent: true, dark: true })
    }, []);

    const handleSendOtp = async () => {
        if (!sendingOtp) {
            setSendingOtp(true);
            if (!phone || (phone ?? '').trim().length !== 10) {
                showAlertPopup.value = "Please enter a valid 10-digit phone number";
                setSendingOtp(false);
                return;
            }

            const res = await customRequest(
                "/auth/send-otp",
                {
                    method: "POST",
                    data: {
                        phone: phone,
                        role: 'delivery-partner',
                        'type': 'delivery-partner',
                    },
                });
            if (res.status === 200) {
                setSendingOtp(false);
                navigate(`/otp-verification?phone=${phone}`);
                sendDataToReactNative({ action: 'changeStatusBarColor', color: secondaryPrimary, dark: true, translucent: true })
            } else {
                setSendingOtp(false);
                showAlertPopup.value = res.error.message
            }
        }
    }

    return (
        <div className="min-h-screen sm:min-h-auto w-full flex flex-col items-center relative overflow-hidden bg-[#effffe]">
            <div className="h-[37px]"></div>

            <div className="absolute top-0 left-0 right-0 bottom-0">
                <img src={require("../../assets/img/login_screen.png")} className="w-full  object-contain" />
            </div>


            <div className="w-full mt-84 px-6 sm:py-20 py-3 flex flex-col items-center relative">
                <div className="rounded-full mb-2">
                    <img src={require("../../assets/img/logo-black.png")} className="h-16 w-auto object-cover" />
                </div>

                <h1 className="text-[22px] font-bold text-center text-gray-800 mb-1">
                    India's Quickest App
                </h1>
                <p className="text-sm text-gray-500 mb-6">Delivery boy login</p>

                <div className="flex items-center w-full max-w-md border border-gray-300 rounded-lg bg-white overflow-hidden mb-4">
                    <span className="px-4 py-3 text-gray-700 font-semibold border-r border-gray-300">
                        +91
                    </span>
                    <input
                        onInput={(e) => { setPhone(e.target.value) }}
                        type="tel"
                        placeholder="Enter mobile number"
                        className="w-full px-4 py-3 text-sm outline-none"
                        maxLength={10}
                    />
                </div>

                <button className="flex items-center justify-center w-full max-w-md bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold mb-3" onClick={handleSendOtp}>

                    {
                        sendingOtp ?
                            <BeatLoader color="white" size={22} />
                            :
                            "Continue"
                    }
                </button>


                <div className="bottom-0 text-center text-[11px] text-gray-400 px-6 z-10">
                    By continuing, you agree to our{" "}
                    <span className="underline">Terms of service</span> &{" "}
                    <span className="underline">Privacy policy</span>
                </div>
            </div>

        </div>
    );
};

export default LoginScreen;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import secureLocalStorage from "react-secure-storage";
import { BeatLoader } from "react-spinners";
import AppBar from "../../components/appBar";
import { currentSelectedBottomTabIndex, showAlertPopup } from "../../state/uiState";
import { loggedInUser } from "../../state/userState";
import { customRequest } from "../../utils/customRequest";
import sendDataToReactNative from "../../utils/nativeCommunication";

const OtpVerificationScreen = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const inputs = useRef([]);
    const [phone, setPhone] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setPhone(params.get("phone") || "");
    }, []);

    useEffect(() => {
        if (timer === 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (val: string, index: number) => {
        if (!/^\d?$/.test(val)) return;
        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);

        if (val && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const resendOTP = async () => {
        const res = await customRequest("/auth/send-otp", {
            method: "POST", data: {
                phone: phone,
                'type': 'delivery-partner',
            }
        });
        setTimer(30)
    }

    const verifyOTP = async () => {
        setLoading(true);
        setError(null);
        try {
            const enteredOtp = otp.join("");
            const res = await customRequest("/auth/verify-otp", {
                method: "POST",
                data: {
                    phone: phone,
                    otp: enteredOtp,
                    'type': 'delivery-partner',
                },
            });
            if (res.status === 200) {

                secureLocalStorage.setItem("key", res.data.data.authorization.token)

                if (res.data.data.details_submitted) {
                    loggedInUser.value = res.data.data;

                    sendDataToReactNative(
                        {
                            action: 'store-key-value',
                            key: "token",
                            value: res.data.data.authorization.token
                        }
                    )

                    delete res.data.data.authorization;
                    secureLocalStorage.setItem("user", res.data.data);

                    sendDataToReactNative(
                        {
                            action: 'store-key-value',
                            key: "user",
                            value: JSON.stringify(res.data.data)
                        }
                    )

                    currentSelectedBottomTabIndex.value = 0;

                    setTimeout(() => {
                        navigate("/");
                        setLoading(false);
                    }, 500);
                } else {
                    navigate("/onboarding");
                }
            } else {
                setLoading(false);
                showAlertPopup.value = res.error.message;
            }
        } catch (err) {
            setError(err.message || "Failed to verify OTP. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <AppBar title="OTP Verification" onBackPress={true} />

            <div className="p-6">

                <p className="text-sm text-center text-gray-700 mb-2">
                    We've sent a verification code to
                </p>
                <p className="text-center text-lg font-semibold text-gray-800 mb-6">
                    +91 {phone}
                </p>

                <div className="flex justify-center gap-4 mb-5">
                    {otp.map((val, i) => (
                        <input
                            key={i}
                            ref={el => inputs.current[i] = el}
                            type="number"
                            maxLength="1"
                            value={val}
                            onChange={e => handleChange(e.target.value, i)}
                            onKeyDown={e => handleKeyDown(e, i)}
                            className="w-10 h-10 text-center border border-gray-300 rounded-lg text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-none"
                        />
                    ))}
                </div>

                <div className="text-center text-sm text-gray-500 mb-4">
                    {timer > 0 ? `Resend OTP in ${timer}` : "You can resend now"}
                </div>


                <>
                    {error && (
                        <div className="mb-4 text-center text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={verifyOTP}
                            disabled={loading || otp.some(digit => digit === "")}
                            className="bg-[var(--primary-color)] text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ?
                                <BeatLoader color="white" size={22} />
                                :
                                "Verify OTP"}
                        </button>
                    </div>
                    {timer === 0 && (
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={resendOTP}
                                className="text-[var(--primary-color)]"
                            >
                                Resend OTP
                            </button>
                        </div>
                    )}
                </>

            </div>


        </div>
    );
};

export default OtpVerificationScreen;

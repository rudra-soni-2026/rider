import { ArrowLeft, ArrowRight, Camera, InfoIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { rootlink } from "../../consts/links";
import secureLocalStorage from "react-secure-storage";
import { customRequest } from "../../utils/customRequest";
import { useNavigate } from "react-router";
import { currentLocation, loggedInUser } from "../../state/userState";
import sendDataToReactNative from "../../utils/nativeCommunication";
import { paymentSuccessCaptured } from "../../state/uiState";


const steps = [
    "Select Vehicle",
    "Select City",
    "Select Work Hours",
    "Select Store",
    "Submit Aadhaar",
    "Submit PAN Card",
    "Submit Address",
    "Personal Details",
    "Bank Details",
    "Take Selfie",
    "Make Payment",
];


export default function OnboardingScreen() {
    const [step, setStep] = useState(0);
    const [selectedStep, setSelectedStep] = useState(steps[0]);
    const [stores, setStores] = useState(null);

    // Form state for each step (simplified for demo)
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState("");
    const [city, setCity] = useState("Patna");
    const [workHours, setWorkHours] = useState("");
    const [store, setStore] = useState("");
    const [aadhaarVerified, setAadhaarVerified] = useState(false);
    const [panDetails, setPanDetails] = useState({
        pan: "",
        name: "",
        dob: "",
        gender: "",
        father: "",
    });
    const [address, setAddress] = useState({
        house: "",
        street: "",
        pincode: "",
        city: "",
        state: "",
        landmark: "",
        vehicleNumber: "",
        drivingLicenseNumber: "",
    });
    const [personalDetails, setPersonalDetails] = useState({
        name: "",
        pan: "BRVPA8522L",
        address: "c4, ramjaipal nagar, patna, Bihar, 801503",
    });
    const [bankDetails, setBankDetails] = useState({
        bank: "SBI",
        account: "",
        confirmAccount: "",
        ifsc: "",
    });
    const [paymentError, setPaymentError] = useState(false);
    const [paymentInProgress, setPaymentInProgress] = useState(false);
    const [paymentPlan, setPaymentPlan] = useState("full");

    // Document file states
    const [panPhoto, setPanPhoto] = useState<File | null>(null);
    const [addressProofFront, setAddressProofFront] = useState<File | null>(null);
    const [addressProofBack, setAddressProofBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Navigation
    const nextStep = () => setStep((s) => {
        const stepIndex = Math.min(s + 1, steps.length - 1);
        setSelectedStep(steps[stepIndex])
        return stepIndex;
    });
    const prevStep = () => setStep((s) => {
        const stepIndex = Math.max(s - 1, 0);
        setSelectedStep(steps[stepIndex]);
        return stepIndex;
    });

    const getStores = async () => {
        const res = await customRequest('/auth/stores');
        if (res.status === 200) {
            setStores(
                res.data.stores
            )
        }
    }

    useEffect(() => {
        getStores();
    }, [])

    useEffect(() => {

    }, [])

    const requestForPermissions = async () => {
        await sendDataToReactNative({
            action: "get-current-position"
        })
        await sendDataToReactNative({
            action: "request-camera-permission",
        });
        await sendDataToReactNative({
            action: "request-gallery-permission",
        })

    }

    useEffect(() => {
        requestForPermissions();
    }, [])

    // Submit all onboarding data to API (multipart/form-data)
    async function submitOnboarding() {
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);
        try {
            const formData = new FormData();
            formData.append('vehicle', vehicle);
            formData.append('city', city);
            formData.append('workHours', workHours);
            formData.append('aadhaarVerified', String(aadhaarVerified));
            formData.append('panDetails', JSON.stringify(panDetails));
            formData.append('address', JSON.stringify(address));
            formData.append('personalDetails', JSON.stringify(personalDetails));
            formData.append('bankDetails', JSON.stringify(bankDetails));
            formData.append('paymentPlan', paymentPlan);
            formData.append('store_id', store);
            formData.append("longitude", currentLocation.value.longitude);
            formData.append("latitude", currentLocation.value.latitude);

            // Documents array
            let docIdx = 0;
            if (panPhoto) {
                formData.append(`documents[${docIdx}][type]`, 'pan_card');
                formData.append(`documents[${docIdx}][file_path]`, panPhoto);
                docIdx++;
            }
            if (addressProofFront) {
                formData.append(`documents[${docIdx}][type]`, 'address_proof_front');
                formData.append(`documents[${docIdx}][file_path]`, addressProofFront);
                docIdx++;
            }
            if (addressProofBack) {
                formData.append(`documents[${docIdx}][type]`, 'address_proof_back');
                formData.append(`documents[${docIdx}][file_path]`, addressProofBack);
                docIdx++;
            }
            if (selfie) {
                formData.append(`documents[${docIdx}][type]`, 'selfie');
                formData.append(`documents[${docIdx}][file_path]`, selfie);
                docIdx++;
            }

            const getToken = () => {
                return secureLocalStorage.getItem('key');
            };

            const token = getToken();

            const res = await fetch(rootlink + "/auth/complete-onboarding", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to submit onboarding details");

            navigate("/");
            const user = await res.json();
            loggedInUser.value = user;
            setSubmitSuccess(true);
        } catch (err) {
            setSubmitError(err.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    }

    // Payment handler
    async function handlePayment() {
        setPaymentInProgress(true);
        setPaymentError(null);
        try {
            // Determine amount based on plan
            let amount = paymentPlan === "full" ? 849 : 150;

            const createPaymentOrder = await customRequest("/razorpay-create-order", {
                method: "POST",
                data: {
                    amount: amount,
                    payment_for: "Rider Registration Charge"
                }
            });

            sendDataToReactNative({
                action: "razorpay-payment",
                amount: amount,
                order_id: createPaymentOrder.data.id ?? '',
                phone: "RIDER_PHONE",
                user_id: "RIDER",
                user_name: panDetails.name
            });
        } catch (err) {
            setPaymentError(err.message || "Payment failed");
            setPaymentInProgress(false);
        }
    }

    // When payment is captured, submit onboarding
    useEffect(() => {
        if (paymentSuccessCaptured.value) {
            submitOnboarding();
        }
    }, [paymentSuccessCaptured.value]);

    // Step renderers
    function renderStep() {
        switch (selectedStep) {
            case "Select Vehicle":
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold mb-2">Select vehicle</h2>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Motorcycle", value: "motorcycle", img: require("../../assets/icons/motorcycle.png") },
                                { label: "Bicycle", value: "bicycle", img: require("../../assets/icons/cycle.png") },
                                { label: "Electric scooter", value: "scooter", img: require("../../assets/icons/scooter.png") },
                            ].map((v) => (
                                <div
                                    key={v.value}
                                    className={`flex items-center rounded-lg border p-3 bg-white cursor-pointer ${vehicle === v.value ? "border-[var(--primary-color)]" : "border-gray-200"
                                        }`}
                                    onClick={() => setVehicle(v.value)}
                                >
                                    <img src={v.img} alt={v.label} className="w-24 h-16 object-contain mr-4 rounded-lg" />
                                    <span className="flex-1 text-lg font-semibold">{v.label}</span>
                                    <span
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${vehicle === v.value ? "border-[var(--primary-color)]" : "border-gray-300"
                                            }`}
                                    >
                                        {vehicle === v.value && <span className="w-3 h-3 bg-[var(--primary-color)] rounded-full" />}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center rounded-lg border border-gray-200 p-3 bg-gray-50">
                                <div className="flex-1">
                                    <div className="font-semibold">I don’t have a vehicle</div>
                                    <div className="text-sm text-gray-500">Fill the form to get help</div>
                                </div>
                                <button className="text-[var(--primary-color)] font-semibold flex items-center">Get help <ArrowRight size={18} className="ml-2" /></button>
                            </div>
                        </div>
                    </div>
                );
            case "Select City":
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold mb-2">Select city</h2>
                        <input
                            className="w-full border rounded-lg px-4 py-2 mb-2"
                            placeholder="Search your work city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        <div className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                            <span className="flex-1 border-t" /> NEARBY CITIES <span className="flex-1 border-t" />
                        </div>
                        <div className="mb-2">
                            <button
                                className={`w-full text-left px-4 py-2 text-white rounded-lg ${city === "Patna" ? "bg-[var(--primary-color)] font-bold" : "hover:bg-gray-100"
                                    }`}
                                onClick={() => setCity("Patna")}
                            >
                                Patna
                            </button>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                            <span className="flex-1 border-t" /> ALL CITIES <span className="flex-1 border-t" />
                        </div>
                        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                            {["Agra", "Ahmedabad", "Ahmednagar", "Ajmer", "Akola", "Aligarh", "Allahabad", "Alwar", "Ambala", "Amravati"].map(
                                (c) => (
                                    <button
                                        key={c}
                                        className={`w-full text-left px-4 py-2 rounded-lg ${city === c ? "bg-[var(--primary-color)]/10 font-bold" : "hover:bg-gray-100"
                                            }`}
                                        onClick={() => setCity(c)}
                                    >
                                        {c}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                );
            case "Select Work Hours":
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold mb-2">Select work hours</h2>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Full time", value: "full", img: require("../../assets/icons/full-time.png") },
                                { label: "Part time", value: "part", img: require("../../assets/icons/part-time.png") },
                            ].map((w) => (
                                <div
                                    key={w.value}
                                    className={`flex items-center rounded-lg border p-3 bg-white cursor-pointer ${workHours === w.value ? "border-var(--primary-color)" : "border-gray-200"
                                        }`}
                                    onClick={() => setWorkHours(w.value)}
                                >
                                    <img src={w.img} alt={w.label} className="w-20 h-20 object-contain mr-4 rounded-lg" />
                                    <span className="flex-1 text-lg font-semibold">{w.label}</span>
                                    <span
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${workHours === w.value ? "border-[var(--primary-color)]" : "border-gray-300"
                                            }`}
                                    >
                                        {workHours === w.value && <span className="w-3 h-3 bg-[var(--primary-color)] rounded-full" />}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "Select Store":
                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold mb-2">Select store</h2>
                        <input
                            className="w-full border rounded-lg px-4 py-2 mb-2"
                            placeholder="Search stores in your city"
                        />
                        <div className="flex flex-col gap-3">
                            {stores && stores.map((s, idx) => (
                                <div
                                    key={s.name}
                                    className={`rounded-lg border p-2 bg-white cursor-pointer border-2 ${store === s.id ? "border-[var(--primary-color)]" : "border-gray-200"
                                        }`}
                                    onClick={() => setStore(s.id)}
                                >
                                    <div className="flex items-center mb-1">
                                        {s.recommended && (
                                            <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded mr-2">Recommended</span>
                                        )}
                                        <span className="font-bold">{s.name}</span>
                                        <span className="ml-2 text-gray-500 whitespace-nowrap">{s.distance}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">{s.address}</div>
                                    <div className="flex items-center">
                                        <span className="bg-[var(--primary-color)] text-green-200 text-xs px-2 py-1 rounded mr-2">
                                            {s.bonus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="fixed bottom-24 right-6 bg-[var(--primary-color)] text-white rounded-full px-4 py-2 shadow flex items-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" className="inline"><circle cx="10" cy="10" r="9" strokeWidth="2" /><path d="M10 6v4l2 2" strokeWidth="2" strokeLinecap="round" /></svg>
                            Help
                        </button>
                    </div>
                );
            case "Submit Aadhaar":
                return (
                    <div className="flex flex-col gap-4">
                        {/* <h2 className="text-xl font-bold mb-2">Submit Aadhaar</h2> */}
                        <div className="relative rounded-xl border p-3 bg-white shadow flex flex-col items-center">
                            <img src={require("../../assets/icons/identity-card.png")} alt="Aadhaar" className="w-40 h-24 object-contain mb-2" />
                            <div className="text-lg font-semibold mb-1">How to Verify Aadhaar Card?</div>
                            <button className="absolute top-8 left-8 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">1m 5s</button>
                            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow">
                                <svg width="32" height="32" fill="none" stroke="currentColor"><circle cx="16" cy="16" r="15" strokeWidth="2" /><polygon points="13,11 22,16 13,21" fill="currentColor" /></svg>
                            </button>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                            <span className="flex-1 border-t" /> BENEFITS OF AADHAAR <span className="flex-1 border-t" />
                        </div>
                        <div className="rounded-xl border p-3 bg-white shadow flex items-center justify-between">
                            <div>
                                <div className="font-semibold">ID verification time</div>
                                <div className="text-xs text-gray-500">Without Aadhaar</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">5 Minutes</div>
                                <div className="text-xs text-gray-500">2-3 days</div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                className="flex-1 bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold"
                                onClick={() => {
                                    setAadhaarVerified(true);
                                    nextStep();
                                }}
                            >
                                Verify your Aadhaar
                            </button>
                            <button
                                className="flex-1 text-[var(--primary-color)] font-semibold underline"
                                onClick={() => {
                                    setAadhaarVerified(false);
                                    nextStep();
                                }}
                            >
                                Skip Aadhaar verification
                            </button>
                        </div>
                        {/* <button className="fixed bottom-24 right-6 bg-[var(--primary-color)] text-white rounded-full px-4 py-2 shadow flex items-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" className="inline"><circle cx="10" cy="10" r="9" strokeWidth="2" /><path d="M10 6v4l2 2" strokeWidth="2" strokeLinecap="round" /></svg>
                            Help
                        </button> */}
                    </div>
                );
            case "Submit PAN Card":
                return (
                    <div className="flex flex-col gap-4">
                        {/* <h2 className="text-xl font-bold mb-2">Submit PAN card</h2> */}
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="pan-number">PAN number</label>
                            <input
                                id="pan-number"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter PAN number"
                                value={panDetails.pan}
                                onChange={e => setPanDetails({ ...panDetails, pan: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="pan-name">Name on PAN card</label>
                            <input
                                id="pan-name"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter name as per PAN"
                                value={panDetails.name}
                                onChange={e => setPanDetails({ ...panDetails, name: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="pan-dob">Date of birth</label>
                            <input
                                id="pan-dob"
                                type="date"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                value={panDetails.dob}
                                onChange={e => setPanDetails({ ...panDetails, dob: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="pan-gender">Gender</label>
                            <select
                                id="pan-gender"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                value={panDetails.gender}
                                onChange={e => setPanDetails({ ...panDetails, gender: e.target.value })}
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="pan-father">Father’s name</label>
                            <input
                                id="pan-father"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter father's name"
                                value={panDetails.father}
                                onChange={e => setPanDetails({ ...panDetails, father: e.target.value })}
                            />
                        </div>
                        <div className="rounded-xl border-2 border-dashed border-[var(--primary-color)] bg-[var(--primary-color)]/10 bg-opacity-80 p-6 flex flex-col items-center text-black mb-2">
                            <div className="font-bold mb-1">PAN Card Photo</div>
                            <div className="text-xs mb-2">Front side image only</div>
                            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} id="pan-photo-input" onChange={e => setPanPhoto(e.target.files?.[0] || null)} />
                            {panPhoto ? (
                                <>
                                    <img src={URL.createObjectURL(panPhoto)} alt="PAN Preview" className="w-40 h-28 object-contain rounded mb-2 bg-white" />
                                    <button className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2" onClick={() => document.getElementById('pan-photo-input')?.click()}>
                                        <Camera />
                                        Retake Photo
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                                    onClick={async () => {
                                        await sendDataToReactNative({ action: "request-camera-permission" });
                                        document.getElementById('pan-photo-input')?.click();
                                    }}
                                >
                                    <Camera />
                                    Take Photo
                                </button>
                            )}
                        </div>
                        {/* <button className="fixed bottom-24 right-6 bg-[var(--primary-color)] text-white rounded-full px-4 py-2 shadow flex items-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" className="inline"><circle cx="10" cy="10" r="9" strokeWidth="2" /><path d="M10 6v4l2 2" strokeWidth="2" strokeLinecap="round" /></svg>
                            Help
                        </button> */}
                    </div>
                );
            case "Submit Address":
                return (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="address-house">House No.</label>
                            <input
                                id="address-house"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter house number"
                                value={address.house}
                                onChange={e => setAddress({ ...address, house: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="address-street">Area, street</label>
                            <input
                                id="address-street"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter area or street"
                                value={address.street}
                                onChange={e => setAddress({ ...address, street: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="address-pincode">Pin Code</label>
                            <input
                                id="address-pincode"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter pin code"
                                value={address.pincode}
                                onChange={e => setAddress({ ...address, pincode: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="address-city">Town/City</label>
                            <input
                                id="address-city"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter town or city"
                                value={address.city}
                                onChange={e => setAddress({ ...address, city: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="address-state">State</label>
                            <select
                                id="address-state"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                value={address.state}
                                onChange={e => setAddress({ ...address, state: e.target.value })}
                            >
                                <option value="">Select state</option>
                                <option value="Bihar">Bihar</option>
                                <option value="UP">UP</option>
                                <option value="Delhi">Delhi</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="address-landmark">Landmark</label>
                            <input
                                id="address-landmark"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter landmark"
                                value={address.landmark}
                                onChange={e => setAddress({ ...address, landmark: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="vehicle-number">Vehicle Number</label>
                            <input
                                id="vehicle-number"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter vehicle number"
                                value={address.vehicleNumber}
                                onChange={e => setAddress({ ...address, vehicleNumber: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="driving-license-number">Driving License Number</label>
                            <input
                                id="driving-license-number"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter driving license number"
                                value={address.drivingLicenseNumber}
                                onChange={e => setAddress({ ...address, drivingLicenseNumber: e.target.value })}
                            />
                        </div>
                        <div className="font-semibold mb-1">Address proof</div>
                        <div className="text-xs text-gray-500 mb-2">Photo of DL, voter ID or ration card</div>
                        <div className="flex gap-2">
                            <div className="flex-1 rounded-xl border-2 border-dashed border-blue-500 bg-[var(--primary-color)]/10 bg-opacity-80 p-4 flex flex-col items-center text-black">
                                <div className="font-bold mb-1">Front side</div>
                                <div className="text-xs mb-2">Take photo</div>
                                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} id="address-front-input" onChange={e => setAddressProofFront(e.target.files?.[0] || null)} />
                                {addressProofFront ? (
                                    <>
                                        <img src={URL.createObjectURL(addressProofFront)} alt="Address Proof Front" className="w-32 h-20 object-contain rounded mb-2 bg-white" />
                                        <button className="bg-white text-blue-700 px-2 py-2 rounded-lg font-semibold flex items-center gap-2" onClick={() => document.getElementById('address-front-input')?.click()}>
                                            <Camera />
                                            <span className="text-sm">
                                                Retake Photo
                                            </span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="bg-white text-blue-700 px-2 py-2 rounded-lg font-semibold flex items-center gap-2"
                                        onClick={async () => {
                                            await sendDataToReactNative({ action: "request-camera-permission" });
                                            document.getElementById('address-front-input')?.click();
                                        }}
                                    >
                                        <Camera />
                                        <span className="text-sm">
                                            Front side
                                        </span>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 rounded-xl border-2 border-dashed border-blue-500 bg-[var(--primary-color)]/10 bg-opacity-80 p-4 flex flex-col items-center text-black">
                                <div className="font-bold mb-1">Back side</div>
                                <div className="text-xs mb-2">Take photo</div>
                                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} id="address-back-input" onChange={e => setAddressProofBack(e.target.files?.[0] || null)} />
                                {addressProofBack ? (
                                    <>
                                        <img src={URL.createObjectURL(addressProofBack)} alt="Address Proof Back" className="w-32 h-20 object-contain rounded mb-2 bg-white" />
                                        <button className="bg-white text-blue-700 px-2 py-2 rounded-lg font-semibold flex items-center gap-1" onClick={() => document.getElementById('address-back-input')?.click()}>
                                            <Camera />
                                            <span className="text-sm">
                                                Retake Photo
                                            </span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="bg-white text-blue-700 px-2 py-2 rounded-lg font-semibold flex items-center gap-1"
                                        onClick={async () => {
                                            await sendDataToReactNative({ action: "request-camera-permission" });
                                            document.getElementById('address-back-input')?.click();
                                        }}
                                    >
                                        <Camera />
                                        <span className="text-sm">
                                            Back side
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* <button className="fixed bottom-24 right-6 bg-[var(--primary-color)] text-white rounded-full px-4 py-2 shadow flex items-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" className="inline"><circle cx="10" cy="10" r="9" strokeWidth="2" /><path d="M10 6v4l2 2" strokeWidth="2" strokeLinecap="round" /></svg>
                            Help
                        </button> */}
                    </div>
                );
            case "Personal Details":
                const composedName = panDetails.name || personalDetails.name || "";
                const composedPan = panDetails.pan || personalDetails.pan || "";
                const composedAddress = [
                    address.house,
                    address.street,
                    address.city,
                    address.state,
                    address.pincode,
                    address.landmark,
                ]
                    .filter(Boolean)
                    .join(", ");

                return (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold mb-2">Personal details</h2>
                        <div className="rounded-xl border border-gray-300 p-3 bg-white flex items-center mb-2">
                            <div className="flex-1">
                                <div className="font-semibold">
                                    {aadhaarVerified ? "Aadhaar verified" : "Aadhaar verification skipped"}
                                </div>
                            </div>
                            <img src={require("../../assets/icons/identity-card.png")} alt="Aadhaar" className="w-16 h-10 object-contain" />
                        </div>
                        <div className="rounded-xl border border-gray-300 p-3  flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Personal details submitted</span>
                                <span className="w-6 h-6 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white font-bold">&#10003;</span>
                            </div>
                            <div>
                                <div>
                                    Name: <span className="font-bold">{composedName || "—"}</span>
                                </div>
                                <div>
                                    PAN number: <span className="font-bold">{composedPan || "—"}</span>
                                </div>
                                <div>
                                    Address: <span className="font-bold">{composedAddress || "—"}</span>
                                </div>
                            </div>
                            <button
                                className="text-[var(--primary-color)] font-semibold underline text-left"
                                onClick={() => setStep(5)}
                            >
                                Edit details &rarr;
                            </button>
                        </div>
                    </div>
                );
            case "Bank Details":
                return (
                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-semibold mb-2">Payout will be credited in this account</div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="bank-name">Bank</label>
                            <input
                                id="bank-confirm-account"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Bank Name"
                                value={bankDetails.bank}
                                onChange={e => setBankDetails({ ...bankDetails, bank: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="bank-account">Account number</label>
                            <input
                                id="bank-account"
                                type="password"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter account number"
                                value={bankDetails.account}
                                onChange={e => setBankDetails({ ...bankDetails, account: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="bank-confirm-account">Confirm account number</label>
                            <input
                                id="bank-confirm-account"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Re-enter account number"
                                value={bankDetails.confirmAccount}
                                onChange={e => setBankDetails({ ...bankDetails, confirmAccount: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 mb-2">
                            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="bank-ifsc">Bank IFSC code</label>
                            <input
                                id="bank-ifsc"
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition bg-white outline-none"
                                placeholder="Enter IFSC code"
                                value={bankDetails.ifsc}
                                onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case "Take Selfie":
                return (
                    <div className="flex flex-col gap-4 items-center justify-center min-h-[60vh]">
                        {selfie ? (
                            <>
                                <img src={URL.createObjectURL(selfie)} alt="Selfie" className="w-32 h-32 rounded-full object-cover mb-4" />
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 mb-2" onClick={() => document.getElementById('selfie-input')?.click()}>
                                    Retake Selfie
                                </button>
                            </>
                        ) : (
                            <>
                                <img src={require("../../assets/icons/selfie.png")} alt="Selfie" className="w-32 h-32 rounded-full border border-gray-100 shadow-xs object-contain mb-4" />
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 mb-2"
                                    onClick={async () => {
                                        await sendDataToReactNative({ action: "request-camera-permission" });
                                        document.getElementById('selfie-input')?.click();
                                    }}
                                >
                                    Take Selfie
                                </button>
                            </>
                        )}
                        <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} id="selfie-input" onChange={e => setSelfie(e.target.files?.[0] || null)} />
                        <div className="flex gap-2 w-full max-w-xs mt-4">
                            <button className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2" onClick={nextStep}>
                                Skip
                            </button>
                            <button className="flex-1 bg-[var(--primary-color)] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2" onClick={nextStep}>
                                Next
                            </button>
                        </div>
                    </div>
                );
            case "Make Payment":
                return (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border border-yellow-300 p-3 bg-yellow-50 flex flex-col items-center mb-2">
                            <img src={require("../../assets/icons/secure-payment.png")} alt="Payment" className="w-32 h-20 object-contain mb-2" />
                            <div className="text-lg font-semibold mb-1">Earn up to ₹25,000 per month</div>
                            <div className="text-sm text-gray-600">Daily payout with flexible working hours</div>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                            <span className="flex-1 border-t" /> SELECT YOUR PLAN <span className="flex-1 border-t" />
                        </div>
                        <div className="rounded-xl border border-gray-300 p-3 bg-white flex items-start mb-2">
                            <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded mr-2"><InfoIcon /></span>
                            <div>
                                <div className="font-semibold">One time fee for processing your application</div>
                                <div className="text-xs">You also get two t-shirts and a delivery bag worth ₹1040 for free</div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div
                                className={`rounded-xl border p-3 flex items-center cursor-pointer ${paymentPlan === "full" ? "bg-blue-50 border-[var(--primary-color)]" : "bg-white border-gray-200"
                                    }`}
                                onClick={() => setPaymentPlan("full")}
                            >
                                <div className="flex flex-col items-start gap-[2px]">
                                    <span className="bg-blue-600 text-white text-[6px] px-2 py-1 rounded mr-2">POPULAR</span>
                                    <span className="flex-1 font-semibold text-sm">Pay full amount</span>
                                    <div className="flex items-center">
                                        <span className="text-blue-600 font-bold mr-2">₹849</span>
                                        <span className="text-gray-400 line-through mr-2">₹1149</span>
                                    </div>
                                </div>
                                <span className="text-blue-600 text-sm ml-auto">₹344 off</span>
                                <span className="ml-2 w-5 h-5 rounded-full border-2 flex items-center justify-center border-[var(--primary-color)]">
                                    {paymentPlan === "full" && <span className="w-3 h-3 bg-[var(--primary-color)] rounded-full" />}
                                </span>
                            </div>
                            <div
                                className={`rounded-xl border p-3 flex items-center cursor-pointer ${paymentPlan === "installment" ? "bg-blue-50 border-[var(--primary-color)]" : "bg-white border-gray-200"}`}
                                onClick={() => setPaymentPlan("installment")}
                            >
                                <div className="flex flex-col">
                                    <span className="flex-1 font-semibold">Pay weekly instalments</span>
                                    <span className="text-blue-600 font-bold mr-2">₹150 now</span>
                                    <span className="text-gray-400 text-xs mr-2">₹200 every week for next 4 weeks</span>
                                </div>
                                <span className="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center border-[var(--primary-color)]">
                                    {paymentPlan === "installment" && <span className="w-3 h-3 bg-[var(--primary-color)] rounded-full" />}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    function renderFooter() {
        let btnText = "Next";
        let btnAction = nextStep;
        let disabled = false;
        let showPaymentError = false;
        let paymentErrorMsg = "";
        let showPaymentLoading = false;

        if (step === steps.length - 1) {
            // Make Payment step
            if (submitting) {
                btnText = "Submitting...";
                disabled = true;
                showPaymentLoading = true;
            } else if (paymentInProgress) {
                btnText = "Processing Payment...";
                disabled = true;
                showPaymentLoading = true;
            } else {
                btnText = "Pay now";
                btnAction = handlePayment;
                disabled = false;
            }
            if (paymentError) {
                showPaymentError = true;
                paymentErrorMsg = paymentError;
            }
        }
        if (step === 4) return null;
        if (step === 9) return null;

        return (
            <div>
                {submitError && (
                    <div className="mb-2 text-red-600 text-center text-sm">{submitError}</div>
                )}
                {showPaymentError && (
                    <div className="mb-2 text-red-600 text-center text-sm">{paymentErrorMsg}</div>
                )}
                {submitSuccess && (
                    <div className="mb-2 text-[var(--primary-color)] text-center text-sm">Onboarding submitted successfully!</div>
                )}
                <button
                    className={`w-full py-2 rounded-lg font-semibold text-lg ${disabled ? "bg-gray-300 text-gray-500" : "bg-[var(--primary-color)] text-white"
                        }`}
                    onClick={btnAction}
                    disabled={disabled}
                >
                    {btnText}
                </button>
            </div>
        );
    }

    function renderHeader() {
        return (
            <div className="flex flex-col">
                <div className="bg-white h-[var(--status-bar-size)]"></div>

                <header className="sticky top-0 z-10 bg-white shadow-xs flex items-center justify-between px-4 py-3">
                    {step > 0 ? (
                        <button onClick={prevStep} className="mr-2 text-2xl font-bold text-gray-700"><ArrowLeft /></button>
                    ) : (
                        <span />
                    )}
                    <span className="text-lg font-bold">{steps[step]}</span>
                    <span className="w-8 h-8 rounded-full  flex items-center justify-center">
                    </span>
                </header>
            </div>
        );
    }

    function renderStickyFooter() {
        return (
            <footer className="sticky bottom-0 z-10 bg-white shadow px-4 py-3">
                {renderFooter()}
            </footer>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {renderHeader()}
            <main className="flex-1 overflow-y-auto px-4 py-6">{renderStep()}</main>
            {renderStickyFooter()}
        </div>
    );
}

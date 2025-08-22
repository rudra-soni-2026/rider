import { ArrowLeft, ChevronRight, LogOut, Store } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { loggedInUser, riderInfoData } from '../state/userState';
import secureLocalStorage from 'react-secure-storage';
import sendDataToReactNative from '../utils/nativeCommunication';
import { customRequest } from '../utils/customRequest';
import { AppLoader } from '../components/loader';
import { showAlertPopup, showAlertPopupTitle } from '../state/uiState';

// --- Types for user details ---
interface Address {
    house: string;
    street: string;
    pincode: string;
    city: string;
    state: string;
    landmark: string;
    vehicleNumber: string;
    drivingLicenseNumber: string;
}

interface PanDetails {
    pan: string;
    name: string;
    dob: string;
    gender: string;
    father: string;
}

interface BankDetails {
    bank: string;
    account: string;
    confirmAccount: string;
    ifsc: string;
}

interface SupportItem {
    title: string;
    type: string;
    url: string;
}

interface KnowledgeResource {
    title: string;
    type: string;
    url: string;
}

interface RiderInfo {
    name: string;
    phone: string;
    code: string;
    profile: string;
    rating: number;
    store_name: string;
    store_address?: string;
    store_contact_number?: string;
    fleet_coach: string;
    referral_bonus: number;
    support: SupportItem[];
    knowledge_resources: KnowledgeResource[];
    pan_details: PanDetails;
    bank_details: BankDetails;
    address: Address;
}

const ProfileScreen: React.FC = () => {
    const navigate = useNavigate();

    // Helper: Render form for details popup
    type DetailsType = 'address' | 'pan' | 'bank';

    type DetailsFormProps = {
        type: DetailsType;
        data: Address | PanDetails | BankDetails;
        onUpdate: (updated: any) => void;
    };

    const DetailsForm: React.FC<DetailsFormProps> = ({ type, data, onUpdate }) => {
        const [form, setForm] = useState<typeof data>({ ...data });

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            setForm({ ...form, [e.target.name]: e.target.value });
        };

        let fields: { label: string; name: string }[] = [];
        if (type === 'address') {
            fields = [
                { label: 'House', name: 'house' },
                { label: 'Street', name: 'street' },
                { label: 'Pincode', name: 'pincode' },
                { label: 'City', name: 'city' },
                { label: 'State', name: 'state' },
                { label: 'Landmark', name: 'landmark' },
                { label: 'Vehicle Number', name: 'vehicleNumber' },
                { label: 'Driving License Number', name: 'drivingLicenseNumber' },
            ];
        } else if (type === 'pan') {
            fields = [
                { label: 'PAN', name: 'pan' },
                { label: 'Name', name: 'name' },
                { label: 'DOB', name: 'dob' },
                { label: 'Gender', name: 'gender' },
                { label: "Father's Name", name: 'father' },
            ];
        } else if (type === 'bank') {
            fields = [
                { label: 'Bank', name: 'bank' },
                { label: 'Account', name: 'account' },
                { label: 'Confirm Account', name: 'confirmAccount' },
                { label: 'IFSC', name: 'ifsc' },
            ];
        }

        return (
            <form
                className="flex flex-col gap-3"
                onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    onUpdate(form);
                }}
            >
                {fields.map(f => (
                    <div key={f.name} className="relative mt-2">
                        <input
                            type="text"
                            name={f.name}
                            value={(form as any)[f.name] ?? ''}
                            onChange={handleChange}
                            className={`block w-full px-0 pt-5 pb-1 text-sm bg-transparent border-0 border-b-1 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors duration-200
                                ${((form as any)[f.name] ?? '') !== '' ? 'border-blue-300' : 'border-gray-300'}`}
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label
                            htmlFor={f.name}
                            className={`absolute left-0 top-1 text-gray-500 text-sm pointer-events-none transition-all duration-200
                                peer-focus:-top-3 peer-focus:text-xs peer-focus:text-blue-600
                                ${((form as any)[f.name] ?? '') !== '' ? '-top-3 text-xs text-blue-600' : 'top-5'}`}
                        >
                            {f.label}
                        </label>
                    </div>
                ))}
                <button
                    type="submit"
                    className="mt-2 bg-blue-500 text-white rounded px-4 py-2 font-semibold"
                >
                    Update Details
                </button>
            </form>
        );
    };

    // Handler to open details popup
    const openDetailsPopup = (type: DetailsType, data: Address | PanDetails | BankDetails) => {
        let title = '';
        if (type === 'address') title = 'Edit Address';
        else if (type === 'pan') title = 'Edit PAN Details';
        else if (type === 'bank') title = 'Edit Bank Details';

        showAlertPopup.value = (
            <DetailsForm
                type={type}
                data={data}
                onUpdate={async (updated: typeof data) => {
                    try {
                        const response = await customRequest("/update-details", { method: "PUT", data: type === "address" ? { address: updated } : type === "bank" ? { bank_details: updated } : { pan_details: updated } });
                        if (response && response.data) {
                            // Optionally refresh rider info
                            const riderInfoResp = await customRequest('/auth/rider-info');
                            if (riderInfoResp && riderInfoResp.data && riderInfoResp.data.status === 'success') {
                                riderInfoData.value = riderInfoResp.data.data;
                            }
                            showAlertPopup.value = null;
                            showAlertPopupTitle.value = null;
                        } else {
                            showAlertPopup.value = (
                                <div className="text-red-600">
                                    Failed to update details. Please try again.
                                </div>
                            );
                            showAlertPopupTitle.value = "Error";
                        }
                    } catch (err) {
                        showAlertPopup.value = (
                            <div className="text-red-600">
                                Failed to update details. Please try again.
                            </div>
                        );
                        showAlertPopupTitle.value = "Error";
                    }
                }}
            />
        );
        showAlertPopupTitle.value = title;
    };

    useEffect(() => {
        async function fetchRiderInfo() {
            const response = await customRequest('/auth/rider-info');
            if (response && response.data && response.data.status === 'success') {
                riderInfoData.value = response.data.data;
            }
        }
        fetchRiderInfo();
    }, []);

    const handleLogout = () => {
        loggedInUser.value = null;
        secureLocalStorage.clear();
        navigate("/login");
    }


    if (!riderInfoData.value) {
        return (
            <div className="h-screen w-screen">
                <AppLoader />
            </div>
        );
    }

    const rider = riderInfoData.value as unknown as RiderInfo;

    // console.log(rider);


    return (
        <div className=" h-screen text-gray-800 font-sans">
            <div className="flex flex-col bg-blue-500 rounded-b-xl">
                <div className="px-4 pt-3 bg-white">
                    <ArrowLeft onClick={() => { navigate(-1) }} />
                </div>
                <div className="bg-white px-4 py-3 flex items-center space-x-4  rounded-b-xl">
                    <div>
                        <p className="font-semibold text-lg">{rider.name ?? ''}</p>
                        {
                            rider.name !== rider.phone &&
                            <p className="font-semibold text-sm">{rider.phone ?? ''}</p>
                        }
                        <p className="text-sm text-gray-500">{rider.code ?? ''}</p>
                        <p className="text-sm text-yellow-600 mt-2">⭐ {rider.rating ?? ''}</p>
                    </div>
                    <img
                        src={typeof rider.profile === 'string' ? rider.profile : "https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D"}
                        alt="Profile"
                        className="ml-auto w-16 h-16 rounded-full border border-gray-200 object-cover"
                    />
                </div>

                <div className="text-white px-4 py-2 rounded flex items-center gap-2">
                    <Store size={18} />
                    <span className='text-sm'>{rider.store_name ?? ''}</span>
                    <button className="bg-black/20 text-white px-2 py-1 rounded-full text-xs ml-auto font-medium">
                        Go to store
                    </button>
                </div>

            </div>

            <div className="grid grid-cols-3 gap-2 text-center my-4 px-3">
                <div
                    className='bg-white rounded-lg flex flex-col gap-1 p-3 cursor-pointer'
                    onClick={() => {
                        showAlertPopup.value = (
                            <div className="space-y-2">
                                <div>
                                    <span className="font-semibold">Store Name: </span>
                                    <span>{rider.store_name ?? 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">Address: </span>
                                    <span>{rider.store_address ?? 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">Contact: </span>
                                    <span>{rider.store_contact_number ?? 'N/A'}</span>
                                </div>
                            </div>
                        );
                        showAlertPopupTitle.value = "Store Details";
                    }}
                >
                    <div className="text-xl">🕒</div>
                    <p className="text-sm font-semibold mt-1">Selected Store</p>
                </div>
                <div className='bg-white rounded-lg flex flex-col gap-1 p-3' onClick={() => { navigate('/ride-history') }}>
                    <div className="text-xl">🛵</div>
                    <p className="text-sm font-semibold mt-1">Trips history</p>
                </div>
                <div className='bg-white rounded-lg flex flex-col gap-1 p-3'>
                    <div className="text-xl">🎁</div>
                    <p className="text-sm font-semibold mt-1">Your offers</p>
                </div>
            </div>

            <div className="bg-white mx-3 p-4 rounded-lg mt-2 flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg">₹{rider.referral_bonus ?? ''} referral bonus</p>
                    <p className="text-xs text-gray-600">Refer your friend and earn</p>
                </div>
                <span className="text-2xl">💰</span>
            </div>

            {/* My Details Section */}
            <div className="mt-6 mx-3">
                <p className="font-medium mb-2">My Details</p>
                <div className="space-y-2">
                    <div
                        className="flex justify-between items-center p-3 bg-white rounded-lg cursor-pointer"
                        onClick={() => openDetailsPopup('address', rider.address)}
                    >
                        <span className="text-sm">🏠 Address</span>
                        <span><ChevronRight size={18} /></span>
                    </div>
                    <div
                        className="flex justify-between items-center p-3 bg-white rounded-lg cursor-pointer"
                        onClick={() => openDetailsPopup('pan', rider.pan_details)}
                    >
                        <span className="text-sm">🪪 PAN Details</span>
                        <span><ChevronRight size={18} /></span>
                    </div>
                    <div
                        className="flex justify-between items-center p-3 bg-white rounded-lg cursor-pointer"
                        onClick={() => openDetailsPopup('bank', rider.bank_details)}
                    >
                        <span className="text-sm">🏦 Bank Details</span>
                        <span><ChevronRight size={18} /></span>
                    </div>
                </div>
            </div>

            <div className="mt-6 mx-3">
                <p className="font-medium mb-2">Support</p>
                <div className="space-y-2">
                    {rider.support?.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg bg-white"
                            onClick={() => {
                                if (item.type === 'support-tickets' && rider.store_contact_number) {
                                    window.open(`tel:${rider.store_contact_number}`, '_blank');
                                } else {
                                    navigate(`/${item.type}`);
                                }
                            }}
                        >
                            <span className='text-sm'>
                                {item.type === 'help_centre' ? '🎧' : item.type === 'support_tickets' ? '🎟️' : ''} {item.title}
                            </span>
                            <span><ChevronRight size={18} /></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* <div className="mt-6 mx-3">
                <p className="font-medium mb-2">Knowledge Resources</p>
                <div className="space-y-2">
                    {rider.knowledge_resources?.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg flex justify-between items-center" onClick={() => { navigate("/videos-for-you") }}>
                            <span className='text-sm'>
                                {item.type === 'videos' ? '🎥' : ''} {item.title}
                            </span>
                            <span><ChevronRight size={18} /></span>
                        </div>
                    ))}
                </div>
            </div> */}

            <div className="mt-6 mx-3 pb-4">
                <p className="font-medium mb-2">Actions</p>
                <div className="p-3 bg-white rounded-lg flex  gap-2 items-center" onClick={handleLogout}>
                    <LogOut />
                    <span className='text-sm'>Logout</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;

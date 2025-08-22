import { ArrowRight, MoonStar } from "lucide-react";
import React from "react";
import { showAlertPopup, showAlertPopupTitle } from "../../../state/uiState";

export const FeedComponent: React.FC = () => {
    // Handler for Book button
    const handleBookClick = () => {
        showAlertPopupTitle.value = "Booking";
        showAlertPopup.value = "Booking coming soon.";
    };

    // Handler for Compulsory login cards
    const handleCompulsoryLoginClick = () => {
        showAlertPopupTitle.value = "Compulsory Login";
        showAlertPopup.value = "It is required for rider to login between the given duration, else there may be some deduction.";
    };

    // Handler for Incentive/Earnings amount click
    const handleAmountClick = (type: "Incentive" | "Earnings", amount: number) => {
        if (type === "Incentive") {
            let message = `Earn an extra ₹${amount} by completing your delivery targets in this slot! The more you deliver, the more you earn.`;
            if (amount === 275) {
                message += " This is the highest incentive for this slot—push your limits and grab the top reward!";
            } else {
                message += " Keep hustling to unlock even higher incentives!";
            }
            showAlertPopupTitle.value = "Incentive Boost";
            showAlertPopup.value = message;
        } else {
            let message = `Total earnings for this slot: ₹${amount}. Deliver more to unlock higher rewards and exclusive bonuses!`;
            if (amount === 1248) {
                message += " You're among the top earners—amazing work! Keep delivering to stay on top.";
            } else {
                message += " Aim higher to reach the top earning bracket!";
            }
            showAlertPopupTitle.value = "Earnings Details";
            showAlertPopup.value = message;
        }
    };

    return (
        <div className="p-3">
            <div className="rounded-lg mb-4 bg-white border border-gray-100 overflow-hidden">
                <p className="text-sm text-white font-bold bg-black p-3">Gig details</p>
                <div className="p-3">
                    <p className="font-semibold ">Free Gig for you, 1pm - 3pm 🎉</p>
                    <p className="text-gray-500 text-xs">Special Gig - you can go online even now</p>
                    <button
                        className="mt-3 w-full bg-black text-white py-2 rounded-md font-semibold"
                        onClick={handleBookClick}
                    >
                        Book and go online now
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">All offers</p>
                    {/* <div className="flex items-center">
                        <p className="text-blue-500 text-xs mr-1">See All</p>
                        <ArrowRight size={14} color="gray" />
                    </div> */}
                </div>

                <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                    <div className="flex justify-between items-center bg-black p-2">
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold text-white">Full Day Evening</p>
                            <p className="text-xs text-white">16 May · 4am - 3:59am · <span className="text-green-600">Live</span></p>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-green-600 font-semibold">₹275</p>
                            <span className="text-white text-[10px] font-semibold">Extra</span>

                        </div>
                    </div>

                    <div className="p-3">
                        <div className="mt-2 text-xs">
                            <p className="text-gray-500">Incentive</p>
                            <div className="flex gap-2 mt-1">
                                {[67, 103, 134, 206, 275].map((amt) => (
                                    <div
                                        key={amt}
                                        className="bg-white px-2 py-1 rounded border cursor-pointer"
                                        onClick={() => handleAmountClick("Incentive", amt)}
                                    >{`₹${amt}`}</div>
                                ))}
                            </div>

                            <p className="text-gray-500 mt-3">Earnings</p>
                            <div className="flex gap-2 mt-1">
                                {[600, 742, 884, 1048, 1248].map((amt) => (
                                    <div
                                        key={amt}
                                        className="bg-white px-2 py-1 rounded border cursor-pointer"
                                        onClick={() => handleAmountClick("Earnings", amt)}
                                    >{`₹${amt}`}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-16">
                <p className="font-semibold mb-2">Compulsory login</p>
                <div className="flex justify-between text-xs">
                    <div
                        className="bg-white border border-gray-100 px-3 py-2 rounded-lg text-center w-[48%] cursor-pointer"
                        onClick={handleCompulsoryLoginClick}
                    >
                        <div className="flex items-center gap-3">
                            <MoonStar />
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">4am - 3:59am</p>
                                <p className="text-gray-600">9 hrs</p>
                            </div>
                        </div>
                    </div>
                    <div
                        className="bg-white border border-gray-100 px-3 py-2 rounded-lg text-center w-[48%] cursor-pointer"
                        onClick={handleCompulsoryLoginClick}
                    >
                        <div className="flex items-center gap-3">
                            <MoonStar />
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">4am - 3:59am</p>
                                <p className="text-gray-600">9 hrs</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

import React, { useEffect, useState } from "react";
import { customRequest } from "../utils/customRequest";
import { AppLoader } from "../components/loader";
import EmptyPlaceholder from "../components/emptyPlaceholder";
import { AppHeader } from "../components/header";

type RideHistoryItem = {
    order_id: string;
    user_name: string;
    user_phone: string;
    full_address: string;
    delivered_at: string;
};

const RideHistoryScreen: React.FC = () => {
    const [history, setHistory] = useState<RideHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const res = await customRequest("/ride-history");
            if (res.status === 200 && res.data?.ride_history) {
                setHistory(res.data.ride_history);
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen">
            <AppHeader />

            {/* <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Ride History</h1> */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <AppLoader />
                </div>
            ) : history.length === 0 ? (
                <EmptyPlaceholder title="No rides found" subtitle="" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-3">
                    {history.map((ride) => (
                        <div
                            key={ride.order_id}
                            className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-1 border border-gray-100 hover:shadow-2xl transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text font-semibold text-blue-600">Order #{ride.order_id}</span>
                                <span className="ml-auto text-right text-xs text-gray-400">{new Date(ride.delivered_at).toLocaleString()}</span>
                            </div>
                            <div className="mb-0">
                                <span className="font-medium text-gray-700">Customer:</span>{" "}
                                <span className="text-gray-900">{ride.user_name}</span>
                            </div>
                            <div className="mb-0">
                                <span className="font-medium text-gray-700">Address:</span>
                                <div className="text-gray-800 text-sm mt-0">{ride.full_address}</div>
                            </div>
                            <div className="flex justify-end">
                                <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                                    Delivered
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RideHistoryScreen;

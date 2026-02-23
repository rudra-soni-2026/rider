import { ArrowRight, Bell } from "lucide-react";
import React, { useEffect, useState } from "react";
import { customRequest } from "../../../utils/customRequest";

export const UpdateComponent: React.FC = () => {

    const [notifications, setNotifications] = useState<any[]>([]);
    const [videos, setVideos] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getUpdates = async () => {
        setIsLoading(true);
        const res = await customRequest('/notifications');
        setNotifications(res.data.notifications)
        setVideos(res.data.videos);
        setIsLoading(false);
    }

    useEffect(() => {
        getUpdates();
    }, [])


    return (
        <div className="p-3">
            <div className="rounded-lg mb-4 bg-white border border-gray-100 overflow-hidden">
                <div className="text-sm text-white font-bold bg-blue-500 p-3 flex items-center gap-2">
                    <Bell size={18} />
                    <span className="text-sm">
                        NOTIFICATIONS
                    </span>

                    {/* <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg ml-auto">
                        <span className="text-xs">See All</span>
                        <ArrowRight size={14} className="bg-white text-black rounded-full p-[2px]" />
                    </div> */}
                </div>
                {
                    notifications && (notifications ?? []).map((noti, index) => {
                        return (
                            <div className="p-3 flex items-center gap-4 border-b border-gray-100">
                                <div className="flex flex-col items-start justify-between w-full">
                                    <p className="text-sm font-semibold">{noti.title}</p>
                                    <span className="text-gray-500 text-xs">{noti.date}</span>
                                </div>
                                <div className="rounded bg-blue-50 px-1 py-[1px] text-[10px] text-blue-500 font-bold">INFO</div>
                            </div>
                        )
                    })
                }

            </div>
            <h3 className="font-bold mb-3 px-2">QR Code to Receive Payment</h3>

            <div className="px-4">
                <img src="https://i.ibb.co/m5fQsXbL/Whats-App-Image-2025-10-18-at-07-22-22-6e90ee53.jpg" alt="" />
            </div>


            {/* {
                videos && videos.length > 0
                &&
                <div className="flex flex-col">
                    <h3 className="font-bold mb-3">Vidoes for you</h3>
                    <div className="w-full flex gap-3 overflow-x-scroll">
                        {
                            videos && videos.map((item, index) => {
                                return (
                                    <video key={index} className="block h-36 min-w-58 rounded-lg overflow-hidden w-full object-cover"
                                        controls
                                        poster="https://videocdn.cdnpk.net/videos/d6de10ba-f2a1-5241-8ea7-5cee87aa2090/horizontal/thumbnails/large.jpg?ga=GA1.1.1850828893.1736978330&item_id=3378886"
                                        src="https://videocdn.cdnpk.net/videos/d6de10ba-f2a1-5241-8ea7-5cee87aa2090/horizontal/previews/watermarked/large.mp4"></video>

                                )
                            })
                        }
                    </div>
                </div>
            } */}
        </div>
    )
}
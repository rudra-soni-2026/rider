import React, { useEffect, useState } from "react";
import AppBar from "../components/appBar";
import { customRequest } from "../utils/customRequest";
import { AppLoader } from "../components/loader";
import { BanknoteArrowDown } from "lucide-react";
import EmptyPlaceholder from "../components/emptyPlaceholder";

export default function TipStatementScreen() {

    const [tips, setTips] = useState(null);

    const getTipStatement = async () => {
        const res = await customRequest('/tips-statement');
        if (res.status === 200) {
            setTips(res.data.tips)
        }
    }

    useEffect(() => {
        getTipStatement();
    }, [])

    return (
        <div className="flex flex-col h-screen w-full">
            <AppBar title="Tips Statement" onBackPress={true} />
            {
                !tips && <AppLoader />
            }

            {
                tips && tips.length === 0 &&

                <EmptyPlaceholder title="No any tip yet." />
            }

            <div className="p-3 flex flex-col gap-2">
                {
                    tips && tips.map((tip: object, index: number) => {
                        return (
                            <div key={index} className="flex items-center bg-white rounded-lg p-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <BanknoteArrowDown color="green" />
                                </div>
                                <div className="flex flex-col ml-3">
                                    <p className="text-sm font-bold">Tip Received</p>
                                    <p className="text-xs text-gray-500 font-semibold">{tip.date}</p>
                                </div>
                                <div className="ml-auto text-lg font-bold">₹{tip.amount}</div>
                            </div>
                        )
                    })
                }
            </div>

        </div>
    )
}
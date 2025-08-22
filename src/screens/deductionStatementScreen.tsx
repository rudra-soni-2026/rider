import React, { useEffect, useState } from "react";
import AppBar from "../components/appBar";
import { customRequest } from "../utils/customRequest";
import { AppLoader } from "../components/loader";
import { BanknoteArrowUp } from "lucide-react";
import EmptyPlaceholder from "../components/emptyPlaceholder";

export default function DeductionStatementScreen() {

    const [deductions, setDeductions] = useState(null);

    const getTipStatement = async () => {
        const res = await customRequest('/deduction-statement');
        if (res.status === 200) {
            setDeductions(res.data.deductions)
        }
    }

    useEffect(() => {
        getTipStatement();
    }, [])

    return (
        <div className="flex flex-col h-screen w-full">
            <AppBar title="Deduction Statement" onBackPress={true} />
            {
                !deductions && <AppLoader />
            }

            {
                deductions && deductions.length === 0 &&

                <EmptyPlaceholder title="No any deductions yet." />
            }

            <div className="p-3 flex flex-col gap-2">
                {
                    deductions && deductions.map((deduction: object, index: number) => {
                        return (
                            <DeductionCard key={index} transaction={deduction} />
                        )
                    })
                }
            </div>

        </div>
    )
}


interface DeductionCardProps {
    transaction: {
        date: string;
        amount: number;
    };
}

const DeductionCard: React.FC<DeductionCardProps> = ({ transaction }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col bg-white rounded-lg">
            <div className="flex items-center  p-3 " onClick={() => { setOpen(!open) }}>
                <div className="p-2 bg-red-100 rounded-lg">
                    <BanknoteArrowUp color="red" />
                </div>
                <div className="flex flex-col ml-3">
                    <p className="text-sm font-bold">Deducted</p>
                    <p className="text-xs text-gray-500 font-semibold">{transaction.date}</p>
                </div>
                <div className="ml-auto text-lg font-bold">-₹{transaction.amount}</div>
            </div>
            {
                open
                &&
                <div className="flex flex-col">
                    <div className="w-full h-[1px] bg-gray-200"></div>
                    <p className="text-sm p-3"><span className="text-sm font-semibold">Deduction Reason: </span> {transaction.remarks}</p>
                </div>
            }
        </div>
    )
}
import React, { useEffect, useState } from "react";
import AppBar from "../components/appBar";
import { customRequest } from "../utils/customRequest";
import { AppLoader } from "../components/loader";
import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";
import EmptyPlaceholder from "../components/emptyPlaceholder";

export default function PocketStatementScreen() {

    const [deductions, setDeductions] = useState(null);

    const getTipStatement = async () => {
        const res = await customRequest('/pocket-statement');
        if (res.status === 200) {
            setDeductions(res.data.transactions)
        }
    }

    useEffect(() => {
        getTipStatement();
    }, [])

    return (
        <div className="flex flex-col h-screen w-full">
            <AppBar title="Pocket Statement" onBackPress={true} />
            {
                !deductions && <AppLoader />
            }

            {
                deductions && deductions.length === 0 &&

                <EmptyPlaceholder title="No any transaction yet." />
            }

            <div className="p-3 flex flex-col gap-2">
                {
                    deductions && deductions.map((deduction: object, index: number) => {
                        return (
                            <PocketCard key={index} transaction={deduction} />
                        )
                    })
                }
            </div>

        </div>
    )
}


interface PocketCardProps {
    transaction: {
        date: string;
        amount: number;
    };
}

const PocketCard: React.FC<PocketCardProps> = ({ transaction }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col bg-white rounded-lg">
            <div className="flex items-center  p-3 " onClick={() => { setOpen(!open) }}>
                {
                    ['withdraw', 'deduction'].includes(transaction.transaction_type)
                        ?
                        <div className="p-2 bg-red-100 rounded-lg">
                            <BanknoteArrowUp color="red" />
                        </div>
                        :
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BanknoteArrowDown color="green" />
                        </div>
                }
                <div className="flex flex-col ml-3">
                    <p className="text-sm font-bold capitalize">{transaction.transaction_type}</p>
                    <p className="text-xs text-gray-500 font-semibold">{transaction.date}</p>
                </div>
                <div className="ml-auto text-lg font-bold">{['withdraw', 'deduction'].includes(transaction.transaction_type) ? '-' : ''}₹{transaction.amount}</div>
            </div>
            {
                open
                &&
                <div className="flex flex-col">
                    <div className="w-full h-[1px] bg-gray-200"></div>
                    <p className="text-sm p-3"><span className="text-sm font-semibold">Transaction detail: </span> {transaction.remarks}</p>
                </div>
            }
        </div>
    )
}
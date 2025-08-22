import { ArrowLeft, SearchIcon, Share, ShoppingCart } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";


export default function AppBar({ title, onBackPress, share }) {

    const navigate = useNavigate();

    return (
        <div className="flex flex-col">
            <div className="bg-white h-[var(--status-bar-size)]"></div>
            <div className="min-h-[54px] w-full z-10 shadow-xs bg-white flex items-center px-4 sticky top-0">

                {onBackPress && <ArrowLeft onClick={onBackPress === true ? () => navigate(-1) : onBackPress} />}
                <h4 className="ml-4 font-bold">{title}</h4>

                {
                    share &&

                    <div className="flex items-center ml-auto text-[var(--primary-color)]">
                        <ShoppingCart className="" />
                        <span className="ml-1 font-medium">Share</span>
                    </div>

                }
            </div>
        </div>
    )
}
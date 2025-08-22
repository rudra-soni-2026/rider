import React from "react";

export default function EmptyPlaceholder({ title = "Nothing found here.", subtitle }) {
    return (
        <div className="relative w-full h-full flex-1">
            <img src={require("../assets/img/empty_placeholder.png")} className="h-full w-full object-cover" />
            <p className="absolute bottom-48 text-center left-0 right-0 font-semibold">{title}</p>
        </div>
    )
}
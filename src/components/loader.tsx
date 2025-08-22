import React from "react";
import { RotatingLines } from "react-loader-spinner";
import { colorPrimary } from "../consts/colors";


export const AppLoader = () => {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <RotatingLines strokeColor={colorPrimary} height={40} width={40} />
        </div>
    )
}
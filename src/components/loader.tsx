import { HashLoader } from "react-spinners";
import { colorPrimary } from "../consts/colors";


export const AppLoader = () => {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <HashLoader color={colorPrimary} size={40} />
        </div>
    )
}
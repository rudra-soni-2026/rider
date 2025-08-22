import { BadgeCheckIcon, BeerIcon, Bell, Bike, Boxes, FileText, Home, LayoutGrid, PackageCheck, ShoppingBasket, User2Icon, Wallet } from "lucide-react"
import React from "react";
import { currentSelectedBottomTabIndex } from "../state/uiState";


export const BottomNavigation: React.FC = () => {


    const handleClickNavItem = (position: number) => {
        currentSelectedBottomTabIndex.value = position;
    }

    return <>
        {/* shadow-[0_-2px_12px_-2px_rgba(0,0,0,0.05)] */}
        {/* fixed bottom-0 left-0 right-0  */}
        <div className="z-10 absolute bottom-0 right-0 left-0 flex sm:hidden justify-around text-xs py-2 bg-white gap-[1px]  shadow-[0_-2px_12px_-2px_rgba(0,0,0,0.05)]">
            <BottomNavigationItem
                icon={<Bike />}
                text="Rides"
                isSelected={currentSelectedBottomTabIndex.value == 0}
                onClick={() => handleClickNavItem(0)} />
            <BottomNavigationItem
                icon={<Wallet />}
                text="Pocket"
                isSelected={currentSelectedBottomTabIndex.value == 1}
                onClick={() => handleClickNavItem(1)} />
            <BottomNavigationItem
                icon={<FileText />}
                text="Feed"
                isSelected={currentSelectedBottomTabIndex.value == 2}
                onClick={() => handleClickNavItem(2)} />
            <BottomNavigationItem
                icon={<Bell />}
                text="Updates"
                isSelected={currentSelectedBottomTabIndex.value == 4}
                onClick={() => handleClickNavItem(4)} />
        </div>
    </>
}

const BottomNavigationItem = ({ icon, text, isSelected, onClick }) => {
    return (
        <div className={`${isSelected ? 'text-black' : 'text-gray-400'} flex flex-col items-center gap-1 w-1/4`} onClick={onClick}>
            {
                isSelected
                &&
                <div className="absolute top-0 rounded-b w-[40px] h-[3px] bg-black mb-1"></div>
            }
            {icon}
            <span>{text}</span>
        </div>
    )
}
import React from "react";
import { BottomNavigation } from "../../components/bottomNavigation";
import { currentSelectedBottomTabIndex } from "../../state/uiState";
import { FeedComponent } from "./components/feed";
import PocketComponent from "./components/pocket";
import { UpdateComponent } from "./components/updates";
import { AppHeader } from "../../components/header";
import RidesComponent from "./components/rides";


export const HomeScreen: React.FC = () => {
    return (
        <div className="relative h-screen w-screen flex flex-col overflow-y-hidden">
            <AppHeader />

            <div className="h-full pb-[60px] overflow-y-auto">
                {
                    currentSelectedBottomTabIndex.value === 0
                        ?
                        <RidesComponent />
                        :
                        currentSelectedBottomTabIndex.value === 1
                            ?
                            <PocketComponent />
                            :
                            currentSelectedBottomTabIndex.value === 2
                                ?
                                <FeedComponent />
                                :
                                <UpdateComponent />

                }

            </div>

            <BottomNavigation />
        </div>
    )
}
import React, { useEffect } from 'react';
import { showAlertPopup, showAlertPopupImage, showAlertPopupTitle } from '../state/uiState';

const AlertPopup = () => {

    const onClose = () => {
        showAlertPopup.value = null;
        showAlertPopupImage.value = null;
        showAlertPopupTitle.value = null;
    }

    useEffect(() => {
        if (showAlertPopup.value) {
            window.history.pushState({ alertPopup: true }, '');
            const handlePopState = () => {
                if (onClose) onClose();
            };
            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showAlertPopup.value, onClose]);

    if (!showAlertPopup.value) return null;

    // Support both string and object for showAlertPopup.value
    const popupValue = showAlertPopup.value;

    // Type guard for popup object
    type PopupObject = {
        message: string;
        buttons?: { label: string; value: any }[];
        onButtonClick?: (value: any) => void;
    };

    function isPopupObject(val: unknown): val is PopupObject {
        return (
            typeof val === "object" &&
            val !== null &&
            "message" in val &&
            typeof (val as any).message === "string"
        );
    }

    const message = isPopupObject(popupValue) ? popupValue.message : typeof popupValue === "string" ? popupValue : "";
    const buttons = isPopupObject(popupValue) && Array.isArray(popupValue.buttons) ? popupValue.buttons : null;
    const onButtonClick = isPopupObject(popupValue) && typeof popupValue.onButtonClick === "function" ? popupValue.onButtonClick : null;

    // Only render image if it's a string (URL)
    const alertImage = typeof showAlertPopupImage.value === "string" ? showAlertPopupImage.value : null;
    // Only render title if it's a string
    const alertTitle = typeof showAlertPopupTitle.value === "string" ? showAlertPopupTitle.value : "Alert";

    return (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl  w-11/12 max-w-md shadow-lg">
                <div className="flex justify-between items-center border-b border-gray-100 px-4 py-3">
                    <h3 className="text-lg m-0 font-bold">{alertTitle}</h3>
                </div>
                <div className="mt-2 p-4 border-b border-gray-100 text-sm">
                    {typeof message === "string" ? message : ""}
                    {alertImage && <img src={alertImage} className='mt-2' />}
                </div>
                <div className="text-right px-4 py-3 flex gap-2 justify-end">
                    {buttons ? (
                        buttons.map((btn: { label: string, value: any }, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    if (onButtonClick) onButtonClick(btn.value);
                                    onClose();
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-full cursor-pointer text-sm"
                            >
                                {btn.label}
                            </button>
                        ))
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 rounded-full cursor-pointer text-black text-sm"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertPopup;

import { ArrowLeft, ChevronRight, Ticket } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
import { AppHeader } from "../components/header";

const tickets = [
    {
        id: "TCK-1001",
        subject: "Payment not received",
        status: "Open",
        date: "2025-07-15",
        icon: <Ticket size={20} className="text-yellow-500" />,
    },
    {
        id: "TCK-1002",
        subject: "App crashes on login",
        status: "Resolved",
        date: "2025-07-10",
        icon: <span className="text-xl">🛠️</span>,
    },
    {
        id: "TCK-1003",
        subject: "Unable to update profile",
        status: "In Progress",
        date: "2025-07-08",
        icon: <span className="text-xl">👤</span>,
    },
];

const statusColors: Record<string, string> = {
    Open: "bg-red-100 text-red-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
};

const SupportTicketsScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-gradient-to-b from-yellow-50 to-white text-gray-800 font-sans">
                <AppHeader />
            <div className="flex flex-col bg-yellow-500 roxunded-b-xl shadow-lg">
                {/* <div className="px-4 py-4 flex items-end space-x-4 bg-yellow-500 rounded-b-xl">
                    <div>
                        <p className="font-bold text-2xl text-white">Support Tickets</p>
                        <p className="text-sm text-yellow-100 mt-1">Track your support requests</p>
                    </div>
                    <span className="ml-auto text-4xl">🎟️</span>
                </div> */}
            </div>

            <div className="mt-6 mx-3">
                <p className="font-medium mb-2 text-lg">Your Tickets</p>
                <div className="space-y-3">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="flex items-center bg-white rounded-lg shadow p-4 hover:bg-yellow-50 transition cursor-pointer"
                        >
                            <div className="mr-3">{ticket.icon}</div>
                            <div className="flex-1">
                                <p className="font-semibold">{ticket.subject}</p>
                                <p className="text-xs text-gray-500">{ticket.id} • {ticket.date}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]} mr-2`}>
                                {ticket.status}
                            </span>
                            <ChevronRight size={20} className="text-gray-400" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 mx-3">
                <p className="font-medium mb-2 text-lg">Need more help?</p>
                <div className="bg-yellow-100 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                        <p className="font-semibold text-yellow-900">Contact Support</p>
                        <p className="text-xs text-yellow-700">Call us at 1800-123-4567 or email support@kuiklo.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketsScreen;

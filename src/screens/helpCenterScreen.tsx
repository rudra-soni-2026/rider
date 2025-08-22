import { ArrowLeft, ChevronRight, Headphones } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router';
import { AppHeader } from '../components/header';

const helpTopics = [
    {
        icon: <Headphones size={20} className="text-blue-500" />,
        title: "How to use the app",
        description: "Step-by-step guide to get started",
    },
    {
        icon: <span className="text-xl">🔒</span>,
        title: "Account & Security",
        description: "Manage your account and privacy settings",
    },
    {
        icon: <span className="text-xl">💸</span>,
        title: "Payments & Earnings",
        description: "Learn about payouts and incentives",
    },
    {
        icon: <span className="text-xl">🛠️</span>,
        title: "Technical Support",
        description: "Troubleshoot app issues",
    },
    {
        icon: <span className="text-xl">📞</span>,
        title: "Contact Support",
        description: "Reach out to our support team",
    },
];

const HelpCenterScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 font-sans">
            <AppHeader />
            <div className="mt-6 mx-3">
                <FAQAccordion />
            </div>
        </div>
    );
};

// FAQ Data
const faqs = [
    {
        q: "How do I become a delivery rider?",
        a: (
            <div>
                To join as a rider:
                <ul className="list-disc ml-5 mt-1">
                    <li>Download the Kuiklo HeroZ App.</li>
                    <li>Upload documents (ID proof, driving license, bike RC, bank details).</li>
                    <li>Complete on boarding Process.</li>
                    <li>Start accepting deliveries.</li>
                </ul>
            </div>
        ),
    },
    {
        q: "What are the eligibility requirements?",
        a: (
            <ul className="list-disc ml-5">
                <li>Must be 18 years or older.</li>
                <li>Valid driving license.</li>
                <li>Two-wheeler vehicle (own or rented).</li>
                <li>Smartphone with internet access.</li>
                <li>Local ID/address proof.</li>
            </ul>
        ),
    },
    {
        q: "What are the working hours?",
        a: (
            <ul className="list-disc ml-5">
                <li>Flexible shifts available.</li>
                <li>You can choose part-time or full-time time slots.</li>
            </ul>
        ),
    },
    {
        q: "How much can I earn?",
        a: (
            <div>
                Earnings depend on:
                <ul className="list-disc ml-5 mt-1">
                    <li>Number of deliveries completed.</li>
                    <li>Incentives, bonuses, or peak-hour rates.</li>
                </ul>
                <div className="mt-2">Average riders earn ₹15,000–₹30,000/month.<br />Weekly payout options are available.</div>
            </div>
        ),
    },
    {
        q: "How many deliveries are expected per hour?",
        a: (
            <ul className="list-disc ml-5">
                <li>Typically 3–6 deliveries per hour.</li>
                <li>This depends on the location, time of day, and demand.</li>
            </ul>
        ),
    },
    {
        q: "What if I don’t deliver in 10 minutes?",
        a: (
            <ul className="list-disc ml-5">
                <li>Small delays are understandable in traffic or weather.</li>
                <li>Repeated late deliveries can reduce incentives or affect your rating.</li>
                <li>Always keep the app updated on any issues during delivery.</li>
            </ul>
        ),
    },
    {
        q: "What should I do if the customer is not available?",
        a: (
            <ul className="list-disc ml-5">
                <li>Call the customer using the in-app call button.</li>
                <li>Wait as per app policy (usually 3–5 minutes).</li>
                <li>If unreachable, mark the delivery as "Customer Unavailable".</li>
            </ul>
        ),
    },
    {
        q: "What if the order is wrong or damaged?",
        a: (
            <ul className="list-disc ml-5">
                <li>Report the issue through the app before leaving the store.</li>
                <li>Never deliver damaged or incorrect items.</li>
                <li>The support team will guide you on what to do next.</li>
            </ul>
        ),
    },
    {
        q: "Is there any dress code or uniform?",
        a: (
            <ul className="list-disc ml-5">
                <li>Yes, riders may be required to wear the app's T-shirt or jacket.</li>
                <li>Helmet and delivery bag are provided.</li>
            </ul>
        ),
    },
    {
        q: "Who do I contact for support?",
        a: (
            <div>
                Use the in-app support or helpline for:
                <ul className="list-disc ml-5 mt-1">
                    <li>Technical issues.</li>
                    <li>Delivery problems.</li>
                    <li>Payment or incentive-related queries.</li>
                </ul>
            </div>
        ),
    },
    {
        q: "Do I need to pay anything to join?",
        a: (
            <div>
                Yes, a small registration fee is charged for T-shirt & Delivery Bag.
            </div>
        ),
    },
];

// Accordion Component

const FAQAccordion: React.FC = () => {
    const [openIdx, setOpenIdx] = React.useState<number | null>(null);

    return (
        <div className="space-y-3">
            {faqs.map((faq, idx) => (
                <div
                    key={idx}
                    className={`bg-white rounded-lg shadow p-4 transition cursor-pointer border border-gray-100 ${openIdx === idx ? 'ring-2 ring-blue-400' : 'hover:bg-blue-50'}`}
                    onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">{faq.q}</span>
                        <span className="ml-2 text-blue-500 text-xl">{openIdx === idx ? '-' : '+'}</span>
                    </div>
                    {openIdx === idx && (
                        <div className="pt-3 text-sm text-gray-700 animate-fade-in">
                            {faq.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default HelpCenterScreen;

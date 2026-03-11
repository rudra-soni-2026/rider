import { PhoneCallIcon, MapPinIcon, UserIcon, CreditCardIcon, ClockIcon, PackageIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BeatLoader } from 'react-spinners';
import EmptyPlaceholder from '../../../components/emptyPlaceholder';
import { AppLoader } from '../../../components/loader';
import { availableForRide, showAlertPopup } from '../../../state/uiState';
import { availableRidesData, loggedInUser, qrCodeScanResult } from '../../../state/userState';
import { customRequest } from '../../../utils/customRequest';
import sendDataToReactNative from '../../../utils/nativeCommunication';
import { rootBase } from '../../../consts/links';

// ─── Container ────────────────────────────────────────────────────────────────

const RidesComponent: React.FC = () => {

  const getAvailableRides = async () => {
    if (availableForRide.value) {
      const res = await customRequest("/available-rides");
      if (res.status === 200) {
        availableRidesData.value = res.data.available_ride;
      }
    }
  };

  useEffect(() => {
    getAvailableRides();
    const interval = setInterval(getAvailableRides, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!availableForRide.value) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <EmptyPlaceholder title='Turn your status on to see orders.' subtitle="" />
      </div>
    );
  }

  if (!Array.isArray(availableRidesData.value)) {
    return <AppLoader />;
  }

  // ✅ Only one order is ever assigned to the rider at a time
  const order = availableRidesData.value[0] ?? null;

  if (!order) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <EmptyPlaceholder title='No active orders' subtitle="New orders will appear here automatically" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <ActiveOrderCard order={order} />
    </div>
  );
};

export default RidesComponent;

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  order_id: string;
  pickup_accepted: boolean;
  user_longitude: number;
  user_latitude: number;
  order_date_time: string;
  amount_to_collect: number;
  tip_amount?: number;
  user_address_type: string;
  user_name: string;
  user_area: string;
  payment_mode: string;
  phone_number: string;
  pickup_status: string;
};

// ─── Single Order Card ────────────────────────────────────────────────────────

function ActiveOrderCard({ order }: { order: Order }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const prevQrCodeValue = useRef<string | null>(null);

  // ─── Navigate to Delivery Map ───────────────────────────────────────────────

  const openDeliveryMap = () => {
    const riderId = JSON.stringify(loggedInUser.value?.id);
    navigate('/delivery-map', {
      state: {
        orderId: order.order_id,
        orderLongitude: Number(order.user_longitude),
        orderLatitude: Number(order.user_latitude),
        payment_mode: order.payment_mode,
        riderId: riderId,
      }
    });
  };

  // ─── Primary Action Button ──────────────────────────────────────────────────

  const handleOrderPickup = async () => {
    if (order.pickup_accepted) {
      setIsLoading(true);
      try {
        // Mark as in-transit if not already
        if (order.pickup_status !== 'in_transit') {
          await customRequest('/mark-order-intransist', {
            method: "POST",
            data: { order_id: order.order_id }
          } as any);
        }
        openDeliveryMap();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Trigger native QR scan
      sendDataToReactNative({
        action: 'scan-qr-code',
        orderId: order.order_id
      });
    }
  };

  // ─── QR Code Handler ────────────────────────────────────────────────────────

  const handleChangeOrderStatus = async () => {
    if (qrCodeScanResult.value !== null) {
      let qrCodeOrderFound = false;

      const url = (qrCodeScanResult.value ?? '').split(rootBase)[1];
      setIsLoading(true);
      qrCodeScanResult.value = null;
      qrCodeOrderFound = true;

      const res = await customRequest(url, {
        method: "POST",
        data: { order_id: order.order_id }
      } as any);

      if (res.status !== 200) {
        showAlertPopup.value = "Failed to accept order. Please try again.";
      }

      setIsLoading(false);

      if (!qrCodeOrderFound) {
        showAlertPopup.value = "Invalid QR Code";
        qrCodeScanResult.value = null;
      }
    }
  };

  useEffect(() => {
    if (
      qrCodeScanResult.value &&
      qrCodeScanResult.value !== "" &&
      qrCodeScanResult.value !== prevQrCodeValue.current
    ) {
      prevQrCodeValue.current = qrCodeScanResult.value;
      handleChangeOrderStatus();
    }
  }, [qrCodeScanResult.value]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isCOD = order.payment_mode === "COD";
  const hasTip = order.tip_amount != null && (order.tip_amount ?? 0) > 0;

  return (
    <div className="flex flex-col h-full p-4 gap-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Active Order</span>
          <span className="text-xl font-bold text-gray-900 mt-0.5">{order.order_id}</span>
          <div className="flex items-center gap-1 mt-1">
            <ClockIcon size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">{order.order_date_time}</span>
          </div>
        </div>

        {/* Badges + Call */}
        <div className="flex items-center gap-2">
          {hasTip && (
            <div className="text-xs text-white font-semibold rounded-full px-3 py-1 bg-green-500">
              Tip ₹{order.tip_amount}
            </div>
          )}
          <div className="text-xs text-white font-semibold rounded-full px-3 py-1 bg-yellow-500 capitalize">
            {order.user_address_type}
          </div>
          <button
            onClick={() => window.open(`tel:${order.phone_number}`, "_blank")}
            className="bg-white border border-gray-200 rounded-full p-2.5 shadow-sm active:scale-95 transition"
          >
            <PhoneCallIcon size={18} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* ── Order Details Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">

        {/* Customer */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
          <div className="bg-blue-50 rounded-full p-2">
            <UserIcon size={16} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Customer</span>
            <span className="font-semibold text-gray-800">{order.user_name}</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-50">
          <div className="bg-red-50 rounded-full p-2 mt-0.5">
            <MapPinIcon size={16} className="text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Delivery Address</span>
            <span className="font-semibold text-gray-800">{order.user_area}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
          <div className="bg-green-50 rounded-full p-2">
            <CreditCardIcon size={16} className="text-green-500" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-xs text-gray-400">Payment</span>
            <span className="font-semibold text-gray-800">
              {isCOD ? "Cash on Delivery (COD)" : "Online Payment"}
            </span>
          </div>
          {/* Online paid badge */}
          {!isCOD && (
            <div className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 rounded-full px-3 py-1">
              Paid ✓
            </div>
          )}
        </div>

        {/* COD amount — prominent warning */}
        {isCOD && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50">
            <div className="bg-red-100 rounded-full p-2">
              <PackageIcon size={16} className="text-red-500" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-xs text-red-400 font-medium">Collect from Customer</span>
              <span className="text-xl font-bold text-red-600">₹{order.amount_to_collect}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Status Indicator ── */}
      {order.pickup_accepted && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-600 font-medium">
            {order.pickup_status === 'in_transit' ? 'In Transit' : 'Pickup Accepted'}
          </span>
        </div>
      )}

      {/* ── Action Button ── */}
      <button
        className={`
          w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg
          active:scale-95 transition-all flex items-center justify-center
          ${order.pickup_accepted
            ? 'bg-green-500 active:bg-green-600'
            : 'bg-blue-600 active:bg-blue-700'
          }
        `}
        onClick={handleOrderPickup}
        disabled={isLoading}
      >
        {isLoading
          ? <BeatLoader color="white" size={10} />
          : order.pickup_accepted
            ? "📍 Open Delivery Map"
            : "📷 Scan QR to Accept"
        }
      </button>

    </div>
  );
}

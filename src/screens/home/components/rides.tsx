import { PhoneCallIcon, MapPinIcon, UserIcon, CreditCardIcon, PackageIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BeatLoader } from 'react-spinners';
import formatOrderId from '../../../utils/formatOrderId';
import EmptyPlaceholder from '../../../components/emptyPlaceholder';
import { AppLoader } from '../../../components/loader';
import { availableForRide, showAlertPopup } from '../../../state/uiState';
import { availableRidesData, loggedInUser, qrCodeScanResult } from '../../../state/userState';
import { customRequest } from '../../../utils/customRequest';
import sendDataToReactNative from '../../../utils/nativeCommunication';
import { rootBase } from '../../../consts/links';

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

// ─── Container ────────────────────────────────────────────────────────────────

const RidesComponent: React.FC = () => {

  const getAvailableRides = async () => {
    if (availableForRide.value) {
      const res = await customRequest("/available-rides");
      if (res.status === 200 && res.data && res.data.data) {
        const rides = (res.data.data.available_ride || []).map((order: any) => {
          let addressData = { formattedAddress: "Address not available", lat: 0, lng: 0, house_no: "", street: "" };
          try {
            if (order.order_address) {
              addressData = JSON.parse(order.order_address);
            }
          } catch (e) {
            console.error("Failed to parse order_address", e);
          }

          let amountToCollect = Number(order.totalAmount);
          try {
            if (order.calculation_details) {
              const calcDetails = typeof order.calculation_details === 'string'
                ? JSON.parse(order.calculation_details)
                : order.calculation_details;
              if (calcDetails && calcDetails.total) {
                amountToCollect = Number(calcDetails.total);
              }
            }
          } catch (e) {
            console.error("Failed to parse calculation_details", e);
          }

          return {
            order_id: order.id,
            pickup_accepted: order.status === 'pickup_accepted' || order.status === 'in_transit',
            pickup_status: order.status,
            user_longitude: Number(addressData.lng),
            user_latitude: Number(addressData.lat),
            order_date_time: new Date(order.createdAt).toLocaleString(),
            amount_to_collect: amountToCollect,
            tip_amount: 0,
            user_address_type: "Home",
            user_name: order.user?.name || "Customer",
            user_area: addressData.formattedAddress,
            payment_mode: order.payment_method,
            phone_number: order.user?.phone || "0000000000",
          };
        });
        availableRidesData.value = rides;
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

  const rides = availableRidesData.value;

  if (rides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <EmptyPlaceholder title='No active orders' subtitle="New orders will appear here automatically" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto px-4 py-8 gap-8">
      {rides.map((order) => (
        <ActiveOrderCard key={order.order_id} order={order} />
      ))}
    </div>
  );
};

export default RidesComponent;

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

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3 shadow-sm active:scale-[0.98] transition-transform">

      {/* ── Compact Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">{formatOrderId(order.order_id)}</span>
          <span className="text-[9px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">
            {order.user_address_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-300 font-bold uppercase">{order.order_date_time.split(',')[1]}</span>
          <button
            onClick={() => window.open(`tel:${order.phone_number}`, "_blank")}
            className="bg-blue-50 text-blue-600 rounded-lg p-2 active:scale-95 transition"
          >
            <PhoneCallIcon size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Compact Content ── */}
      <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
        <div className="flex items-center gap-3">
          <UserIcon size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 truncate">{order.user_name}</span>
          <div className="ml-auto flex items-center gap-1.5 bg-white px-2 py-1 rounded shadow-sm">
            <CreditCardIcon size={12} className={isCOD ? "text-red-400" : "text-green-400"} />
            <span className="text-[10px] font-bold text-slate-500 uppercase">{isCOD ? "COD" : "PAID"}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPinIcon size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <span className="text-xs font-bold text-slate-600 leading-tight line-clamp-2">{order.user_area}</span>
        </div>

        {isCOD && (
          <div className="mt-1 flex items-center justify-between bg-red-100/50 px-3 py-2 rounded-lg border border-red-100">
            <span className="text-[9px] text-red-500 font-black uppercase tracking-widest">Collect Cash</span>
            <span className="text-lg font-black text-red-600">₹{order.amount_to_collect}</span>
          </div>
        )}
      </div>

      {/* ── Action Area ── */}
      <div className="flex gap-2">
        {order.pickup_accepted && (
          <div className="bg-green-50 px-3 rounded-xl border border-green-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-green-600 uppercase tracking-wider whitespace-nowrap">
              {order.pickup_status === 'in_transit' ? 'In Transit' : 'Accepted'}
            </span>
          </div>
        )}

        <button
          className={`
            flex-1 py-3.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all
            active:scale-[0.97] flex items-center justify-center gap-2
            ${order.pickup_accepted
              ? 'bg-green-500 shadow-green-100'
              : 'bg-slate-900 shadow-slate-200'
            }
          `}
          onClick={handleOrderPickup}
          disabled={isLoading}
        >
          {isLoading ? (
            <BeatLoader color="white" size={6} />
          ) : (
            <>
              {order.pickup_accepted ? (
                <>
                  <MapPinIcon size={16} strokeWidth={2.5} />
                  <span>Go to Map</span>
                </>
              ) : (
                <>
                  <PackageIcon size={16} strokeWidth={2.5} />
                  <span>Accept Ride</span>
                </>
              )}
            </>
          )}
        </button>
      </div>

    </div>
  );
}

import { PhoneCallIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BeatLoader } from 'react-spinners';
import EmptyPlaceholder from '../../../components/emptyPlaceholder';
import { AppLoader } from '../../../components/loader';
import { availableForRide, showAlertPopup } from '../../../state/uiState';
import { availableRidesData, qrCodeScanResult } from '../../../state/userState';
import { customRequest } from '../../../utils/customRequest';
import sendDataToReactNative from '../../../utils/nativeCommunication';
import { rootBase } from '../../../consts/links';


const RidesComponent: React.FC = () => {

  const getAvailableRides = async () => {
    if (availableForRide.value) {
      const res = await customRequest("/available-rides");
      if (res.status === 200) {
        availableRidesData.value = res.data.available_ride
      }
    }
  }

  useEffect(() => {
    getAvailableRides();
    const interval = setInterval(getAvailableRides, 10000);
    return () => clearInterval(interval);
  }, [])

  return (
    !availableForRide.value
      ?
      <div className="w-full h-full p-3 text-sm font-sans overflow-y-auto">
        <EmptyPlaceholder title='Turn your status to see orders.' subtitle="" />
      </div>
      :
      <div className="w-full h-full p-3 text-sm font-sans overflow-y-auto">
        {
          !Array.isArray(availableRidesData.value)
            ? <AppLoader />
            : availableRidesData.value.length === 0
              ? <EmptyPlaceholder title='No any order found' subtitle="" />
              : null
        }
        <div className="flex flex-col gap-2">
          {
            (availableRidesData.value ?? []).map((order: any, index: number) => {
              return (
                <OrderPickupCard key={index} order={order} />
              )
            })
          }
        </div>
      </div>
  );
};

export default RidesComponent;

type Order = {
  order_id: string;
  pickup_accepted: boolean;
  user_longitude: number;
  user_latitude: number;
  order_date_time: string;
  tip_amount?: number;
  user_address_type: string;
  user_name: string;
  user_area: string;
  payment_mode: string;
  phone_number: string;
  // add other fields as needed
};

interface OrderPickupCardProps {
  order: Order;
}

function OrderPickupCard({ order }: OrderPickupCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const prevQrCodeValue = useRef<string | null>(null);

  // Handler for pickup button
  const handleOrderPickup = async () => {
    if (order.pickup_accepted) {
      await customRequest('/mark-order-intransist', { method: "POST", data: { order_id: order.order_id } } as any);
      navigate('/delivery-map', { state: { orderId: order.order_id, orderLongitude: order.user_longitude, orderLatitude: order.user_latitude, payment_mode: order.payment_mode } });
    } else {
      // Trigger native QR scan via React Native bridge
      sendDataToReactNative({
        action: 'scan-qr-code',
        orderId: order.order_id
      });
    }
  };


  const handlechangeOrderStatus = async () => {
    if (qrCodeScanResult.value !== null) {
      let qrCodeOrderFound = false;
      for (const item of availableRidesData.value) {
        // if ((qrCodeScanResult.value).includes(`${rootlink}/delivery/accept/${item.order_id}`)) {
        // if (qrCodeScanResult.value ===  "ACCEPT_ORDER_" + item.order_id) {
        const url = (qrCodeScanResult.value ?? '').split(rootBase)[1];
        setIsLoading(true);
        qrCodeScanResult.value = null;
        qrCodeOrderFound = true;
        const res = await customRequest(url, { method: "POST", data: { order_id: item.order_id } } as any);
        if (res.status === 200) {
          // sendDataToReactNative({
          //   action: 'show-toast',
          //   message: res.data?.message || (res.error?.message ?? 'Unknown error')
          // });
        }
        setIsLoading(false);
        break; // Stop after first match
        // }
      }
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
      handlechangeOrderStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeScanResult.value]);

  return (
    <div className="flex flex-col rounded-lg bg-white shadow-xs">
      <div className="flex items-center p-3 gap-1">
        <div className="flex flex-col mr-auto">
          <span className='font-bold'>{order.order_id}</span>
          <span className='text-xs text-gray-500'>{order.order_date_time}</span>
        </div>
        {
          order.tip_amount !== null && order.tip_amount > 0
          &&
          <div className="text-xs text-white rounded capitalize px-2 py-[2px] bg-green-500">Tip: ₹{order.tip_amount}</div>
        }
        <div className="text-xs text-white rounded capitalize px-2 py-[2px] bg-yellow-500">{order.user_address_type}</div>

        <div className="rounded bg-gray-100 p-2 rounded-full ml-1" onClick={() => { window.open(`tel:${order.phone_number}`, "_blank") }}>
          <PhoneCallIcon size={20} />
        </div>
      </div>
      <div className="w-full h-[1px] bg-gray-100"></div>
      <div className="p-3">
        <p><span className='font-semibold'>Order By:</span> {order.user_name}</p>
        <p><span className='font-semibold'>Address:</span> {order.user_area}</p>
        <p><span className='font-semibold'>Payment Mode:</span> {order.payment_mode === "COD" ? "Cash on Delivery (COD)" : "Online Payment"}</p>
        {
          order.payment_mode === "COD"
          &&
          <p className='text-red-500 font-semibold'><span className=''>Amount to Collect:</span> ₹{order.amount_to_collect}</p>
        }

      </div>
      <div className="w-full h-[1px] bg-gray-100"></div>
      <div className="flex items-center p-3" onClick={handleOrderPickup}>
        <div className={`flex items-center justify-center w-full p-3 rounded-lg text-white text-center font-bold ${order.pickup_accepted ? 'bg-green-500' : 'bg-blue-500'} bg-blue-500`}>
          {
            isLoading
              ? <BeatLoader color="white" size={25} />
              : order.pickup_accepted
                ? "Open Map"
                : "Scan QR to Accept"
          }
        </div>
      </div>
    </div>
  )
}

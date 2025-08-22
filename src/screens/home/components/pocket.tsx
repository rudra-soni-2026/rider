import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, ChevronRight, IndianRupee, ReceiptIndianRupeeIcon, TrendingDown } from 'lucide-react';
import { customRequest } from '../../../utils/customRequest';
import { loggedInUser, pocketData } from '../../../state/userState';
import { AppLoader } from '../../../components/loader';
import { useNavigate } from 'react-router';
import { showAlertPopup, showAlertPopupTitle } from '../../../state/uiState';
import sendDataToReactNative from '../../../utils/nativeCommunication';

interface PocketData {
  balance: number;
  available_cash_limit: number;
  tip_collected: number;
  payout: number;
  // Add other properties as needed
}

const PocketComponent: React.FC = () => {
  const navigate = useNavigate();
  // Withdraw popup state
  const [showWithdrawPopup, setShowWithdrawPopup] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Deposit popup state
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  const getPocketData = async () => {
    const res = await customRequest('/pocket');
    if (res.status === 200) {
      pocketData.value = res.data;
    }
  };

  useEffect(() => {
    getPocketData();
  }, []);

  const data: PocketData | undefined = pocketData.value as PocketData | undefined;

  if (!data) {
    return (
      <AppLoader />
    );
  }




  const handleRazorpayPayment = async () => {
    const amount = parseInt(depositAmount, 10);
    if (isNaN(amount) || amount < 100) {
      setDepositError('Minimum amount to deposit is ₹100');
      return;
    }

    const createPaymentOrder = await customRequest("/razorpay-create-order", { method: "POST", data: { user_id: loggedInUser.value.id, amount: amount, payment_for: "Rider deposit amount" } });

    sendDataToReactNative({
      action: "razorpay-payment",
      amount: depositAmount,
      order_id: createPaymentOrder.data.id ?? '',
      phone: loggedInUser.value.phone,
      user_id: loggedInUser.value.id,
      user_name: loggedInUser.value.name
    })
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount < 399) {
      setWithdrawError('Minimum amount to withdraw is ₹399');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError('');
    try {
      const res = await customRequest('/withdraw', { method: 'POST', data: { amount } });
      // if (res.status === 200) {
      setShowWithdrawPopup(false);
      showAlertPopupTitle.value = 'Withdraw Request';
      showAlertPopup.value = 'Withdraw request has been raised successfully. Amount will be transferred in 2 days.';
      setWithdrawAmount('');
      // } else {
      //   setWithdrawError(res.data?.message || 'Failed to raise withdraw request');
      // }
    } catch (e) {
      setWithdrawError('Network error. Please try again.');
    }
    setWithdrawLoading(false);
  };

  return (
    <div className="text-sm font-sans px-3">

      {/* Withdraw Popup */}
      {showWithdrawPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-lg p-6">
            <h3 className="text-lg font-bold mb-2">Withdraw Amount</h3>
            <p className="mb-2 text-gray-600">Enter the amount you want to withdraw. Minimum amount to withdraw is ₹399.</p>
            <input
              type="number"
              min={399}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              disabled={withdrawLoading}
            />
            {withdrawError && <p className="text-red-500 text-xs mb-2">{withdrawError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-black text-white py-2 rounded-md font-bold"
                onClick={handleWithdraw}
                disabled={withdrawLoading}
              >
                {withdrawLoading ? 'Processing...' : 'Withdraw'}
              </button>
              <button
                className="flex-1 border border-black py-2 rounded-md font-bold"
                onClick={() => { setShowWithdrawPopup(false); setWithdrawError(''); setWithdrawAmount(''); }}
                disabled={withdrawLoading}
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Withdrawals are processed within 2 days.
            </div>
          </div>
        </div>
      )}

      {/* Deposit Popup */}
      {showDepositPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-lg p-6">
            <h3 className="text-lg font-bold mb-2">Deposit Amount</h3>
            <p className="mb-2 text-gray-600">Enter the amount you want to deposit to your pocket.</p>
            <input
              type="number"
              min={100}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
              placeholder="Enter amount (min ₹100)"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              disabled={depositLoading}
            />
            {depositError && <p className="text-red-500 text-xs mb-2">{depositError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-black text-white py-2 rounded-md font-bold"
                onClick={handleRazorpayPayment}
                disabled={depositLoading}
              >
                {depositLoading ? 'Processing...' : 'Deposit'}
              </button>
              <button
                className="flex-1 border border-black py-2 rounded-md font-bold"
                onClick={() => { setShowDepositPopup(false); setDepositError(''); setDepositAmount(''); }}
                disabled={depositLoading}
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Deposits are processed instantly via Razorpay.
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-gray-600 mb-2 mt-6 font-bold text-lg">KUIKLO POCKET</p>

      <div className="bg-white p-4 rounded-lg border border-gray-100 mb-4">
        <div className="flex items-center mb-6">
          <p>Pocket balance</p>
          <p className="font-semibold ml-auto mr-2">₹{data.balance}</p>
          {/* <ChevronRight size={16} /> */}
        </div>
        <div className="flex items-center mb-6">
          <p>Available cash limit</p>
          <p className="font-semibold ml-auto mr-2">₹{data.available_cash_limit}</p>
          {/* <ChevronRight size={16} /> */}

        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 border border-black py-3 rounded-md font-bold"
            onClick={() => setShowDepositPopup(true)}
          >
            Deposit
          </button>
          <button
            className="flex-1 bg-black text-white py-3 rounded-md font-bold"
            onClick={() => setShowWithdrawPopup(true)}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-3 rounded-lg mb-4 flex items-center" onClick={() => { navigate("/tips-statement") }}>
        <p className='font-semibold'>💰 Customer tips balance</p>
        <p className="font-semibold mr-2 ml-auto">₹{data.tip_collected}</p>
        <ChevronRight size={16} />
      </div>

      <p className="text-gray-500 mb-2 font-semibold">MORE SERVICES</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 p-4 rounded-md flex flex-col justify-between">
          <div className="flex items-center">
            <p className="text-xl font-bold">₹{data.payout}</p>
            <CheckCircle className='text-green-500 ml-1' size={18} />
          </div>
          <p className='font-semibold'>Payout</p>
        </div>
        <div className="bg-white border border-gray-100 bg-white p-4 rounded-md flex flex-col gap-1 justify-between" onClick={() => { navigate("/tips-statement") }}>
          <IndianRupee />
          <div className="flex items-end">
            <p className='font-semibold'> Customer tips statement</p>
            <ArrowRight size={26} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 bg-white p-4 rounded-md flex flex-col gap-1 justify-between" onClick={() => { navigate("/deduction-statement") }}>
          <TrendingDown />
          <div className="flex items-end">
            <p className='font-semibold'>Deduction statement</p>
            <ArrowRight size={26} />

          </div>
        </div>
        <div className="bg-white border border-gray-100 bg-white p-4 rounded-md flex flex-col gap-2 justify-between" onClick={() => { navigate("/pocket-statement") }}>
          <ReceiptIndianRupeeIcon />
          <div className="flex items-end">
            <p className='font-semibold'>Pocket Statement</p>
            <ArrowRight size={26} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PocketComponent;

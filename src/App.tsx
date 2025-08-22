
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";
import { HomeScreen } from './screens/home/homeScreen';
import ProfileScreen from "./screens/profileScreen";
import { useEffect } from "react";
import sendDataToReactNative, { handleDataReceiveFromReactNative } from "./utils/nativeCommunication";
import { loggedInUser } from "./state/userState";
import LoginScreen from "./screens/auth/loginScreen";
import OtpVerificationScreen from "./screens/auth/otpVerificationScreen";
import secureLocalStorage from "react-secure-storage";
import TipStatementScreen from "./screens/tipStatementScreen";
import DeductionStatementScreen from "./screens/deductionStatementScreen";
import PocketStatementScreen from "./screens/pocketStatementScreen";
import { customRequest } from "./utils/customRequest";
import { availableForRide } from "./state/uiState";
import DeliveryMapScreen from "./screens/deliveryMapScreen";
import OnboardingScreen from "./screens/auth/onboardingScreen";
import AlertPopup from "./components/appAlertPopup";
import RideHistoryScreen from "./screens/rideHistoryScreen";
import HelpCenterScreen from "./screens/helpCenterScreen";
import SupportTicketsScreen from "./screens/supportTicketsScreen";
import VideosForYouScreen from "./screens/videosForYouScreen";



function App() {

  const checkUserDetails = async () => {
    if (loggedInUser.value === null) {
      loggedInUser.value = secureLocalStorage.getItem('user');

      if (secureLocalStorage.getItem('user') === null) {
        sendDataToReactNative({
          action: 'get-key-value',
          key: 'token'
        })
        sendDataToReactNative({
          action: 'get-key-value',
          key: 'user'
        })
      }

    }
  }

  const getRemoteDriverStatus = async () => {
    if (loggedInUser.value) {
      const res = await customRequest('/auth/me');
      if (res.status === 200) {
        availableForRide.value = res.data.data.online;
      }
    }
  }

  useEffect(() => {
    getRemoteDriverStatus();
    checkUserDetails();
  }, [])


  useEffect(() => {
    sendDataToReactNative({
      action: "changeStatusBarColor",
      color: "white",
      dark: true,
      translucent: true,
    })

    sendDataToReactNative({
      action: 'get-key-value',
      key: 'available_for_ride'
    })

  }, [])

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        handleDataReceiveFromReactNative(data);
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {loggedInUser.value ? (
          <>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/tips-statement" element={<TipStatementScreen />} />
            <Route path="/deduction-statement" element={<DeductionStatementScreen />} />
            <Route path="/pocket-statement" element={<PocketStatementScreen />} />
            <Route path="/delivery-map" element={<DeliveryMapScreen />} />

            <Route path="/help-center" element={<HelpCenterScreen />} />
            <Route path="/support-tickets" element={<SupportTicketsScreen />} />
            <Route path="/videos-for-you" element={<VideosForYouScreen />} />

            <Route path="/ride-history" element={<RideHistoryScreen />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )
          :
          (
            <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route
                path="/otp-verification"
                element={<OtpVerificationScreen />}
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )
        }
      </Routes>

      <AlertPopup />
    </BrowserRouter>
  )
}

export default App

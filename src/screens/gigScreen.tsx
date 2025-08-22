import React from 'react';

const GigScreen: React.FC = () => {
  return (
    <div className="w-full h-screen p-4 text-sm font-sans">
      <div className="flex justify-between items-center mb-4">
        <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs">Offline</div>
        <div className="flex items-center space-x-3">
          <div className="bg-red-500 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">1</div>
          <img src="/profile.jpg" alt="Profile" className="w-8 h-8 rounded-full border" />
        </div>
      </div>

      <div className="bg-black text-white p-3 rounded-md mb-4">
        <p className="text-xs uppercase">Gig details</p>
        <p className="text-white font-semibold mt-2">Free Gig for you, 1pm - 3pm 🎉</p>
        <p className="text-gray-300 text-xs">Special Gig - you can go online even now</p>
        <button className="mt-3 w-full bg-white text-black py-2 rounded-md font-semibold">
          Book and go online now
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">All offers</p>
          <p className="text-blue-500 text-xs">See All</p>
        </div>

        <div className="bg-gray-100 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <p className="font-semibold">Full Day Evening</p>
            <p className="text-green-600 font-semibold">₹275 Extra</p>
          </div>
          <p className="text-xs text-gray-600">16 May · 4am - 3:59am · <span className="text-green-600">Live</span></p>

          <div className="mt-2 text-xs">
            <p className="text-gray-500">Incentive</p>
            <div className="flex gap-2 mt-1">
              {[67, 103, 134, 206, 275].map((amt) => (
                <div key={amt} className="bg-white px-2 py-1 rounded border">{`₹${amt}`}</div>
              ))}
            </div>

            <p className="text-gray-500 mt-3">Earnings</p>
            <div className="flex gap-2 mt-1">
              {[600, 742, 884, 1048, 1248].map((amt) => (
                <div key={amt} className="bg-white px-2 py-1 rounded border">{`₹${amt}`}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <p className="font-semibold mb-2">Compulsory login</p>
        <div className="flex justify-between text-xs">
          <div className="bg-blue-100 px-3 py-2 rounded-md text-center w-[48%]">
            <p>🕓 4am - 3:59am</p>
            <p className="text-gray-600">9 hrs</p>
          </div>
          <div className="bg-blue-100 px-3 py-2 rounded-md text-center w-[48%]">
            <p>🕕 6pm - 3:59am</p>
            <p className="text-gray-600">4 hrs</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-2 flex justify-around text-center text-xs">
        <div className="flex flex-col items-center text-gray-500">
          <span>📋</span>
          <span>Feed</span>
        </div>
        <div className="flex flex-col items-center text-gray-500">
          <span>💰</span>
          <span>Pocket</span>
        </div>
        <div className="flex flex-col items-center text-gray-500">
          <span>📅</span>
          <span>Gigs</span>
        </div>
        <div className="flex flex-col items-center text-gray-500">
          <span>🔔</span>
          <span>Updates</span>
        </div>
      </div>
    </div>
  );
};

export default GigScreen;

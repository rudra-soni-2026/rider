import { ArrowLeft, PlayCircle } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router";
import { AppHeader } from "../components/header";

const videos = [
  {
    id: "vid-1",
    title: "How to complete your first delivery",
    thumbnail: "https://img.youtube.com/vi/1A2B3C4D5E6/0.jpg",
    duration: "3:45",
  },
  {
    id: "vid-2",
    title: "Maximize your earnings: Tips & Tricks",
    thumbnail: "https://img.youtube.com/vi/2B3C4D5E6F7/0.jpg",
    duration: "5:20",
  },
  {
    id: "vid-3",
    title: "App walkthrough & features",
    thumbnail: "https://img.youtube.com/vi/3C4D5E6F7G8/0.jpg",
    duration: "4:10",
  },
  {
    id: "vid-4",
    title: "Safety guidelines for riders",
    thumbnail: "https://img.youtube.com/vi/4D5E6F7G8H9/0.jpg",
    duration: "2:55",
  },
];

const VideosForYouScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gradient-to-b from-pink-50 to-white text-gray-800 font-sans">
      <div className="flex flex-col bg-pink-500 rounded-b-xl shadow-lg">
        <AppHeader/>
        <div className="px-4 py-4 flex items-end space-x-4 bg-pink-500 rounded-b-xl">
          <div>
            <p className="font-bold text-2xl text-white">Videos For You</p>
            <p className="text-sm text-pink-100 mt-1">Learn, grow, and succeed</p>
          </div>
          <span className="ml-auto text-4xl">🎥</span>
        </div>
      </div>

      <div className="mt-6 mx-3">
        <p className="font-medium mb-2 text-lg">Recommended Videos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="relative bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden group"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-36 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                <PlayCircle size={48} className="text-white drop-shadow-lg" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                {video.duration}
              </div>
              <div className="p-3">
                <p className="font-semibold">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 mx-3">
        <p className="font-medium mb-2 text-lg">More Resources</p>
        <div className="bg-pink-100 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-pink-900">Explore our Help Center</p>
            <p className="text-xs text-pink-700">Find guides, FAQs, and more in the Help Center</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideosForYouScreen;

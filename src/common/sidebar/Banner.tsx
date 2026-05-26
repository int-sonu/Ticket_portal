import React from 'react';

interface BannerProps {
  isSidebarOpen: boolean;
}

const Banner: React.FC<BannerProps> = ({ isSidebarOpen }) => {
  return (
    <div className="mt-auto flex flex-col w-full">
      {/* Upgrade Plan Card */}
      {isSidebarOpen && (
        <div className="mx-4 mb-3.5 p-4.5 bg-[#0e6da8]/90 rounded-2xl relative overflow-hidden border border-white/10 shadow-lg flex flex-col">
          <h4 className="font-bold text-[14px] text-white tracking-wide mb-1">
            Plan Details
          </h4>
          <p className="text-[12px] text-white/95 mb-3.5 leading-relaxed font-semibold">
            You are currently on the basic plan. To get more features, upgrade to one of our premium plans.
          </p>
          
          {/* Custom Saturn/Planet Wireframe SVG Icon */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white mb-4 opacity-95"
          >
            {/* Planet globe */}
            <circle cx="12" cy="12" r="5" />
            {/* Planet ring */}
            <path
              d="M3.5 14.5c1-1.5 3-3 6.5-3.8s6.5-.5 7.5.5.5 2.5-2 3.5-5.5 1.5-8 1.3-3.5-1-4-1.5z"
              strokeDasharray="none"
            />
          </svg>
          
          <button className="w-full bg-[#1890ff] hover:bg-[#40a9ff] text-white font-bold py-2 rounded-xl text-[13px] transition-colors shadow-md shadow-blue-500/10 cursor-pointer">
            Upgrade now
          </button>
        </div>
      )}

      {/* Bordered Logout Button */}
      <div className="p-4 pt-1">
        {isSidebarOpen ? (
          <button className="w-full bg-transparent hover:bg-white/10 text-white font-bold py-2 rounded-xl border border-white/80 transition-colors text-center text-[13px] cursor-pointer">
            Logout
          </button>
        ) : (
          <button 
            title="Logout"
            className="w-full bg-transparent hover:bg-white/10 text-white font-bold py-2 rounded-xl border border-white/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Banner;

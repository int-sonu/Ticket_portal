import React from 'react';

interface BannerProps {
  isSidebarOpen: boolean;
}

const Banner: React.FC<BannerProps> = ({ isSidebarOpen }) => {
  return (
    <div className="mt-auto flex w-full flex-col">
      {/* Upgrade Plan Card */}
      {isSidebarOpen && (
        <div className="relative mx-[15px] mb-2 flex h-[146px] flex-col overflow-hidden rounded-xl border border-white/5 bg-[#1177a8] px-[10px] py-[6px] shadow-md">
          <h4 className="mb-0.5 text-[13px] font-bold leading-[17px] text-white">
            Plan Details
          </h4>
          <p className="mb-0.5 text-[11px] font-medium leading-[17px] text-white">
            You are currently on the basic plan. To get more features, upgrade to one of our premium plans.
          </p>
          
          {/* Custom Saturn/Planet Wireframe SVG Icon */}
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-0.5 text-white opacity-95"
          >
            {/* Planet globe */}
            <circle cx="12" cy="12" r="5" />
            {/* Planet ring */}
            <path
              d="M3.5 14.5c1-1.5 3-3 6.5-3.8s6.5-.5 7.5.5.5 2.5-2 3.5-5.5 1.5-8 1.3-3.5-1-4-1.5z"
              strokeDasharray="none"
            />
          </svg>
          
          <button className="mt-auto h-8 w-full cursor-pointer rounded-md bg-gradient-to-r from-[#079bf1] to-[#70c6f5] text-[11px] font-bold text-white shadow-sm transition-[filter] hover:brightness-110">
            Upgrade now
          </button>
        </div>
      )}

      {/* Bordered Logout Button */}
      <div className="px-[23px] pb-[7px]">
        {isSidebarOpen ? (
          <button className="h-[31px] w-full cursor-pointer rounded-md border border-white bg-transparent text-center text-[11px] font-bold text-white transition-colors hover:bg-white/10">
            Logout
          </button>
        ) : (
          <button 
            title="Logout"
            className="flex h-[31px] w-full cursor-pointer items-center justify-center rounded-md border border-white bg-transparent font-bold text-white transition-colors hover:bg-white/10"
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

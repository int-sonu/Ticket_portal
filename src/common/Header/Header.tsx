import React, { useEffect, useState, useRef } from 'react';
import { MenuOutlined, BellOutlined, CloseOutlined, LockOutlined } from '@ant-design/icons';
import CompanyLogo from '../../assets/icons/topbar-logo.svg';
import { getApiImageBaseUrl } from '../../Axios/config';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface ProfileInfo {
  name: string;
  shortName: string;
  userType: string;
  mobile: string;
  email: string;
}

const safeParse = (value: string | null) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const firstText = (...values: unknown[]) => {
  const value = values.find(
    (item) => item !== null && item !== undefined && String(item).trim(),
  );

  return value === undefined ? '' : String(value).trim();
};

const normalizeBase = (url?: string) => (url || '').replace(/\/+$/, '');
const stripLead = (path?: string) => (path || '').replace(/^\/+/, '');
const joinUrl = (base: string, path: string) =>
  `${normalizeBase(base)}/${stripLead(path)}`;

const ensureAbsoluteUrl = (maybePath?: string) => {
  const path = maybePath || '';
  if (/^https?:\/\//i.test(path)) return path;

  try {
    return path ? joinUrl(getApiImageBaseUrl(), path) : '';
  } catch {
    return '';
  }
};

const getHeaderSessionData = () => {
  const session = safeParse(sessionStorage.getItem('userSession'));
  const credentials = safeParse(localStorage.getItem('userCredentials'));
  const sessionData = session?.data ?? session ?? {};
  const credentialData = credentials?.data ?? credentials ?? {};
  const rootUser = Object.keys(sessionData).length ? sessionData : credentialData;
  const userCandidates = [
    rootUser?.userDetails,
    rootUser?.agentDetails,
    rootUser?.user,
    rootUser?.profile,
    rootUser,
  ].flatMap((candidate) =>
    Array.isArray(candidate) ? candidate : [candidate],
  );
  const user =
    userCandidates.find((candidate) =>
      firstText(
        candidate?.cName,
        candidate?.cAgentName,
        candidate?.cUserName,
        candidate?.cFullName,
        candidate?.Name,
        candidate?.name,
        candidate?.UserName,
        candidate?.userName,
        candidate?.username,
      ),
    ) ?? rootUser;
  const companyDetails =
    user?.companyDetails ??
    rootUser?.companyDetails ??
    credentialData?.companyDetails ??
    {};
  const userName = firstText(
    user?.cName,
    user?.cAgentName,
    user?.cUserName,
    user?.cFullName,
    user?.Name,
    user?.name,
    user?.UserName,
    user?.userName,
    user?.username,
    credentialData?.cName,
    credentialData?.cAgentName,
  );
  const profileData: ProfileInfo = {
    name: userName,
    shortName: firstText(user?.cShortName, user?.shortName),
    userType: firstText(user?.cUserType, user?.userType, user?.cType),
    mobile: firstText(
      user?.cMobile,
      user?.cMobileNo,
      user?.cPhone,
      user?.mobile,
    ),
    email: firstText(user?.cEmail, user?.email),
  };

  return {
    userName,
    companyName: firstText(
      companyDetails?.cCompanyName,
      companyDetails?.cComapnyName,
      companyDetails?.companyName,
      user?.cCompanyName,
    ),
    logoUrl: ensureAbsoluteUrl(
      companyDetails?.cLogoUrl || companyDetails?.logoUrl,
    ),
    profileData,
  };
};

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { userName, companyName, logoUrl, profileData } =
    getHeaderSessionData();

  // Profile Popup states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const popupRef = useRef<HTMLDivElement>(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const userInitials = (userName?.trim()?.slice(0, 2) || 'US').toUpperCase();

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill out all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and Confirm password do not match.');
      return;
    }
    setSaveStatus('success');
    setTimeout(() => {
      setSaveStatus('idle');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    }, 1500);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[38px] bg-white flex items-center justify-between px-5 border-b border-gray-100">
      {/* Left: Hamburger + Company Logo + Name */}
        <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <MenuOutlined className="text-xl" />
        </button>
          <div className="flex items-center gap-2">
          <img
            src={logoUrl || CompanyLogo}
            alt="header-logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = CompanyLogo;
            }}
          />
          <p className="text-gray-800 font-semibold text-xs tracking-wide">
            {companyName || 'Company Name'}
          </p>
        </div>
      </div>

      {/* Right: Username + Avatar + Bell */}
      <div className="flex items-center gap-3 relative" ref={popupRef}>
        <p className="text-gray-800 font-semibold text-sm">
          {userName || 'User Name'}
        </p>
        <button
          onClick={() => {
            setIsProfileOpen(!isProfileOpen);
            setShowChangePassword(false);
          }}
          type="button"
          className="w-8 h-8 rounded-full bg-[#8ECCF7] flex items-center justify-center text-slate-800 font-bold uppercase cursor-pointer hover:bg-[#6eb9f3] transition-colors border border-sky-200"
        >
          {userInitials}
        </button>
        <button className="rounded-md p-1.5 cursor-pointer bg-[#FFDADA] hover:bg-[#ffbcbc] transition-colors">
          <div className="relative">
            <BellOutlined className="w-4 h-4 text-[#ef4444]" />
          </div>
        </button>

        {/* User Profile Modal Dropdown */}
        {isProfileOpen && (
          <div className="absolute right-0 top-11 z-[9999] w-[340px] rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_12px_42px_rgba(0,0,0,0.15)] flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="font-bold text-slate-800 text-[15px]">User Profile</span>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                type="button"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </div>

            {!showChangePassword ? (
              <>
                {/* Profile Avatar section */}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="w-22 h-22 rounded-full bg-[#8ECCF7] flex items-center justify-center text-slate-800 font-bold text-3xl shadow-sm">
                    {userInitials}
                  </div>
                  <span className="font-bold text-slate-800 text-[16px]">
                    {profileData.name || 'User'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {profileData.userType
                      ? `( ${profileData.userType === 'Admin' ? 'Service' : profileData.userType} )`
                      : ''}
                  </span>
                </div>

                {/* Details Container */}
                <div className="rounded-xl border border-sky-100 bg-sky-50/20 p-3.5 flex flex-col gap-3 mt-1">
                  {/* Row 1: Name */}
                  <div className="flex items-center gap-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-slate-400"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span className="text-xs font-semibold text-slate-400 w-20 shrink-0">
                      Name
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {profileData.name || '-'}
                    </span>
                  </div>

                  {/* Row 2: Short Name */}
                  <div className="flex items-center gap-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-slate-400"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4l3 3"></path>
                    </svg>
                    <span className="text-xs font-semibold text-slate-400 w-20 shrink-0">
                      Short Name
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {profileData.shortName || '-'}
                    </span>
                  </div>

                  {/* Row 3: User Type */}
                  <div className="flex items-center gap-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-slate-400"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span className="text-xs font-semibold text-slate-400 w-20 shrink-0">
                      User Type
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {profileData.userType || '-'}
                    </span>
                  </div>

                  {/* Row 4: Mobile */}
                  <div className="flex items-center gap-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-slate-400"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    <span className="text-xs font-semibold text-slate-400 w-20 shrink-0">
                      Mobile
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {profileData.mobile || '-'}
                    </span>
                  </div>

                  {/* Row 5: Email */}
                  <div className="flex items-center gap-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-slate-400"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span className="text-xs font-semibold text-slate-400 w-20 shrink-0">
                      Email
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {profileData.email || '-'}
                    </span>
                  </div>
                </div>

                {/* Profile Footer - Change Password Trigger */}
                <button
                  onClick={() => setShowChangePassword(true)}
                  type="button"
                  className="w-full mt-2 py-2.5 rounded-lg border border-sky-200 text-sky-600 hover:text-sky-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-sky-50/45 transition-colors cursor-pointer"
                >
                  <LockOutlined className="text-sm" />
                  Change Password
                </button>
              </>
            ) : (
              /* Change Password Form inside modal */
              <form onSubmit={handlePasswordSave} className="flex flex-col gap-3.5 mt-1 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300/30 transition-all"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300/30 transition-all"
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300/30 transition-all"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                {saveStatus === 'success' && (
                  <div className="text-emerald-500 font-bold text-xs text-center animate-bounce mt-1">
                    Password Changed Successfully!
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setSaveStatus('idle');
                    }}
                    type="button"
                    className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-sky-500/10"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

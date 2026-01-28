import React from 'react';

const logo = process.env.PUBLIC_URL + '/Lloyds-Banking-Group-logo.webp';

const Header = ({ title, profiles, currentProfile, period, onProfileChange, onPeriodChange }) => {
  const getFirstName = (fullName) => {
    return fullName ? fullName.split(' ')[0] : '';
  };

  const displayTitle = getFirstName(title) 
    ? `${getFirstName(title)} Financial Wellbeing`
    : 'Financial Wellbeing';

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b-2 border-lbg-salem shadow-md animate-slide-down">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <img
              src={logo}
              alt="Lloyds Banking Group"
              className="h-[52px] w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-lbg-grey-800 tracking-tight">{displayTitle}</h1>
            <p className="text-xs text-lbg-grey-600 font-medium">Your Personal Financial Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-2 py-2 bg-gradient-to-r from-lbg-green-pale to-lbg-green-pale/95 rounded-lg border-2 border-lbg-green-subtle shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <label htmlFor="profileSelector" className="text-xs font-bold text-lbg-grey-700 uppercase tracking-wider px-1">
              Customer
            </label>
            <select
              id="profileSelector"
              className="px-3 py-2 pr-10 bg-white text-lbg-grey-800 font-semibold text-sm rounded-md cursor-pointer transition-all duration-250 border-none shadow-sm hover:shadow-md focus:outline-none focus:ring-3 focus:ring-lbg-salem/20 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij48cGF0aCBmaWxsPSIjMDg3MDM4IiBkPSJNNyAxMEwyIDVoMTB6Ii8+PC9zdmc+')] bg-no-repeat bg-[right_0.9rem_center] bg-[length:14px] min-w-[200px]"
              value={currentProfile}
              onChange={(e) => onProfileChange(e.target.value)}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 bg-lbg-green-pale p-1 rounded-lg border-2 border-lbg-green-subtle shadow-sm">
            {['6M', '1Y', '3Y', '5Y'].map((p) => (
              <button
                key={p}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all duration-250 ${
                  period === p
                    ? 'bg-lbg-salem text-white shadow-md scale-105'
                    : 'bg-transparent text-lbg-grey-700 hover:bg-white/80 hover:text-lbg-salem hover:-translate-y-0.5'
                }`}
                onClick={() => onPeriodChange(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isTripsActive = location.pathname.startsWith('/trips');
  const isPlanActive = !isTripsActive && (location.pathname === '/' || location.pathname.startsWith('/plan'));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1536px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Left: Brand + Navigation */}
        <div className="flex items-center gap-10">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#1769FF] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <circle cx="8" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
                <circle cx="16" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
                <path d="M11.5 12h1" strokeWidth="3" />
                <path d="M12 7c2 2 2 8 0 10" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-[#071B49]">
              KogniSync
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-8 h-16">
            <Link
              to="/"
              className={`h-full flex items-center text-sm font-semibold transition-all relative ${
                isPlanActive
                  ? 'text-[#1769FF] border-b-2 border-[#1769FF] -mb-[1px]'
                  : 'text-[#52627A] hover:text-[#071B49]'
              }`}
            >
              Plan
            </Link>

            <Link
              to="/trips/trp-demo-blr-maa"
              className={`h-full flex items-center text-sm font-semibold transition-all relative ${
                isTripsActive
                  ? 'text-[#1769FF] border-b-2 border-[#1769FF] -mb-[1px]'
                  : 'text-[#52627A] hover:text-[#071B49]'
              }`}
            >
              Trips
            </Link>

            <a
              href="#explore"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('popular-routes');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-full flex items-center text-sm font-medium text-[#52627A] hover:text-[#071B49] transition-colors"
            >
              Explore
            </a>

            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="h-full flex items-center text-sm font-medium text-[#52627A] hover:text-[#071B49] transition-colors"
            >
              About
            </a>
          </nav>
        </div>

        {/* Right: Search, Notifications, Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-1.5 text-[#52627A] hover:text-[#071B49] transition-colors rounded-lg hover:bg-slate-50"
            title="Search destinations"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="p-1.5 text-[#52627A] hover:text-[#071B49] transition-colors rounded-lg hover:bg-slate-50"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* User profile */}
          <div className="flex items-center gap-2 pl-1 cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-[#8C5D42] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              G
            </div>
            <span className="text-sm font-semibold text-[#071B49] group-hover:text-[#1769FF] transition-colors">
              Gagan
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
};

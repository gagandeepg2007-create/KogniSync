import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, ExternalLink } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500 flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:shadow-blue-600/35 transition-all duration-300">
            <Compass className="w-5 h-5 text-white transform group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-tight text-slate-950">
                Kogni<span className="text-blue-600">Sync</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-slate-500 hidden sm:block -mt-1 font-mono">
              Multi-Modal Travel Orchestration
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-6">
          <Link
            to="/"
            className={`text-sm font-semibold transition-colors px-3 py-1.5 rounded-lg ${
              location.pathname === '/'
                ? 'text-blue-700 bg-blue-50/80 border border-blue-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            Journey Planner
          </Link>

          <Link
            to="/plan"
            className={`text-sm font-semibold transition-colors px-3 py-1.5 rounded-lg ${
              location.pathname.startsWith('/plan')
                ? 'text-blue-700 bg-blue-50/80 border border-blue-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            Journeys
          </Link>

          {/* Engine Status pill */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600 font-medium">Holds Engine Active</span>
          </div>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-white transition-all shadow-xs"
            title="FastAPI Swagger UI"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </nav>
      </div>
    </header>
  );
};

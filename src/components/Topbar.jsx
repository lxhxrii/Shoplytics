
import React, { useEffect, useState } from "react";

import {
  Search,
  Bell,
  RefreshCw,
  ChevronRight,
  Command,
  HelpCircle,
  Check,
  Sun,
  Moon,
} from "lucide-react";

function Topbar({ activePage, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("shoplytics_settings") || "{}"
      );
      return saved.theme === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const syncTheme = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("shoplytics_settings") || "{}"
        );
        setTheme(saved.theme === "light" ? "light" : "dark");
      } catch {
        setTheme("dark");
      }
    };

    window.addEventListener("shoplytics-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("shoplytics-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";

    let settings = {};

    try {
      settings = JSON.parse(
        localStorage.getItem("shoplytics_settings") || "{}"
      );
    } catch {
      settings = {};
    }

    settings.theme = newTheme;

    localStorage.setItem(
      "shoplytics_settings",
      JSON.stringify(settings)
    );

    setTheme(newTheme);

    document.documentElement.setAttribute("data-theme", newTheme);
    document.documentElement.style.colorScheme = newTheme;

    window.dispatchEvent(new Event("shoplytics-theme-change"));
  };

  const notifications = [
    {
      title: "Analytics updated",
      description: "Your dashboard data is ready to explore.",
      time: "Just now",
    },
    {
      title: "New insights available",
      description: "Explore your latest business performance.",
      time: "10 min ago",
    },
    {
      title: "Welcome to Shoplytics",
      description: "Your workspace is ready.",
      time: "Today",
    },
  ];

  return (
    <header className="h-[72px] px-8 flex items-center justify-between bg-[#0B1020]/95 border-b border-[#202943] sticky top-0 z-40 backdrop-blur-xl">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">
          Workspace
        </span>

        <ChevronRight size={14} className="text-slate-600" />

        <h2 className="text-xs font-semibold text-white">
          {activePage}
        </h2>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">

        {/* SEARCH */}
        <div className="relative hidden md:flex items-center w-[240px]">
          <Search
            size={16}
            className="absolute left-3 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-12 rounded-lg bg-[#121A2D] border border-[#27324D] text-xs text-white placeholder:text-slate-500 outline-none focus:border-violet-500/70 transition-all"
          />

          <div className="absolute right-2 flex items-center gap-1 text-[9px] text-slate-500">
            <Command size={11} />
            <span>K</span>
          </div>
        </div>

        {/* THEME TOGGLE */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#27324D] bg-[#121A2D] text-amber-400 hover:text-violet-300 hover:border-violet-500/50 transition-all"
        >
          {theme === "dark" ? (
            <Sun size={17} />
          ) : (
            <Moon size={17} />
          )}
        </button>

        {/* REFRESH */}
        <button
          onClick={onRefresh}
          title="Refresh dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#27324D] bg-[#121A2D] text-slate-400 hover:text-violet-300 hover:border-violet-500/50 transition-all"
        >
          <RefreshCw size={16} />
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-[#27324D] bg-[#121A2D] text-slate-400 hover:text-white transition-all"
            title="Notifications"
          >
            <Bell size={17} />

            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-400 rounded-full border-2 border-[#121A2D]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-[300px] bg-[#11182B] border border-[#293653] rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-[#26314B]">
                <h3 className="text-sm font-semibold text-white">
                  Notifications
                </h3>

                <span className="text-[10px] text-violet-300">
                  3 updates
                </span>
              </div>

              {notifications.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-[#202943] hover:bg-[#192139] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-300">
                      <Check size={14} />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">
                        {item.title}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      <p className="text-[9px] text-slate-500 mt-2">
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HELP */}
        <button
          title="Help and support"
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-slate-400 hover:text-violet-300 transition-all"
        >
          <HelpCircle size={18} />
        </button>

        {/* PROFILE */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-3 border-l border-[#29324A]"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-900/20">
              SA
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-52 bg-[#11182B] border border-[#293653] rounded-xl shadow-2xl p-2">
              <div className="px-3 py-3 border-b border-[#26314B]">
                <p className="text-xs font-semibold text-white">
                  Store Admin
                </p>

                <p className="text-[10px] text-slate-500 mt-1">
                  Administrator
                </p>
              </div>

              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-[#202943] rounded-lg">
                My Profile
              </button>

              <button className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-[#202943] rounded-lg">
                Workspace Settings
              </button>

              <button className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg">
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Topbar;


import React from "react";

import {
  LayoutDashboard,
  ChartNoAxesCombined,
  ShoppingBag,
  Users,
  BrainCircuit,
  Sparkles,
  Database,
  FileBarChart,
  Settings,
  ChevronDown,
  HelpCircle,
  Store,
} from "lucide-react";

const navigation = [
  {
    section: "WORKSPACE",
    items: [
      { name: "Overview", icon: LayoutDashboard },
      { name: "Sales Intelligence", icon: ChartNoAxesCombined },
      { name: "Products", icon: ShoppingBag },
      { name: "Customers", icon: Users },
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      { name: "Predictive Analytics", icon: BrainCircuit },
      { name: "Business Insights", icon: Sparkles },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { name: "Data Management", icon: Database },
      { name: "Reports & Export", icon: FileBarChart },
    ],
  },
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-[260px] min-h-screen shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col px-4 py-6 transition-colors duration-300">

      {/* BRAND */}
      <div className="flex items-center gap-3 px-2 mb-9">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/30">
          <Store size={21} className="text-white" />
        </div>

        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Shoplytics
          </h1>

          <p className="text-[9px] tracking-[2px] text-[var(--text-muted)] font-semibold">
            INTELLIGENCE SUITE
          </p>
        </div>
      </div>

      {/* WORKSPACE SELECTOR */}
      <button className="flex items-center gap-3 p-3 mb-8 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-color)] hover:border-violet-500/50 transition-all">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-white font-bold">
          S
        </div>

        <div className="text-left flex-1">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Store Workspace
          </p>

          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Business Account
          </p>
        </div>

        <ChevronDown size={16} className="text-[var(--text-muted)]" />
      </button>

      {/* NAVIGATION */}
      <div className="flex-1 space-y-7">
        {navigation.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-bold tracking-[1.8px] text-[var(--text-muted)] px-3 mb-3">
              {group.section}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => setActivePage(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-500 border border-violet-500/30 shadow-md shadow-violet-950/10"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-transparent"
                    }`}
                  >
                    <Icon size={17} />

                    <span>{item.name}</span>

                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#a78bfa]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* HELP CARD */}
      <div className="rounded-xl p-4 mb-5 bg-[var(--insight-card-bg)] border border-violet-500/20 transition-colors duration-300">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={17} className="text-violet-500" />

          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Smart Analytics
          </span>
        </div>

        <p className="text-[10px] leading-relaxed text-[var(--text-secondary)] mb-3">
          Discover meaningful patterns and make smarter business decisions with your data.
        </p>

        <button
          onClick={() => setActivePage("Business Insights")}
          className="text-[10px] font-semibold text-violet-500 hover:text-violet-400 transition-colors"
        >
          Explore insights →
        </button>
      </div>

      {/* SETTINGS */}
      <button
        onClick={() => setActivePage("Settings")}
        className="flex items-center gap-3 px-3 py-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-all mb-3"
      >
        <Settings size={17} />
        Settings
      </button>

      {/* ADMIN PROFILE */}
      <div className="border-t border-[var(--border-color)] pt-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold">
          SA
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Store Admin
          </p>

          <p className="text-[10px] text-[var(--text-muted)]">
            Administrator
          </p>
        </div>

        <button className="text-[var(--text-muted)] hover:text-violet-500">
          <HelpCircle size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

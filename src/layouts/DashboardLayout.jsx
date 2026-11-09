
import React from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout({
  activePage,
  setActivePage,
  onRefresh,
  children,
}) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] flex transition-colors duration-300">

      {/* LEFT SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* MAIN APPLICATION AREA */}
      <main className="flex-1 min-w-0 flex flex-col bg-[var(--app-bg)] transition-colors duration-300">

        {/* TOP NAVIGATION */}
        <Topbar
          activePage={activePage}
          onRefresh={onRefresh}
        />

        {/* PAGE CONTENT */}
        <div className="flex-1 w-full px-8 py-8">

          <div className="max-w-[1600px] mx-auto">

            {children}

          </div>

        </div>

        {/* FOOTER */}
        <footer className="px-8 py-5 border-t border-[var(--border-color)] flex flex-wrap justify-between items-center gap-3 text-[10px] text-[var(--text-muted)] transition-colors duration-300">

          <p>
            © 2026 Shoplytics. All rights reserved.
          </p>

          <div className="flex items-center gap-2">

            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />

            <span>All systems operational</span>

          </div>

          <p>
            Built for smarter commerce.
          </p>

        </footer>

      </main>

    </div>
  );
}

export default DashboardLayout;

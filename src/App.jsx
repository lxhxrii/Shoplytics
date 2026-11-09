
import React, { useEffect, useState } from "react";

import DashboardLayout from "./layouts/DashboardLayout";

import Overview from "./pages/Overview";
import DataManagement from "./pages/DataManagement";
import SalesIntelligence from "./pages/SalesIntelligence";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import BusinessInsights from "./pages/BusinessInsights";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [refreshKey, setRefreshKey] = useState(0);

  // Apply the saved theme globally
  useEffect(() => {
    const applyTheme = () => {
      let savedSettings = {};

      try {
        savedSettings = JSON.parse(
          localStorage.getItem("shoplytics_settings") || "{}"
        );
      } catch {
        savedSettings = {};
      }

      const selectedTheme = savedSettings.theme || "dark";

      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      const actualTheme =
        selectedTheme === "system"
          ? systemPrefersDark
            ? "dark"
            : "light"
          : selectedTheme;

      document.documentElement.setAttribute("data-theme", actualTheme);
      document.documentElement.style.colorScheme = actualTheme;
    };

    applyTheme();

    // Listen for operating system theme changes
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = () => {
      let savedSettings = {};

      try {
        savedSettings = JSON.parse(
          localStorage.getItem("shoplytics_settings") || "{}"
        );
      } catch {
        savedSettings = {};
      }

      if (!savedSettings.theme || savedSettings.theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Sync theme if another component updates localStorage
    window.addEventListener("storage", applyTheme);

    // Custom event for same-tab theme changes
    window.addEventListener("shoplytics-theme-change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", applyTheme);
      window.removeEventListener("shoplytics-theme-change", applyTheme);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const renderPage = () => {
    switch (activePage) {
      case "Overview":
        return <Overview key={refreshKey} />;

      case "Data Management":
        return <DataManagement key={refreshKey} />;

      case "Sales Intelligence":
        return <SalesIntelligence key={refreshKey} />;

      case "Products":
        return <Products key={refreshKey} />;

      case "Customers":
        return <Customers key={refreshKey} />;

      case "Predictive Analytics":
        return <PredictiveAnalytics key={refreshKey} />;

      case "Business Insights":
        return <BusinessInsights key={refreshKey} />;

      case "Reports & Export":
        return <Reports key={refreshKey} />;

      case "Settings":
        return <Settings key={refreshKey} />;

      default:
        return (
          <div className="min-h-[65vh] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
              <span className="text-3xl text-violet-300">✦</span>
            </div>

            <p className="text-[10px] tracking-[3px] text-violet-300 font-semibold mb-3">
              SHOPLYTICS WORKSPACE
            </p>

            <h1 className="text-3xl font-bold text-white mb-3">
              {activePage}
            </h1>

            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              This module is part of the Shoplytics analytics suite.
              We will build its complete functionality in the upcoming development stages.
            </p>

            <div className="mt-6 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              Module under development
            </div>

            <button
              onClick={() => setActivePage("Overview")}
              className="mt-7 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Back to Overview
            </button>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onRefresh={handleRefresh}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;

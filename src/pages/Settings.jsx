
import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Palette,
  LayoutDashboard,
  Database,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  Globe,
  Mail,
  BriefcaseBusiness,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";

const defaultSettings = {
  name: "Shoplytics User",
  email: "",
  role: "Business Analyst",
  organization: "",
  theme: "dark",
  density: "comfortable",
  landingPage: "Overview",
  currency: "USD",
  numberFormat: "standard",
  notifications: true,
  reportNotifications: true,
};

// Apply selected theme to the application
function applyTheme(theme) {
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const resolvedTheme =
    theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : theme;

  document.documentElement.setAttribute(
    "data-theme",
    resolvedTheme
  );

  document.documentElement.style.colorScheme = resolvedTheme;
}

// Load saved preferences
function loadSettings() {
  try {
    const saved = localStorage.getItem("shoplytics_settings");

    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "data", label: "Data Preferences", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "about", label: "About Shoplytics", icon: ShieldCheck },
];

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Apply theme whenever the selected theme changes
  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleSystemThemeChange = () => {
        applyTheme("system");
      };

      mediaQuery.addEventListener(
        "change",
        handleSystemThemeChange
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleSystemThemeChange
        );
      };
    }
  }, [settings.theme]);

  useEffect(() => {
    setSaved(false);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Save preferences
  const saveSettings = () => {
    localStorage.setItem(
      "shoplytics_settings",
      JSON.stringify(settings)
    );

    applyTheme(settings.theme);
    setSaved(true);
  };

  // Reset preferences
  const resetSettings = () => {
    setSettings({ ...defaultSettings });

    localStorage.removeItem("shoplytics_settings");

    applyTheme("dark");
    setSaved(false);
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 transition";

  const labelClass =
    "block text-xs font-medium text-slate-400 mb-2";

  const renderToggle = (key, title, description) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-800 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => updateSetting(key, !settings[key])}
        aria-pressed={settings[key]}
        className={`w-12 h-6 rounded-full p-1 transition ${
          settings[key] ? "bg-violet-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full transition-transform ${
            settings[key] ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Profile Settings
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Manage your personal and professional information.
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {(settings.name || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="text-white font-semibold">
                  {settings.name || "Your Name"}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {settings.role || "Your Role"}
                </p>

                <p className="text-[10px] text-violet-300 mt-2">
                  SHOPLYTICS PROFILE
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full Name</label>

                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-slate-500" />

                  <input
                    className={`${inputClass} pl-10`}
                    value={settings.name}
                    onChange={(e) =>
                      updateSetting("name", e.target.value)
                    }
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>

                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />

                  <input
                    type="email"
                    className={`${inputClass} pl-10`}
                    value={settings.email}
                    onChange={(e) =>
                      updateSetting("email", e.target.value)
                    }
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Professional Role</label>

                <div className="relative">
                  <BriefcaseBusiness size={16} className="absolute left-3 top-3.5 text-slate-500" />

                  <input
                    className={`${inputClass} pl-10`}
                    value={settings.role}
                    onChange={(e) =>
                      updateSetting("role", e.target.value)
                    }
                    placeholder="Business Analyst"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Organization</label>

                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-3.5 text-slate-500" />

                  <input
                    className={`${inputClass} pl-10`}
                    value={settings.organization}
                    onChange={(e) =>
                      updateSetting("organization", e.target.value)
                    }
                    placeholder="Company or organization"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Appearance
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Choose your preferred visual experience.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Theme Preference
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "light", label: "Light", icon: Sun },
                  { id: "system", label: "System", icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = settings.theme === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        updateSetting("theme", item.id)
                      }
                      className={`p-5 rounded-2xl border text-left transition ${
                        active
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-slate-800 bg-slate-950 hover:border-slate-600"
                      }`}
                    >
                      <Icon
                        className={
                          active
                            ? "text-violet-300"
                            : "text-slate-400"
                        }
                        size={22}
                      />

                      <p className="text-sm font-semibold text-white mt-4">
                        {item.label}
                      </p>

                      {active && (
                        <p className="text-[10px] text-violet-300 mt-1">
                          SELECTED
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 mt-3">
                Theme changes apply immediately. Save Preferences
                to retain your selection after refreshing.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Dashboard Density
              </label>

              <select
                className={inputClass}
                value={settings.density}
                onChange={(e) =>
                  updateSetting("density", e.target.value)
                }
              >
                <option value="comfortable">
                  Comfortable spacing
                </option>

                <option value="compact">
                  Compact layout
                </option>
              </select>
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Dashboard Preferences
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Configure how you prefer to access your workspace.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Default Landing Page
              </label>

              <select
                className={inputClass}
                value={settings.landingPage}
                onChange={(e) =>
                  updateSetting("landingPage", e.target.value)
                }
              >
                {[
                  "Overview",
                  "Sales Intelligence",
                  "Products",
                  "Customers",
                  "Predictive Analytics",
                  "Business Insights",
                  "Reports & Export",
                ].map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500 mt-2">
                Select the page you want as your preferred
                dashboard starting point.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-sm font-semibold text-white">
                Your workspace
              </p>

              <p className="text-xs text-slate-500 mt-2">
                Your dashboard modules use the shared dataset
                currently loaded in Data Management.
              </p>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Data Preferences
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Set the preferred display format for business metrics.
              </p>
            </div>

            <div>
              <label className={labelClass}>Currency</label>

              <select
                className={inputClass}
                value={settings.currency}
                onChange={(e) =>
                  updateSetting("currency", e.target.value)
                }
              >
                <option value="USD">USD – US Dollar ($)</option>
                <option value="INR">INR – Indian Rupee (₹)</option>
                <option value="EUR">EUR – Euro (€)</option>
                <option value="GBP">GBP – British Pound (£)</option>
                <option value="AED">AED – UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Number Format</label>

              <select
                className={inputClass}
                value={settings.numberFormat}
                onChange={(e) =>
                  updateSetting("numberFormat", e.target.value)
                }
              >
                <option value="standard">
                  Standard – 1,234,567
                </option>

                <option value="indian">
                  Indian – 12,34,567
                </option>
              </select>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
              <p className="text-xs text-slate-400">
                Selected preferences
              </p>

              <p className="text-sm font-semibold text-violet-300 mt-2">
                {settings.currency} ·{" "}
                {settings.numberFormat === "indian"
                  ? "Indian numbering"
                  : "Standard numbering"}
              </p>

              <p className="text-[11px] text-slate-500 mt-2">
                These are currently stored as display preferences.
                Global currency and number formatting integration
                is a separate enhancement.
              </p>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Notifications
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Manage your preferred notification options.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              {renderToggle(
                "notifications",
                "Application Notifications",
                "Enable or disable your general notification preference."
              )}

              {renderToggle(
                "reportNotifications",
                "Report Updates",
                "Enable or disable report-related notification preference."
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              These preferences are stored locally. The current
              application does not send push or email notifications.
            </p>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                About Shoplytics
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Application information and technology overview.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-slate-950 border border-violet-500/20">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
                <LayoutDashboard
                  size={25}
                  className="text-violet-300"
                />
              </div>

              <h3 className="text-2xl font-bold text-white">
                Shoplytics
              </h3>

              <p className="text-sm text-violet-300 mt-1">
                Intelligent Business Analytics Platform
              </p>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Shoplytics transforms business datasets into
                interactive dashboards, performance reports,
                customer insights and statistical forecasts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Frontend", "React + Vite"],
                ["Styling", "Tailwind CSS"],
                ["Visualizations", "Recharts"],
                ["Data Processing", "PapaParse"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <p className="text-[11px] text-slate-500">
                    {label}
                  </p>

                  <p className="text-sm text-white font-semibold mt-2">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
              <p className="text-xs text-slate-500">
                Application Version
              </p>

              <p className="text-sm font-semibold text-white mt-1">
                1.0.0
              </p>

              <p className="text-[11px] text-slate-500 mt-2">
                Student project · Business Intelligence and Analytics
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-7 pb-10">
      <div>
        <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold tracking-[2px] mb-2">
          <SettingsIcon size={15} />
          WORKSPACE CONFIGURATION
        </div>

        <h1 className="text-3xl font-bold text-white">
          Settings{" "}
          <span className="text-violet-400">
            & Preferences
          </span>
        </h1>

        <p className="text-sm text-slate-400 mt-2">
          Personalize your Shoplytics workspace and application
          preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 h-fit">
          <p className="text-[10px] tracking-[2px] text-slate-500 font-semibold px-3 py-3">
            SETTINGS MENU
          </p>

          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() =>
                    setActiveSection(section.id)
                  }
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition ${
                    active
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
                  <Icon size={17} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-7 min-w-0">
          {renderSection()}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-slate-800">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              <RotateCcw size={15} />
              Reset Defaults
            </button>

            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              <Save size={15} />
              Save Preferences
            </button>
          </div>

          {saved && (
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={15} />
              Your preferences have been saved successfully.
            </div>
          )}
        </main>
      </div>

      <p className="text-[11px] text-slate-600 text-center">
        Shoplytics Settings · Preferences are stored in this browser.
      </p>
    </div>
  );
}

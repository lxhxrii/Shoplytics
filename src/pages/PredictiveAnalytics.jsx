
import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  CalendarDays,
  ChartNoAxesCombined,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Clock3,
} from "lucide-react";

import { useDataset } from "../context/DatasetContext";

/* -------------------------------------------------------
   FORMATTERS
------------------------------------------------------- */

const currency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const number = (value) =>
  new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0));

const percentage = (value) => `${Number(value || 0).toFixed(1)}%`;

const parseAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;

  const cleaned = String(value ?? "")
    .replace(/[$,₹€£\s]/g, "")
    .replace(/[()]/g, "");

  if (!cleaned) return NaN;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
};

/* -------------------------------------------------------
   DATE HELPERS
------------------------------------------------------- */

const parseDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const excelDate = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(excelDate.getTime()) ? null : excelDate;
  }

  const text = String(value).trim();

  // Handles MM/DD/YYYY and DD/MM/YYYY-style dates.
  const slashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashDate) {
    const first = Number(slashDate[1]);
    const second = Number(slashDate[2]);
    const year = Number(slashDate[3]);

    // Prefer US format when the first value can be a month.
    const month = first <= 12 ? first : second;
    const day = first <= 12 ? second : first;

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }

    return null;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatMonth = (key) => {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

const average = (values) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

/* -------------------------------------------------------
   LINEAR REGRESSION
------------------------------------------------------- */

const linearRegression = (values) => {
  const n = values.length;

  if (n < 2) {
    return {
      slope: 0,
      intercept: values[0] || 0,
    };
  }

  const meanX = (n - 1) / 2;
  const meanY = average(values);

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY);
    denominator += (index - meanX) ** 2;
  });

  const slope = denominator ? numerator / denominator : 0;

  return {
    slope,
    intercept: meanY - slope * meanX,
  };
};

/* -------------------------------------------------------
   THEME-AWARE TOOLTIP
------------------------------------------------------- */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border p-4 shadow-xl"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-color)",
        color: "var(--text-primary)",
      }}
    >
      <p
        className="mb-3 text-xs font-semibold"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>

      {payload
        .filter((item) => item.value !== null && item.value !== undefined)
        .map((item, index) => (
          <div key={index} className="mb-2 flex items-center gap-2 last:mb-0">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />

            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.name}:
            </span>

            <span className="text-xs font-bold">
              {currency(item.value)}
            </span>
          </div>
        ))}
    </div>
  );
};

/* -------------------------------------------------------
   REUSABLE COMPONENTS
------------------------------------------------------- */

const panelStyle = {
  background: "var(--surface)",
  borderColor: "var(--border-color)",
};

const mutedPanelStyle = {
  background: "var(--surface-secondary)",
  borderColor: "var(--border-color)",
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "violet",
}) => {
  const colors = {
    violet: {
      background: "rgba(139, 92, 246, 0.12)",
      color: "#a78bfa",
      border: "rgba(139, 92, 246, 0.2)",
    },
    cyan: {
      background: "rgba(6, 182, 212, 0.12)",
      color: "#22d3ee",
      border: "rgba(6, 182, 212, 0.2)",
    },
    emerald: {
      background: "rgba(16, 185, 129, 0.12)",
      color: "#34d399",
      border: "rgba(16, 185, 129, 0.2)",
    },
    amber: {
      background: "rgba(245, 158, 11, 0.12)",
      color: "#fbbf24",
      border: "rgba(245, 158, 11, 0.2)",
    },
  };

  const accent = colors[color];

  return (
    <div
      className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1"
      style={panelStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {title}
          </p>

          <h2
            className="mt-3 break-words text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </h2>
        </div>

        <div
          className="rounded-xl border p-3"
          style={{
            background: accent.background,
            color: accent.color,
            borderColor: accent.border,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <p
        className="mt-4 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {subtitle}
      </p>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <ArrowUpRight size={14} className="text-emerald-400" />
          ) : (
            <ArrowDownRight size={14} className="text-rose-400" />
          )}

          <span className={trend >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {Math.abs(trend).toFixed(1)}%
          </span>

          <span style={{ color: "var(--text-muted)" }}>
            projected next-month change
          </span>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, color = "violet" }) => {
  const iconColors = {
    violet: "#a78bfa",
    cyan: "#22d3ee",
    amber: "#fbbf24",
    emerald: "#34d399",
  };

  return (
    <div className="mb-5 flex items-start gap-3">
      <div
        className="rounded-xl p-2.5"
        style={{
          background: "var(--accent-soft)",
          color: iconColors[color],
        }}
      >
        <Icon size={20} />
      </div>

      <div>
        <h2
          className="text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>

        <p
          className="mt-1 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};

const InsightCard = ({ icon: Icon, title, children, color }) => (
  <div
    className="rounded-xl border p-4"
    style={mutedPanelStyle}
  >
    <Icon size={19} className={`mb-3 ${color}`} />

    <h3
      className="text-sm font-semibold"
      style={{ color: "var(--text-primary)" }}
    >
      {title}
    </h3>

    <p
      className="mt-2 text-xs leading-relaxed"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </p>
  </div>
);

/* -------------------------------------------------------
   MAIN PAGE
------------------------------------------------------- */

function PredictiveAnalytics() {
  const { data, loading, error, hasData } = useDataset();

  const [forecastMonths, setForecastMonths] = useState(3);
  const [selectedMetric, setSelectedMetric] = useState("sales");

  /* -----------------------------------------------------
     DATA ANALYSIS AND FORECASTING
  ----------------------------------------------------- */

  const analysis = useMemo(() => {
    if (!data?.length) return null;

    const keys = Object.keys(data[0] || {});

    const findField = (terms) =>
      keys.find((key) => {
        const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
        return terms.some((term) => normalized.includes(term));
      });

    const dateField = findField(["orderdate", "date"]);
    const salesField = findField(["sales", "revenue", "amount"]);
    const profitField = findField(["profit", "netincome"]);

    if (!dateField || !salesField) {
      return {
        error: "The dataset must contain Order Date and Sales columns.",
      };
    }

    const monthly = {};
    let validRows = 0;

    data.forEach((row) => {
      const date = parseDate(row[dateField]);
      const sales = parseAmount(row[salesField]);

      const profit = profitField
        ? parseAmount(row[profitField])
        : 0;

      if (
        !date ||
        !Number.isFinite(sales) ||
        !Number.isFinite(profit)
      ) {
        return;
      }

      const key = getMonthKey(date);

      if (!monthly[key]) {
        monthly[key] = {
          key,
          sales: 0,
          profit: 0,
          orders: 0,
        };
      }

      monthly[key].sales += sales;
      monthly[key].profit += profit;
      monthly[key].orders += 1;

      validRows += 1;
    });

    const historical = Object.values(monthly).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    if (historical.length < 3) {
      return {
        error:
          "At least three months of valid historical data are required for forecasting.",
      };
    }

    const salesValues = historical.map((item) => item.sales);
    const profitValues = historical.map((item) => item.profit);

    const salesModel = linearRegression(salesValues);
    const profitModel = linearRegression(profitValues);

    const lastKey = historical[historical.length - 1].key;
    const [lastYear, lastMonth] = lastKey.split("-").map(Number);

    const future = [];

    for (let i = 1; i <= forecastMonths; i++) {
      const index = historical.length - 1 + i;
      const date = new Date(lastYear, lastMonth - 1 + i, 1);
      const key = getMonthKey(date);

      const predictedSales = Math.max(
        0,
        salesModel.intercept + salesModel.slope * index
      );

      const predictedProfit =
        profitModel.intercept + profitModel.slope * index;

      future.push({
        key,
        month: formatMonth(key),
        sales: predictedSales,
        profit: predictedProfit,
        forecast: true,
      });
    }

    const historicalWithLabels = historical.map((item) => ({
      ...item,
      month: formatMonth(item.key),
      actualSales: item.sales,
      actualProfit: item.profit,
      forecast: false,
    }));

    const forecastChart = [
      ...historicalWithLabels,
      ...future.map((item) => ({
        ...item,
        actualSales: null,
        actualProfit: null,
      })),
    ];

    const splitIndex = Math.floor(historical.length / 2);

    const firstHalf = historical.slice(0, splitIndex);
    const secondHalf = historical.slice(splitIndex);

    const firstAverage = average(firstHalf.map((item) => item.sales));
    const secondAverage = average(secondHalf.map((item) => item.sales));

    const historicalGrowth =
      firstAverage > 0
        ? ((secondAverage - firstAverage) / firstAverage) * 100
        : 0;

    const lastThree = historical.slice(-3);
    const previousThree = historical.slice(-6, -3);

    const previousAverage = average(
      previousThree.map((item) => item.sales)
    );

    const recentAverage = average(
      lastThree.map((item) => item.sales)
    );

    const recentGrowth =
      previousThree.length && previousAverage > 0
        ? ((recentAverage - previousAverage) / previousAverage) * 100
        : 0;

    const monthlySeasonality = Array.from({ length: 12 }, (_, index) => {
      const matching = historical.filter((item) => {
        const month = Number(item.key.split("-")[1]) - 1;
        return month === index;
      });

      return {
        month: new Date(2024, index, 1).toLocaleDateString("en-US", {
          month: "short",
        }),
        sales: average(matching.map((item) => item.sales)),
        observations: matching.length,
      };
    });

    const observedMonths = monthlySeasonality.filter(
      (item) => item.observations > 0
    );

    const highestMonth = [...observedMonths].sort(
      (a, b) => b.sales - a.sales
    )[0];

    const lowestMonth = [...observedMonths].sort(
      (a, b) => a.sales - b.sales
    )[0];

    const lastSales = historical[historical.length - 1].sales;
    const nextSales = future[0]?.sales || 0;

    const forecastGrowth =
      lastSales > 0
        ? ((nextSales - lastSales) / lastSales) * 100
        : 0;

    const totalHistoricalSales = salesValues.reduce(
      (sum, value) => sum + value,
      0
    );

    const totalHistoricalProfit = profitValues.reduce(
      (sum, value) => sum + value,
      0
    );

    const projectedSales = future.reduce(
      (sum, item) => sum + item.sales,
      0
    );

    const projectedProfit = future.reduce(
      (sum, item) => sum + item.profit,
      0
    );

    const averageMonthlySales = average(salesValues);

    const variance = average(
      salesValues.map(
        (value) => (value - averageMonthlySales) ** 2
      )
    );

    const volatility =
      averageMonthlySales > 0
        ? (Math.sqrt(variance) / averageMonthlySales) * 100
        : 0;

    const negativeProfitMonths = historical.filter(
      (item) => item.profit < 0
    ).length;

    const riskAlerts = [];

    if (recentGrowth < -10) {
      riskAlerts.push({
        level: "High",
        title: "Recent sales decline",
        description: `Average monthly sales have declined by ${Math.abs(
          recentGrowth
        ).toFixed(1)}% between the two latest three-month periods.`,
      });
    }

    if (negativeProfitMonths > 0) {
      riskAlerts.push({
        level: "Medium",
        title: "Loss-making months detected",
        description: `${negativeProfitMonths} historical months recorded negative total profit.`,
      });
    }

    if (volatility > 30) {
      riskAlerts.push({
        level: "Medium",
        title: "High sales volatility",
        description: `Monthly sales variation is approximately ${volatility.toFixed(
          1
        )}% of average sales.`,
      });
    }

    if (!riskAlerts.length) {
      riskAlerts.push({
        level: "Low",
        title: "No major trend warning",
        description:
          "The selected historical data does not trigger the configured sales or profit risk thresholds.",
      });
    }

    return {
      historical,
      future,
      forecastChart,
      monthlySeasonality,
      highestMonth,
      lowestMonth,
      historicalGrowth,
      recentGrowth,
      forecastGrowth,
      projectedSales,
      projectedProfit,
      totalHistoricalSales,
      totalHistoricalProfit,
      averageMonthlySales,
      volatility,
      negativeProfitMonths,
      riskAlerts,
      validRows,
      salesField,
      profitField,
      dateField,
    };
  }, [data, forecastMonths]);

  /* -----------------------------------------------------
     LOADING AND ERROR STATES
  ----------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto mb-4 animate-spin text-violet-400"
          />

          <p style={{ color: "var(--text-secondary)" }}>
            Preparing predictive analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border p-8"
        style={{
          background: "var(--surface)",
          borderColor: "rgba(244, 63, 94, 0.3)",
          color: "var(--text-primary)",
        }}
      >
        <AlertTriangle className="mb-3 text-rose-400" size={28} />
        <h2 className="font-bold">Unable to load dataset</h2>

        <p
          className="mt-2 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {error}
        </p>
      </div>
    );
  }

  if (!hasData || !analysis) {
    return (
      <div
        className="rounded-2xl border p-10 text-center"
        style={panelStyle}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
          <BrainCircuit size={34} className="text-violet-400" />
        </div>

        <h2
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Dataset Required
        </h2>

        <p
          className="mx-auto mt-2 max-w-md text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Upload a dataset in Data Management to generate sales forecasts,
          identify trends, and review potential business risks.
        </p>
      </div>
    );
  }

  if (analysis.error) {
    return (
      <div className="rounded-2xl border border-amber-500/20 p-8" style={panelStyle}>
        <AlertTriangle className="mb-3 text-amber-400" size={28} />

        <h2
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Forecasting unavailable
        </h2>

        <p
          className="mt-2 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {analysis.error}
        </p>

        <p
          className="mt-3 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Required columns: Order Date and Sales. At least three months of
          valid data are needed.
        </p>
      </div>
    );
  }

  /* -----------------------------------------------------
     CHART DATA
  ----------------------------------------------------- */

  const isSales = selectedMetric === "sales";
  const forecastLabel = isSales ? "Sales" : "Profit";

  const selectedData = analysis.forecastChart.map((item) => ({
    ...item,
    actualValue: isSales ? item.actualSales : item.actualProfit,
    projectedValue: item.forecast
      ? isSales
        ? item.sales
        : item.profit
      : null,
  }));

  const chartColor = isSales ? "#8b5cf6" : "#10b981";
  const historicalColor = isSales ? "#22d3ee" : "#34d399";

  const axisColor = "var(--chart-text)";
  const gridColor = "var(--chart-grid)";

  /* -----------------------------------------------------
     PAGE UI
  ----------------------------------------------------- */

  return (
    <div className="space-y-7 pb-10">
      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
              <BrainCircuit size={19} className="text-violet-400" />
            </div>

            <span className="text-[10px] font-bold tracking-[3px] text-violet-400">
              INTELLIGENCE ENGINE
            </span>
          </div>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Predictive Analytics
          </h1>

          <p
            className="mt-2 max-w-2xl text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Explore historical trends, forecast future performance, and
            identify potential business risks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              Dataset connected
            </span>
          </div>

          <select
            value={forecastMonths}
            onChange={(e) => setForecastMonths(Number(e.target.value))}
            className="rounded-xl border px-4 py-2.5 text-xs font-medium outline-none transition focus:border-violet-500"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <option value={3}>Next 3 months</option>
            <option value={6}>Next 6 months</option>
            <option value={12}>Next 12 months</option>
          </select>
        </div>
      </div>

      {/* MODEL INFORMATION */}

      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-transparent p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles size={23} className="text-violet-400" />
            </div>

            <div>
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Statistical Forecasting Model
              </h3>

              <p
                className="mt-1 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Linear regression applied to historical monthly performance.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-[10px] font-semibold text-violet-400">
            TREND-BASED PROJECTION · NOT AN ML MODEL
          </span>
        </div>
      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={`Projected ${forecastMonths}-Month Sales`}
          value={currency(analysis.projectedSales)}
          subtitle="Total projected revenue"
          icon={TrendingUp}
          trend={analysis.forecastGrowth}
          color="violet"
        />

        <StatCard
          title={`Projected ${forecastMonths}-Month Profit`}
          value={currency(analysis.projectedProfit)}
          subtitle="Estimated total profit"
          icon={Target}
          color="emerald"
        />

        <StatCard
          title="Historical Sales"
          value={currency(analysis.totalHistoricalSales)}
          subtitle={`${analysis.historical.length} months of data`}
          icon={ChartNoAxesCombined}
          color="cyan"
        />

        <StatCard
          title="Sales Volatility"
          value={percentage(analysis.volatility)}
          subtitle="Relative monthly sales variation"
          icon={Activity}
          color="amber"
        />
      </div>

      {/* FORECAST CHART */}

      <section className="rounded-2xl border p-5 md:p-6" style={panelStyle}>
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Performance Forecast
            </h2>

            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Historical performance compared with projected future values
            </p>
          </div>

          <div
            className="flex w-fit items-center gap-1 rounded-xl border p-1"
            style={{
              background: "var(--surface-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <button
              onClick={() => setSelectedMetric("sales")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                isSales
                  ? "bg-violet-600 text-white shadow"
                  : ""
              }`}
              style={
                !isSales
                  ? { color: "var(--text-secondary)" }
                  : undefined
              }
            >
              Sales
            </button>

            <button
              onClick={() => setSelectedMetric("profit")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                !isSales
                  ? "bg-violet-600 text-white shadow"
                  : ""
              }`}
              style={
                isSales
                  ? { color: "var(--text-secondary)" }
                  : undefined
              }
            >
              Profit
            </button>
          </div>
        </div>

        <div className="h-[330px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={selectedData}
              margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="predictiveForecastGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 10 }}
                tickFormatter={(value) => `$${number(value)}`}
                tickLine={false}
                axisLine={false}
                width={75}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{
                  fontSize: "11px",
                  color: axisColor,
                  paddingTop: "12px",
                }}
              />

              <ReferenceLine
                x={analysis.future[0]?.month}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: "Forecast begins",
                  fill: "#f59e0b",
                  fontSize: 10,
                }}
              />

              <Area
                type="monotone"
                dataKey="actualValue"
                name={`Historical ${forecastLabel}`}
                stroke={historicalColor}
                fill={historicalColor}
                fillOpacity={0.08}
                strokeWidth={2}
                connectNulls={false}
              />

              <Area
                type="monotone"
                dataKey="projectedValue"
                name={`Projected ${forecastLabel}`}
                stroke={chartColor}
                fill="url(#predictiveForecastGradient)"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-5 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="flex items-center gap-2">
            <span className="h-1 w-3 rounded bg-cyan-400" />
            Historical performance
          </span>

          <span className="flex items-center gap-2">
            <span className="h-1 w-3 rounded bg-violet-400" />
            Projected performance
          </span>
        </div>
      </section>

      {/* SEASONALITY AND TREND ANALYSIS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* SEASONAL PERFORMANCE */}

        <section className="rounded-2xl border p-5" style={panelStyle}>
          <SectionHeader
            icon={CalendarDays}
            title="Seasonal Performance"
            subtitle="Average sales for each calendar month across available years"
            color="cyan"
          />

          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.monthlySeasonality}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: axisColor, fontSize: 10 }}
                  tickFormatter={(value) => `$${number(value)}`}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />

                <Tooltip content={<CustomTooltip />} />

                <Bar
                  dataKey="sales"
                  name="Average Sales"
                  fill="#8b5cf6"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3" style={mutedPanelStyle}>
              <p
                className="text-[10px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Strongest observed month
              </p>

              <p className="mt-1 text-sm font-bold text-emerald-400">
                {analysis.highestMonth?.month || "N/A"}
              </p>

              <p
                className="mt-1 text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                {analysis.highestMonth
                  ? currency(analysis.highestMonth.sales)
                  : "No data"}
              </p>
            </div>

            <div className="rounded-xl border p-3" style={mutedPanelStyle}>
              <p
                className="text-[10px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Weakest observed month
              </p>

              <p className="mt-1 text-sm font-bold text-amber-400">
                {analysis.lowestMonth?.month || "N/A"}
              </p>

              <p
                className="mt-1 text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                {analysis.lowestMonth
                  ? currency(analysis.lowestMonth.sales)
                  : "No data"}
              </p>
            </div>
          </div>
        </section>

        {/* TREND ANALYSIS */}

        <section className="rounded-2xl border p-5" style={panelStyle}>
          <SectionHeader
            icon={TrendingUp}
            title="Trend Analysis"
            subtitle="Historical sales and profit movement"
            color="emerald"
          />

          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={mutedPanelStyle}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Long-term sales trend
                </span>

                <span
                  className={`text-xs font-bold ${
                    analysis.historicalGrowth >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {analysis.historicalGrowth >= 0 ? "+" : ""}
                  {percentage(analysis.historicalGrowth)}
                </span>
              </div>

              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {analysis.historicalGrowth >= 0
                  ? "Sales have generally increased across the historical periods."
                  : "Sales have generally decreased across the historical periods."}
              </p>
            </div>

            <div className="rounded-xl border p-4" style={mutedPanelStyle}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Recent sales movement
                </span>

                <span
                  className={`text-xs font-bold ${
                    analysis.recentGrowth >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {analysis.recentGrowth >= 0 ? "+" : ""}
                  {percentage(analysis.recentGrowth)}
                </span>
              </div>

              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Comparison of the latest three-month period with the
                preceding three-month period.
              </p>
            </div>

            <div className="rounded-xl border p-4" style={mutedPanelStyle}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Historical profit
                </span>

                <span className="text-sm font-bold text-cyan-400">
                  {currency(analysis.totalHistoricalProfit)}
                </span>
              </div>

              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {analysis.negativeProfitMonths === 0
                  ? "No historical month had negative total profit."
                  : `${analysis.negativeProfitMonths} months recorded negative total profit.`}
              </p>
            </div>

            <div className="rounded-xl border p-4" style={mutedPanelStyle}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Projected sales growth
                </span>

                <span className="text-sm font-bold text-violet-400">
                  {analysis.forecastGrowth >= 0 ? "+" : ""}
                  {percentage(analysis.forecastGrowth)}
                </span>
              </div>

              <p
                className="mt-2 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                First forecast month compared with the latest historical
                month.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* BUSINESS RISK MONITOR */}

      <section className="rounded-2xl border p-5 md:p-6" style={panelStyle}>
        <SectionHeader
          icon={ShieldCheck}
          title="Business Risk Monitor"
          subtitle="Rule-based warnings derived from historical data"
          color="amber"
        />

        <div className="space-y-3">
          {analysis.riskAlerts.map((alert, index) => {
            const styles = {
              High: {
                icon: "bg-rose-500/10 text-rose-400",
                badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
              },
              Medium: {
                icon: "bg-amber-500/10 text-amber-400",
                badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
              },
              Low: {
                icon: "bg-emerald-500/10 text-emerald-400",
                badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
              },
            };

            const style = styles[alert.level] || styles.Low;

            return (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                style={mutedPanelStyle}
              >
                <div className={`rounded-lg p-2.5 ${style.icon}`}>
                  <AlertTriangle size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {alert.title}
                  </h3>

                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {alert.description}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-semibold ${style.badge}`}
                >
                  {alert.level} risk
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* PREDICTIVE BUSINESS INSIGHTS */}

      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent p-5 md:p-6">
        <SectionHeader
          icon={Lightbulb}
          title="Predictive Business Insights"
          subtitle="Automatically generated observations from the selected dataset"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InsightCard
            icon={TrendingUp}
            title="Revenue outlook"
            color="text-emerald-400"
          >
            The trend model projects {currency(analysis.projectedSales)} in
            sales over the next {forecastMonths} months. Review the forecast
            alongside actual demand and business plans.
          </InsightCard>

          <InsightCard
            icon={CalendarDays}
            title="Seasonal planning"
            color="text-cyan-400"
          >
            {analysis.highestMonth?.month || "N/A"} has the highest average
            sales among observed calendar months. Consider this when planning
            inventory and campaigns.
          </InsightCard>

          <InsightCard
            icon={Activity}
            title="Stability assessment"
            color="text-amber-400"
          >
            Historical monthly sales volatility is{" "}
            {percentage(analysis.volatility)}. Monitor unusually large changes
            before making resource allocation decisions.
          </InsightCard>
        </div>
      </section>

      {/* FORECAST BREAKDOWN */}

      <section className="rounded-2xl border p-5" style={panelStyle}>
        <SectionHeader
          icon={BarChart3}
          title="Forecast Breakdown"
          subtitle="Month-wise projected revenue, profit, and profit margin"
          color="violet"
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-violet-500/10 px-3 py-2 text-[10px] font-semibold text-violet-400">
            {forecastMonths}-MONTH OUTLOOK
          </span>

          <span
            className="rounded-lg px-3 py-2 text-[10px]"
            style={{
              background: "var(--surface-secondary)",
              color: "var(--text-secondary)",
            }}
          >
            {analysis.future.length} forecast periods
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr
                className="border-b text-[10px] uppercase tracking-wider"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="px-3 py-3">Month</th>
                <th className="px-3 py-3 text-right">Projected Sales</th>
                <th className="px-3 py-3 text-right">Projected Profit</th>
                <th className="px-3 py-3 text-right">Profit Margin</th>
                <th className="px-3 py-3 text-right">Status</th>
              </tr>
            </thead>

            <tbody>
              {analysis.future.map((item) => {
                const margin =
                  item.sales > 0
                    ? (item.profit / item.sales) * 100
                    : 0;

                return (
                  <tr
                    key={item.key}
                    className="border-b text-xs transition hover:bg-violet-500/5"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <td
                      className="px-3 py-4 font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.month}
                    </td>

                    <td
                      className="px-3 py-4 text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {currency(item.sales)}
                    </td>

                    <td
                      className={`px-3 py-4 text-right font-medium ${
                        item.profit >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {currency(item.profit)}
                    </td>

                    <td
                      className="px-3 py-4 text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {percentage(margin)}
                    </td>

                    <td className="px-3 py-4 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          item.profit >= 0
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {item.profit >= 0 ? "Positive" : "Negative"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* DATA SUMMARY */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4" style={panelStyle}>
          <div className="mb-2 flex items-center gap-2">
            <Clock3 size={16} className="text-violet-400" />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Historical coverage
            </span>
          </div>

          <p
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {analysis.historical.length} months
          </p>
        </div>

        <div className="rounded-xl border p-4" style={panelStyle}>
          <div className="mb-2 flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Valid records
            </span>
          </div>

          <p
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {number(analysis.validRows)}
          </p>
        </div>

        <div className="rounded-xl border p-4" style={panelStyle}>
          <div className="mb-2 flex items-center gap-2">
            <Target size={16} className="text-emerald-400" />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Average monthly sales
            </span>
          </div>

          <p
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {currency(analysis.averageMonthlySales)}
          </p>
        </div>
      </section>

      {/* MODEL LIMITATIONS */}

      <div
        className="flex items-start gap-3 rounded-xl border p-4 text-[10px] leading-relaxed"
        style={{
          background: "var(--surface-secondary)",
          borderColor: "var(--border-color)",
          color: "var(--text-secondary)",
        }}
      >
        <AlertTriangle
          size={15}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p>
          Forecasts are generated using linear regression on aggregated
          historical monthly data. They assume that the existing trend
          continues and do not account for external events, promotions,
          economic conditions, or future changes in customer behaviour.
          Seasonal averages are descriptive and are not included in the
          regression forecast. These projections are estimates, not guaranteed
          future results.
        </p>
      </div>
    </div>
  );
}

export default PredictiveAnalytics;

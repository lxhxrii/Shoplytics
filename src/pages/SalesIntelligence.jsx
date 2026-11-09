
import React, { useMemo, useState } from "react";
import { useDataset } from "../context/DatasetContext";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Filter,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Truck,
  CalendarDays,
  MapPin,
  Percent,
} from "lucide-react";

// --------------------------------------------------
// THEME AND DESIGN
// --------------------------------------------------

const PALETTE = [
  "#8B5CF6",
  "#22D3EE",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#6366F1",
];

const panel =
  "rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5";

const tooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const number = (value) => {
  const parsed = Number(
    String(value ?? "").replace(/[$,%\s,]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const compactMoney = (value) => {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return money(amount);
};

// Supports common MM/DD/YYYY and ISO-style dates.
const parseDate = (value) => {
  if (!value) return null;

  const raw = String(value).trim();

  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    const year = Number(us[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const monthLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });

const getUnique = (rows, field) =>
  field
    ? [
        ...new Set(
          rows
            .map((row) => String(row[field] ?? "").trim())
            .filter(Boolean)
        ),
      ].sort()
    : [];

const groupSum = (rows, keyFn, valueFn) => {
  const map = new Map();

  rows.forEach((row) => {
    const key = keyFn(row);

    if (!key) return;

    map.set(key, (map.get(key) || 0) + valueFn(row));
  });

  return [...map.entries()].map(([name, value]) => ({
    name,
    value,
  }));
};

// --------------------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------------------

function SelectFilter({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-[145px] flex-1 flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-violet-500"
      >
        <option value="All">All</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value, note, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-[var(--text-muted)]">
        {note}
      </p>
    </div>
  );
}

function PanelTitle({ title, subtitle, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h2>

        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {subtitle}
        </p>
      </div>

      {right && (
        <span className="text-[10px] text-violet-500">
          {right}
        </span>
      )}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] px-5 text-center text-xs text-[var(--text-muted)]">
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="text-[10px] font-semibold tracking-[0.2em] text-cyan-500">
      {children}
    </span>
  );
}

// --------------------------------------------------
// MAIN SALES INTELLIGENCE PAGE
// --------------------------------------------------

export default function SalesIntelligence() {
  const {
    data = [],
    columns = [],
    loading,
    error,
    fileName,
  } = useDataset();

  const [region, setRegion] = useState("All");
  const [category, setCategory] = useState("All");
  const [period, setPeriod] = useState("All");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ------------------------------------------------
  // AUTOMATIC COLUMN DETECTION
  // ------------------------------------------------

  const field = useMemo(() => {
    const normalized = columns.reduce((acc, col) => {
      acc[
        String(col)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      ] = col;

      return acc;
    }, {});

    const pick = (...aliases) => {
      for (const alias of aliases) {
        const match =
          normalized[
            alias.toLowerCase().replace(/[^a-z0-9]/g, "")
          ];

        if (match) return match;
      }

      return null;
    };

    return {
      sales: pick("Sales", "Revenue", "Total Sales"),
      profit: pick("Profit", "Net Profit"),
      quantity: pick("Quantity", "Units Sold"),
      orderId: pick("Order ID", "Order Number"),
      date: pick("Order Date", "Date"),
      region: pick("Region"),
      state: pick("State"),
      city: pick("City"),
      category: pick("Category", "Product Category"),
      discount: pick("Discount"),
      shipMode: pick("Ship Mode", "Shipping Mode"),
    };
  }, [columns]);

  // ------------------------------------------------
  // FILTER OPTIONS
  // ------------------------------------------------

  const options = useMemo(
    () => ({
      regions: getUnique(data, field.region),
      categories: getUnique(data, field.category),
    }),
    [data, field]
  );

  // ------------------------------------------------
  // DATE RANGE
  // ------------------------------------------------

  const dateBounds = useMemo(() => {
    const dates = data
      .map((row) => parseDate(row[field.date]))
      .filter(Boolean);

    if (!dates.length) {
      return {
        min: "",
        max: "",
      };
    }

    return {
      min: formatDateInput(
        new Date(
          Math.min(...dates.map((date) => date.getTime()))
        )
      ),

      max: formatDateInput(
        new Date(
          Math.max(...dates.map((date) => date.getTime()))
        )
      ),
    };
  }, [data, field.date]);

  // ------------------------------------------------
  // FILTERED DATA
  // ------------------------------------------------

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (
        region !== "All" &&
        String(row[field.region] ?? "").trim() !== region
      ) {
        return false;
      }

      if (
        category !== "All" &&
        String(row[field.category] ?? "").trim() !== category
      ) {
        return false;
      }

      const date = parseDate(row[field.date]);

      if (
        (startDate || endDate || period !== "All") &&
        !date
      ) {
        return false;
      }

      if (
        date &&
        startDate &&
        date < new Date(`${startDate}T00:00:00`)
      ) {
        return false;
      }

      if (
        date &&
        endDate &&
        date > new Date(`${endDate}T23:59:59`)
      ) {
        return false;
      }

      if (date && period !== "All") {
        const months = Number(period);

        const latest = dateBounds.max
          ? new Date(`${dateBounds.max}T00:00:00`)
          : new Date();

        const cutoff = new Date(latest);

        cutoff.setMonth(cutoff.getMonth() - months);

        if (date < cutoff || date > latest) {
          return false;
        }
      }

      return true;
    });
  }, [
    data,
    field,
    region,
    category,
    startDate,
    endDate,
    period,
    dateBounds.max,
  ]);

  // ------------------------------------------------
  // SALES ANALYSIS ENGINE
  // ------------------------------------------------

  const analysis = useMemo(() => {
    const sales = (row) =>
      field.sales ? number(row[field.sales]) : 0;

    const profit = (row) =>
      field.profit ? number(row[field.profit]) : 0;

    const quantity = (row) =>
      field.quantity ? number(row[field.quantity]) : 0;

    const totalSales = filtered.reduce(
      (sum, row) => sum + sales(row),
      0
    );

    const totalProfit = filtered.reduce(
      (sum, row) => sum + profit(row),
      0
    );

    const totalQuantity = filtered.reduce(
      (sum, row) => sum + quantity(row),
      0
    );

    const orders = field.orderId
      ? new Set(
          filtered
            .map((row) =>
              String(row[field.orderId] ?? "").trim()
            )
            .filter(Boolean)
        ).size
      : filtered.length;

    const margin = totalSales
      ? (totalProfit / totalSales) * 100
      : 0;

    // Monthly and daily sales

    const monthlyMap = new Map();
    const dailyMap = new Map();

    filtered.forEach((row) => {
      const date = parseDate(row[field.date]);

      if (!date) return;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthEntry = monthlyMap.get(monthKey) || {
        month: monthLabel(date),
        sales: 0,
        profit: 0,
        orders: new Set(),
      };

      monthEntry.sales += sales(row);
      monthEntry.profit += profit(row);

      if (field.orderId && row[field.orderId]) {
        monthEntry.orders.add(String(row[field.orderId]));
      }

      monthlyMap.set(monthKey, monthEntry);

      const dayKey = formatDateInput(date);

      dailyMap.set(
        dayKey,
        (dailyMap.get(dayKey) || 0) + sales(row)
      );
    });

    const monthly = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => ({
        key,
        month: item.month,
        sales: Math.round(item.sales),
        profit: Math.round(item.profit),
        orders: field.orderId ? item.orders.size : 0,
      }));

    // Month-over-month growth

    const monthlyGrowth = monthly.map((item, index) => {
      const previous = monthly[index - 1]?.sales;

      return {
        ...item,
        growth: previous
          ? ((item.sales - previous) / Math.abs(previous)) * 100
          : null,
      };
    });

    // Region analysis

    const regionRows = groupSum(
      filtered,
      (row) => row[field.region] || row[field.state],
      sales
    )
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Category analysis

    const categoryRows = groupSum(
      filtered,
      (row) => row[field.category],
      sales
    ).sort((a, b) => b.value - a.value);

    // Shipping analysis

    const shippingRows = groupSum(
      filtered,
      (row) => row[field.shipMode],
      () => 1
    ).sort((a, b) => b.value - a.value);

    // Discount and profit analysis

    const discountMap = new Map();

    if (field.discount && field.profit) {
      filtered.forEach((row) => {
        const discountValue = number(row[field.discount]);

        const key = `${Math.round(discountValue * 100)}%`;

        const current = discountMap.get(key) || {
          discount: key,
          profit: 0,
          sales: 0,
          count: 0,
        };

        current.profit += profit(row);
        current.sales += sales(row);
        current.count += 1;

        discountMap.set(key, current);
      });
    }

    const discountRows = [...discountMap.values()]
      .sort(
        (a, b) =>
          Number(a.discount.replace("%", "")) -
          Number(b.discount.replace("%", ""))
      )
      .map((item) => ({
        ...item,
        profit: Math.round(item.profit),
        sales: Math.round(item.sales),
        margin: item.sales
          ? Number(
              ((item.profit / item.sales) * 100).toFixed(1)
            )
          : 0,
      }));

    // Daily sales

    const daily = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, value]) => ({
        date: date.slice(5),
        sales: Math.round(value),
      }));

    // Best and lowest sales month

    const bestMonth = [...monthly].sort(
      (a, b) => b.sales - a.sales
    )[0];

    const worstMonth = [...monthly].sort(
      (a, b) => a.sales - b.sales
    )[0];

    return {
      totalSales,
      totalProfit,
      totalQuantity,
      orders,
      margin,

      averageOrderValue: orders
        ? totalSales / orders
        : 0,

      monthly,
      monthlyGrowth,
      daily,
      regionRows,
      categoryRows,
      shippingRows,
      discountRows,
      bestMonth,
      worstMonth,
    };
  }, [filtered, field]);

  // ------------------------------------------------
  // RESET FILTERS
  // ------------------------------------------------

  const resetFilters = () => {
    setRegion("All");
    setCategory("All");
    setPeriod("All");
    setStartDate("");
    setEndDate("");
  };

  // ------------------------------------------------
  // LOADING STATE
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading sales intelligence...
      </div>
    );
  }

  // ------------------------------------------------
  // EMPTY DATASET STATE
  // ------------------------------------------------

  if (!data.length) {
    return (
      <div className={`${panel} py-12 text-center`}>
        <AlertTriangle
          className="mx-auto mb-3 text-amber-500"
          size={28}
        />

        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          No dataset loaded
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {error ||
            "Load a CSV file from Data Management to explore sales intelligence."}
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // SALES COLUMN VALIDATION
  // ------------------------------------------------

  if (!field.sales) {
    return (
      <div className={`${panel} py-12 text-center`}>
        <AlertTriangle
          className="mx-auto mb-3 text-amber-500"
          size={28}
        />

        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Sales column not found
        </h2>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This page needs a column named Sales, Revenue, or Total Sales.
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // MAIN PAGE UI
  // ------------------------------------------------

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22D3EE]" />

            <SectionLabel>
              SALES INTELLIGENCE
            </SectionLabel>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
            Sales Performance Analysis
          </h1>

          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Explore revenue drivers, growth patterns and sales efficiency from your actual data.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
            Analysing dataset
          </p>

          <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-[var(--text-primary)]">
            {fileName || "Current CSV"}
          </p>

          <p className="mt-1 text-[10px] text-emerald-500">
            {filtered.length.toLocaleString("en-IN")} filtered records
          </p>
        </div>
      </div>

      {/* FILTER SECTION */}

      <section className={`${panel} space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-violet-500" />

            <h2 className="text-xs font-semibold text-[var(--text-primary)]">
              Analysis filters
            </h2>
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] transition hover:text-violet-500"
          >
            <RotateCcw size={13} />
            Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SelectFilter
            label="Region"
            value={region}
            onChange={setRegion}
            options={options.regions}
          />

          <SelectFilter
            label="Category"
            value={category}
            onChange={setCategory}
            options={options.categories}
          />

          <SelectFilter
            label="Quick date range"
            value={period}
            onChange={(value) => {
              setPeriod(value);
              setStartDate("");
              setEndDate("");
            }}
            options={["3", "6", "12"]}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Start date
            </span>

            <input
              type="date"
              min={dateBounds.min || undefined}
              max={dateBounds.max || undefined}
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPeriod("All");
              }}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              End date
            </span>

            <input
              type="date"
              min={dateBounds.min || undefined}
              max={dateBounds.max || undefined}
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPeriod("All");
              }}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <p className="text-[10px] text-[var(--text-muted)]">
          Quick range options: choose 3, 6 or 12 months. Date filters and region/category filters update every chart below.
        </p>
      </section>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Filtered sales"
          value={compactMoney(analysis.totalSales)}
          note="Revenue in selected filters"
          icon={IndianRupee}
          accent="bg-violet-500/15 text-violet-500"
        />

        <Metric
          label="Orders"
          value={analysis.orders.toLocaleString("en-IN")}
          note="Distinct order IDs"
          icon={ShoppingCart}
          accent="bg-blue-500/15 text-blue-500"
        />

        <Metric
          label="Profit"
          value={compactMoney(analysis.totalProfit)}
          note={`${analysis.margin.toFixed(2)}% profit margin`}
          icon={TrendingUp}
          accent="bg-emerald-500/15 text-emerald-500"
        />

        <Metric
          label="Average order value"
          value={money(analysis.averageOrderValue)}
          note={`${analysis.totalQuantity.toLocaleString("en-IN")} units sold`}
          icon={Percent}
          accent="bg-cyan-500/15 text-cyan-500"
        />
      </div>

      {/* MONTHLY SALES AND CATEGORY ANALYSIS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* MONTHLY SALES */}

        <div className={`${panel} xl:col-span-2`}>
          <PanelTitle
            title="Monthly sales and profit"
            subtitle="Track revenue and profitability over time"
            right={`${analysis.monthly.length} months`}
          />

          {analysis.monthly.length ? (
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysis.monthly}>
                  <defs>
                    <linearGradient
                      id="salesIntelGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8B5CF6"
                        stopOpacity={0.32}
                      />

                      <stop
                        offset="95%"
                        stopColor="#8B5CF6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={compactMoney}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => money(value)}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: "10px",
                      color: "var(--text-secondary)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#A78BFA"
                    strokeWidth={2.5}
                    fill="url(#salesIntelGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              No valid order dates were found for the selected records.
            </EmptyState>
          )}
        </div>

        {/* CATEGORY ANALYSIS */}

        <div className={panel}>
          <PanelTitle
            title="Sales by category"
            subtitle="Which categories contribute most revenue?"
          />

          {analysis.categoryRows.length ? (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.categoryRows}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={85}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {analysis.categoryRows.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={PALETTE[index % PALETTE.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => money(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {analysis.categoryRows.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: PALETTE[index % PALETTE.length],
                        }}
                      />

                      {item.name}
                    </div>

                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      {analysis.totalSales
                        ? (
                            (item.value / analysis.totalSales) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState>
              Category field not available.
            </EmptyState>
          )}
        </div>
      </div>

      {/* REGION AND GROWTH ANALYSIS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* REGION RANKING */}

        <div className={panel}>
          <PanelTitle
            title="Regional sales ranking"
            subtitle="Compare sales across regions or states"
          />

          {analysis.regionRows.length ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysis.regionRows}
                  layout="vertical"
                  margin={{
                    left: 10,
                    right: 15,
                  }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    tickFormatter={compactMoney}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={85}
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => money(value)}
                  />

                  <Bar
                    dataKey="value"
                    name="Sales"
                    fill="#8B5CF6"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              Region or state field not available.
            </EmptyState>
          )}
        </div>

        {/* MONTHLY GROWTH */}

        <div className={panel}>
          <PanelTitle
            title="Month-over-month growth"
            subtitle="Percentage change compared with the previous month"
          />

          {analysis.monthlyGrowth.length > 1 ? (
            <div className="space-y-3">
              {analysis.monthlyGrowth
                .slice(1)
                .slice(-7)
                .reverse()
                .map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {item.month}
                      </p>

                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                        Sales: {compactMoney(item.sales)}
                      </p>
                    </div>

                    <span
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        item.growth >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {item.growth >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingUp
                          className="rotate-180"
                          size={14}
                        />
                      )}

                      {item.growth === null
                        ? "—"
                        : `${item.growth > 0 ? "+" : ""}${item.growth.toFixed(1)}%`}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState>
              At least two months of valid sales data are needed to calculate growth.
            </EmptyState>
          )}
        </div>
      </div>

      {/* DISCOUNT AND SHIPPING ANALYSIS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* DISCOUNT ANALYSIS */}

        <div className={panel}>
          <PanelTitle
            title="Discount versus profit"
            subtitle="Understand how discount levels relate to total profit"
          />

          {analysis.discountRows.length ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.discountRows}>
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="discount"
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    tickFormatter={compactMoney}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => money(value)}
                  />

                  <Bar
                    dataKey="profit"
                    name="Profit"
                    fill="#22D3EE"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              Discount and profit columns are required for this analysis.
            </EmptyState>
          )}
        </div>

        {/* SHIPPING MODE ANALYSIS */}

        <div className={panel}>
          <PanelTitle
            title="Shipping mode mix"
            subtitle="Record count by shipping method"
          />

          {analysis.shippingRows.length ? (
            <div className="space-y-4 pt-2">
              {analysis.shippingRows.map((item, index) => {
                const total = analysis.shippingRows.reduce(
                  (sum, row) => sum + row.value,
                  0
                );

                const share = total
                  ? (item.value / total) * 100
                  : 0;

                return (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <Truck
                          size={14}
                          className="text-cyan-500"
                        />

                        {item.name}
                      </div>

                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {item.value.toLocaleString("en-IN")}{" "}
                        <span className="font-normal text-[var(--text-muted)]">
                          ({share.toFixed(1)}%)
                        </span>
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${share}%`,
                          background: PALETTE[index % PALETTE.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>
              Shipping mode field not available.
            </EmptyState>
          )}
        </div>
      </div>

      {/* SALES SUMMARY */}

      <div
        className={`${panel} flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
            <Sparkles size={18} />
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Sales intelligence summary
            </p>

            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {analysis.bestMonth
                ? `Best month: ${analysis.bestMonth.month} (${compactMoney(
                    analysis.bestMonth.sales
                  )})`
                : "Monthly trend unavailable"}

              {analysis.worstMonth
                ? ` · Lowest month: ${analysis.worstMonth.month}`
                : ""}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-[var(--text-muted)]">
            Average profit margin
          </p>

          <p
            className={`text-sm font-bold ${
              analysis.margin >= 0
                ? "text-emerald-500"
                : "text-rose-500"
            }`}
          >
            {analysis.margin.toFixed(2)}%
          </p>
        </div>
      </div>

    </div>
  );
}

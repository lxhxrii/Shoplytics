
import React, { useMemo } from "react";
import { useDataset } from "../context/DatasetContext";
import { calculateAnalytics } from "../analytics/analyticsEngine";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  IndianRupee,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Activity,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Percent,
} from "lucide-react";

const COLORS = [
  "#8B5CF6",
  "#22D3EE",
  "#6366F1",
  "#F59E0B",
  "#10B981",
  "#EC4899",
];

const tooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "12px",
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 10000000)
    return `₹${(amount / 10000000).toFixed(2)}Cr`;

  if (Math.abs(amount) >= 100000)
    return `₹${(amount / 100000).toFixed(2)}L`;

  if (Math.abs(amount) >= 1000)
    return `₹${(amount / 1000).toFixed(1)}K`;

  return formatCurrency(amount);
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const readValue = (object, keys, fallback = 0) => {
  if (!object) return fallback;

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {
      const parsed = Number(object[key]);
      return Number.isFinite(parsed) ? parsed : object[key];
    }
  }

  return fallback;
};

const readLabel = (object, keys, fallback = "Unknown") => {
  if (!object) return fallback;

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      String(object[key]).trim()
    ) {
      return String(object[key]);
    }
  }

  return fallback;
};

/* =========================================
   REUSABLE THEME-AWARE COMPONENTS
========================================= */

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>

        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {subtitle}
        </p>
      </div>

      {action && (
        <span className="text-[10px] font-medium text-violet-500">
          {action}
        </span>
      )}
    </div>
  );
}

function KpiCard({ item }) {
  const Icon = item.icon;

  const colors = {
    violet: "bg-violet-500/10 text-violet-500",
    blue: "bg-blue-500/10 text-blue-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
    orange: "bg-orange-500/10 text-orange-500",
  };

  return (
    <div className="group rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">
          {item.title}
        </p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[item.color]}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {item.value}
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-[var(--text-muted)]">
          {item.description}
        </span>
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-3 shadow-xl">
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        {label}
      </p>

      {payload.map((entry, index) => (
        <p
          key={`${entry.name}-${index}`}
          className="mb-1 text-xs font-semibold"
          style={{ color: entry.color }}
        >
          {entry.name}:{" "}
          {entry.name?.toLowerCase().includes("sales") ||
          entry.name?.toLowerCase().includes("revenue")
            ? formatCurrency(entry.value)
            : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

function EmptyPanel({ message }) {
  return (
    <div className="flex h-full min-h-[170px] items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] px-5 text-center text-xs text-[var(--text-muted)]">
      {message}
    </div>
  );
}

/* =========================================
   OVERVIEW PAGE
========================================= */

function Overview() {
  const {
    data = [],
    columns = [],
    loading,
    error,
    fileName,
    datasetSource,
  } = useDataset();

  const analytics = useMemo(
    () => calculateAnalytics(data, columns),
    [data, columns]
  );

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
        <RefreshCw
          className="animate-spin text-violet-500"
          size={25}
        />

        <p className="text-sm">
          Loading your business dataset...
        </p>
      </div>
    );
  }

  if (!analytics?.available) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-[var(--surface)] p-8 text-center">
        <AlertTriangle
          className="mx-auto mb-3 text-amber-400"
          size={28}
        />

        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Analytics are not available yet
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          {error ||
            analytics?.message ||
            "Load a valid CSV dataset with sales or order information to generate the dashboard."}
        </p>
      </div>
    );
  }

  const k = analytics.kpis || {};

  const monthlyData = (analytics.monthlySales || []).map((item) => ({
    month: readLabel(item, [
      "month",
      "label",
      "period",
      "date",
      "name",
    ]),
    sales: readValue(item, [
      "sales",
      "revenue",
      "totalSales",
      "value",
    ]),
    orders: readValue(item, [
      "orders",
      "orderCount",
      "count",
      "totalOrders",
    ]),
  }));

  const categoryData = (
    analytics.categoryPerformance || []
  ).map((item, index) => ({
    name: readLabel(item, [
      "category",
      "name",
      "label",
      "key",
    ]),
    sales: readValue(item, [
      "sales",
      "revenue",
      "totalSales",
      "value",
    ]),
    fill: COLORS[index % COLORS.length],
  }));

  const productData = (analytics.topProducts || [])
    .slice(0, 5)
    .map((item) => ({
      name: readLabel(item, [
        "product",
        "productName",
        "name",
        "label",
      ]),
      category: readLabel(
        item,
        ["category", "subCategory", "subcategory"],
        "Product"
      ),
      sales: readValue(item, [
        "sales",
        "quantity",
        "units",
        "totalQuantity",
      ]),
      revenue: readValue(item, [
        "revenue",
        "totalSales",
        "salesAmount",
        "amount",
      ]),
    }));

  const regionData = (analytics.topRegions || [])
    .slice(0, 4)
    .map((item) => ({
      name: readLabel(item, [
        "region",
        "state",
        "city",
        "name",
        "label",
      ]),
      sales: readValue(item, [
        "sales",
        "revenue",
        "totalSales",
        "value",
      ]),
      profit: readValue(item, [
        "profit",
        "totalProfit",
      ]),
    }));

  const lossCategories = analytics.lossMakingCategories || [];
  const quality = analytics.quality || {};

  const totalSales = readValue(k, ["totalSales", "revenue"]);
  const totalOrders = readValue(k, ["totalOrders", "orders"]);
  const totalCustomers = readValue(k, ["totalCustomers", "customers"]);
  const totalProfit = readValue(k, ["totalProfit", "profit"]);
  const totalQuantity = readValue(k, ["totalQuantity", "quantity"]);

  const averageOrderValue = readValue(
    k,
    ["averageOrderValue", "avgOrderValue"],
    totalOrders ? totalSales / totalOrders : 0
  );

  const profitMargin = readValue(k, ["profitMargin", "margin"]);
  const orderCount = totalOrders || data.length;

  /* KPI DATA */

  const kpis = [
    {
      title: "Total Sales",
      value: formatCompactCurrency(totalSales),
      description: `${formatNumber(data.length)} dataset records analysed`,
      icon: IndianRupee,
      color: "violet",
    },
    {
      title: "Total Orders",
      value: formatNumber(orderCount),
      description: "Distinct orders in the dataset",
      icon: ShoppingCart,
      color: "blue",
    },
    {
      title: "Total Customers",
      value: formatNumber(totalCustomers),
      description: "Unique customers identified",
      icon: Users,
      color: "cyan",
    },
    {
      title: "Total Profit",
      value: formatCompactCurrency(totalProfit),
      description: `${Number(profitMargin).toFixed(1)}% profit margin`,
      icon: TrendingUp,
      color: "orange",
    },
  ];

  /* BUSINESS HIGHLIGHTS */

  const highlights = [
    {
      title: "Average order value",
      value: formatCurrency(averageOrderValue),
      detail: "Average sales value per order",
      icon: IndianRupee,
    },
    {
      title: "Units sold",
      value: formatNumber(totalQuantity),
      detail: "Total quantity across records",
      icon: Package,
    },
    {
      title: "Profit margin",
      value: `${Number(profitMargin).toFixed(2)}%`,
      detail: "Profit as a share of sales",
      icon: Percent,
    },
    {
      title: "Data quality",
      value: `${formatNumber(
        readValue(quality, ["missingValues", "missingCount"])
      )} missing`,
      detail: `${formatNumber(
        readValue(quality, ["duplicateRows", "duplicates"])
      )} duplicate rows detected`,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34D399]" />

            <span className="text-[10px] font-semibold tracking-[0.2em] text-violet-500">
              LIVE DATA OVERVIEW
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Business performance calculated directly from your uploaded dataset.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
            Active dataset
          </p>

          <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-[var(--text-primary)]">
            {fileName || "Loaded CSV dataset"}
          </p>

          <p className="mt-1 text-[10px] text-emerald-500">
            {datasetSource || "Dataset connected"}
          </p>
        </div>
      </div>

      {/* DATASET STATUS */}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <Sparkles
          size={17}
          className="shrink-0 text-emerald-500"
        />

        <p className="text-[11px] text-[var(--text-secondary)]">
          <span className="font-semibold text-emerald-500">
            Real dataset connected.
          </span>{" "}
          All metrics and charts below are generated from{" "}
          {fileName || "your current CSV"} — no illustrative demo figures.
        </p>
      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.title} item={item} />
        ))}
      </div>

      {/* SALES TREND AND CATEGORY */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* SALES & ORDERS TREND */}

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 xl:col-span-2">
          <SectionHeader
            title="Sales & Orders Trend"
            subtitle="Monthly sales and order activity from your dataset"
            action={`${monthlyData.length} periods`}
          />

          {monthlyData.length ? (
            <>
              <div className="mb-5 flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Sales
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Orders
                  </span>
                </div>
              </div>

              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient
                        id="salesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.35}
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
                      tick={{
                        fill: "var(--chart-text)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      yAxisId="sales"
                      tick={{
                        fill: "var(--chart-text)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCompactCurrency}
                    />

                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      hide
                    />

                    <Tooltip content={<RevenueTooltip />} />

                    <Area
                      yAxisId="sales"
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#A78BFA"
                      strokeWidth={3}
                      fill="url(#salesGradient)"
                      activeDot={{ r: 5 }}
                    />

                    <Area
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#22D3EE"
                      strokeWidth={2}
                      fill="none"
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EmptyPanel message="Monthly sales could not be grouped. Check that your dataset contains a valid order date and sales column." />
          )}
        </div>

        {/* CATEGORY PERFORMANCE */}

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
          <SectionHeader
            title="Sales by Category"
            subtitle="Revenue contribution by product category"
          />

          {categoryData.length ? (
            <>
              <div className="relative h-[215px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="sales"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={86}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {categoryData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    {categoryData.length}
                  </p>

                  <p className="text-[10px] text-[var(--text-muted)]">
                    Categories
                  </p>
                </div>
              </div>

              <div className="mt-2 space-y-3">
                {categoryData.map((category) => {
                  const share = totalSales
                    ? (category.sales / totalSales) * 100
                    : 0;

                  return (
                    <div
                      key={category.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: category.fill,
                          }}
                        />

                        <span className="truncate text-[11px] text-[var(--text-secondary)]">
                          {category.name}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyPanel message="No category field was found in this dataset." />
          )}
        </div>
      </div>

      {/* PRODUCTS AND BUSINESS HIGHLIGHTS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* TOP PRODUCTS */}

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
          <SectionHeader
            title="Top Products"
            subtitle="Products ranked using dataset sales or quantity"
          />

          {productData.length ? (
            <div className="space-y-5">
              {productData.map((product, index) => {
                const maxSales = Math.max(
                  ...productData.map((item) => item.sales),
                  1
                );

                return (
                  <div key={`${product.name}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-violet-500">
                          <Package size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                            {product.name}
                          </p>

                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {product.category}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {formatCompactCurrency(product.revenue)}
                        </p>

                        <p className="text-[10px] text-[var(--text-muted)]">
                          {formatNumber(product.sales)} units / records
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400"
                        style={{
                          width: `${(product.sales / maxSales) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPanel message="No product-level data was identified." />
          )}
        </div>

        {/* BUSINESS HIGHLIGHTS */}

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
          <SectionHeader
            title="Business Highlights"
            subtitle="Additional metrics and quality indicators"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {item.title}
                    </span>

                    <Icon
                      size={16}
                      className="text-violet-500"
                    />
                  </div>

                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {item.value}
                  </p>

                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>

          {lossCategories.length > 0 && (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="mb-2 text-xs font-semibold text-rose-500">
                Categories requiring attention
              </p>

              <div className="flex flex-wrap gap-2">
                {lossCategories.slice(0, 5).map((item, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] text-rose-500"
                  >
                    {typeof item === "string"
                      ? item
                      : readLabel(item, [
                          "category",
                          "name",
                          "label",
                        ])}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REGIONAL PERFORMANCE */}

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5">
        <SectionHeader
          title="Regional Performance"
          subtitle="Sales and profit contribution across regions or locations"
        />

        {regionData.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {regionData.map((region) => (
              <div
                key={region.name}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <MapPin
                    size={15}
                    className="text-violet-500"
                  />

                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {region.name}
                  </span>
                </div>

                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {formatCompactCurrency(region.sales)}
                </p>

                <p
                  className={`mt-1 text-[10px] ${
                    region.profit >= 0
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }`}
                >
                  {region.profit < 0 ? "Loss" : "Profit"}:{" "}
                  {formatCurrency(region.profit)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel message="No region, state, or location field was identified." />
        )}
      </div>

      {/* FOOTNOTE */}

      <div className="flex items-center justify-center gap-2 pb-2">
        <Sparkles
          size={13}
          className="text-violet-500"
        />

        <p className="text-[10px] text-[var(--text-muted)]">
          Shoplytics · {formatNumber(data.length)} records analysed ·
          Metrics refresh when the dataset changes.
        </p>
      </div>
    </div>
  );
}

export default Overview;


import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
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
  Package,
  TrendingUp,
  IndianRupee,
  Search,
  Filter,
  Award,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Boxes,
  RotateCcw,
  Target,
  Percent,
  ShoppingBag,
} from "lucide-react";

import { useDataset } from "../context/DatasetContext";

// --------------------------------------------------
// COLORS AND THEME
// --------------------------------------------------

const COLORS = [
  "#8b5cf6",
  "#6366f1",
  "#06b6d4",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
];

const panelClass =
  "rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5";

const tooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: 12,
  color: "var(--text-primary)",
  fontSize: 12,
};

// --------------------------------------------------
// FORMATTERS
// --------------------------------------------------

const currency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactCurrency = (value) => {
  const amount = Number(value) || 0;

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }

  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }

  return currency(amount);
};

const number = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const numericValue = (value) => {
  const result = Number(
    String(value ?? "").replace(/[$,%\s,]/g, "")
  );

  return Number.isFinite(result) ? result : 0;
};

// --------------------------------------------------
// FIELD DETECTION
// --------------------------------------------------

const findField = (columns, names) => {
  const normalized = columns.map((column) => ({
    original: column,
    value: String(column)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""),
  }));

  return normalized.find((column) =>
    names.some(
      (name) =>
        column.value ===
        name.toLowerCase().replace(/[^a-z0-9]/g, "")
    )
  )?.original;
};

// --------------------------------------------------
// REUSABLE COMPONENTS
// --------------------------------------------------

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">
          {title}
        </p>

        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={18} />
        </div>
      </div>

      <h2 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {value}
      </h2>

      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {subtitle}
      </p>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`${panelClass} ${className}`}>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>

        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {subtitle}
        </p>
      </div>

      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] px-5 text-center text-xs text-[var(--text-muted)]">
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border p-3 shadow-xl"
      style={tooltipStyle}
    >
      {label && (
        <p className="mb-2 text-xs font-semibold">
          {label}
        </p>
      )}

      {payload.map((item, index) => (
        <div
          key={`${item.dataKey}-${index}`}
          className="flex items-center justify-between gap-5 py-1 text-xs"
        >
          <span style={{ color: item.color }}>
            {item.name || item.dataKey}
          </span>

          <span className="font-semibold">
            {currency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartAxes() {
  return (
    <CartesianGrid
      stroke="var(--chart-grid)"
      strokeDasharray="3 3"
      vertical={false}
    />
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

function Products() {
  const {
    data = [],
    columns = [],
    loading,
    error,
    hasData,
    fileName,
  } = useDataset();

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sales");
  const [sortDirection, setSortDirection] = useState("desc");

  // ------------------------------------------------
  // DETECT DATASET COLUMNS
  // ------------------------------------------------

  const fields = useMemo(
    () => ({
      product: findField(columns, [
        "product name",
        "product",
        "item name",
      ]),

      category: findField(columns, [
        "category",
        "product category",
      ]),

      subCategory: findField(columns, [
        "sub-category",
        "subcategory",
        "sub category",
      ]),

      sales: findField(columns, [
        "sales",
        "revenue",
        "total sales",
      ]),

      profit: findField(columns, [
        "profit",
        "net profit",
      ]),

      quantity: findField(columns, [
        "quantity",
        "units sold",
      ]),

      discount: findField(columns, [
        "discount",
        "discount rate",
      ]),

      order: findField(columns, [
        "order id",
        "order number",
      ]),
    }),
    [columns]
  );

  // ------------------------------------------------
  // PRODUCT ANALYTICS
  // ------------------------------------------------

  const result = useMemo(() => {
    if (!data.length || !fields.sales) {
      return {
        products: [],
        categories: [],
        categoryData: [],
        subCategoryData: [],
        discountData: [],
        totalSales: 0,
        totalProfit: 0,
        totalQuantity: 0,
        productCount: 0,
        lossProducts: 0,
        averageDiscount: 0,
      };
    }

    const grouped = new Map();
    const categoryGroups = new Map();
    const subCategoryGroups = new Map();
    const discountGroups = new Map();

    let totalSales = 0;
    let totalProfit = 0;
    let totalQuantity = 0;
    let discountTotal = 0;
    let discountCount = 0;

    data.forEach((row) => {
      const productName = String(
        row[fields.product] || "Unknown Product"
      ).trim();

      const categoryName = String(
        row[fields.category] || "Uncategorized"
      ).trim();

      const subCategoryName = String(
        row[fields.subCategory] || "Other"
      ).trim();

      const sales = numericValue(row[fields.sales]);

      const profit = fields.profit
        ? numericValue(row[fields.profit])
        : 0;

      const quantity = fields.quantity
        ? numericValue(row[fields.quantity])
        : 0;

      const discount = fields.discount
        ? numericValue(row[fields.discount])
        : 0;

      totalSales += sales;
      totalProfit += profit;
      totalQuantity += quantity;

      if (fields.discount) {
        discountTotal += discount;
        discountCount += 1;
      }

      // Product grouping

      if (!grouped.has(productName)) {
        grouped.set(productName, {
          name: productName,
          category: categoryName,
          subCategory: subCategoryName,
          sales: 0,
          profit: 0,
          quantity: 0,
          orders: new Set(),
          discountTotal: 0,
          records: 0,
        });
      }

      const product = grouped.get(productName);

      product.sales += sales;
      product.profit += profit;
      product.quantity += quantity;
      product.discountTotal += discount;
      product.records += 1;

      if (fields.order && row[fields.order]) {
        product.orders.add(row[fields.order]);
      }

      // Category grouping

      if (!categoryGroups.has(categoryName)) {
        categoryGroups.set(categoryName, {
          name: categoryName,
          sales: 0,
          profit: 0,
          quantity: 0,
        });
      }

      const categoryGroup = categoryGroups.get(categoryName);

      categoryGroup.sales += sales;
      categoryGroup.profit += profit;
      categoryGroup.quantity += quantity;

      // Subcategory grouping

      if (!subCategoryGroups.has(subCategoryName)) {
        subCategoryGroups.set(subCategoryName, {
          name: subCategoryName,
          sales: 0,
          profit: 0,
        });
      }

      const subGroup = subCategoryGroups.get(subCategoryName);

      subGroup.sales += sales;
      subGroup.profit += profit;

      // Discount grouping

      const discountBand =
        discount < 0.1
          ? "0–9%"
          : discount < 0.2
            ? "10–19%"
            : discount < 0.3
              ? "20–29%"
              : "30%+";

      if (!discountGroups.has(discountBand)) {
        discountGroups.set(discountBand, {
          name: discountBand,
          sales: 0,
          profit: 0,
          records: 0,
        });
      }

      const discountGroup = discountGroups.get(discountBand);

      discountGroup.sales += sales;
      discountGroup.profit += profit;
      discountGroup.records += 1;
    });

    const products = Array.from(grouped.values()).map(
      (product) => ({
        ...product,
        orders: product.orders.size,

        margin: product.sales
          ? (product.profit / product.sales) * 100
          : 0,

        averageDiscount: product.records
          ? product.discountTotal / product.records
          : 0,
      })
    );

    const categoryData = Array.from(
      categoryGroups.values()
    );

    const subCategoryData = Array.from(
      subCategoryGroups.values()
    )
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);

    return {
      products,

      categories: categoryData.map((item) => item.name),

      categoryData,
      subCategoryData,

      discountData: Array.from(discountGroups.values()),

      totalSales,
      totalProfit,
      totalQuantity,

      productCount: products.length,

      lossProducts: products.filter(
        (product) => product.profit < 0
      ).length,

      averageDiscount: discountCount
        ? discountTotal / discountCount
        : 0,
    };
  }, [data, fields]);

  // ------------------------------------------------
  // FILTER AND SORT PRODUCTS
  // ------------------------------------------------

  const filteredProducts = useMemo(() => {
    return result.products
      .filter(
        (product) =>
          category === "All" ||
          product.category === category
      )
      .filter((product) =>
        product.name
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const comparison = b[sortBy] - a[sortBy];

        return sortDirection === "desc"
          ? comparison
          : -comparison;
      });
  }, [
    result.products,
    category,
    search,
    sortBy,
    sortDirection,
  ]);

  // ------------------------------------------------
  // FILTERED SUMMARY
  // ------------------------------------------------

  const filteredSummary = useMemo(() => {
    const selected = result.products.filter(
      (product) =>
        category === "All" ||
        product.category === category
    );

    return {
      sales: selected.reduce(
        (sum, product) => sum + product.sales,
        0
      ),

      profit: selected.reduce(
        (sum, product) => sum + product.profit,
        0
      ),

      quantity: selected.reduce(
        (sum, product) => sum + product.quantity,
        0
      ),

      products: selected.length,

      losses: selected.filter(
        (product) => product.profit < 0
      ).length,
    };
  }, [result.products, category]);

  // ------------------------------------------------
  // TOP AND BOTTOM PRODUCTS
  // ------------------------------------------------

  const topProducts = useMemo(
    () =>
      [...result.products]
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 7),
    [result.products]
  );

  const topProfitProducts = useMemo(
    () =>
      [...result.products]
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 7),
    [result.products]
  );

  const categoryChart = result.categoryData.map(
    (item) => ({
      ...item,
      value: item.sales,
    })
  );

  const categoryFiltered =
    category === "All"
      ? categoryChart
      : categoryChart.filter(
          (item) => item.name === category
        );

  const bestProduct = topProducts[0];

  const worstProduct = [...result.products].sort(
    (a, b) => a.profit - b.profit
  )[0];

  // ------------------------------------------------
  // RESET AND SORT ACTIONS
  // ------------------------------------------------

  const resetFilters = () => {
    setCategory("All");
    setSearch("");
    setSortBy("sales");
    setSortDirection("desc");
  };

  const changeSort = (field) => {
    if (sortBy === field) {
      setSortDirection((previous) =>
        previous === "desc" ? "asc" : "desc"
      );
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  // ------------------------------------------------
  // LOADING STATE
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading product analytics...
      </div>
    );
  }

  // ------------------------------------------------
  // EMPTY DATASET STATE
  // ------------------------------------------------

  if (!hasData || !data.length || !fields.sales) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] px-6 text-center">
        <div className="mb-4 rounded-2xl bg-violet-500/10 p-4 text-violet-500">
          <Package size={34} />
        </div>

        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Product analytics unavailable
        </h2>

        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          Upload a dataset containing a Sales or Revenue
          column to explore product performance.
        </p>

        {error && (
          <p className="mt-3 text-xs text-amber-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  // ------------------------------------------------
  // MAIN PAGE
  // ------------------------------------------------

  return (
    <div className="space-y-7">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-500">
            <Package size={15} />
            PRODUCT ANALYTICS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
            Product Performance
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Discover your best-selling products, profit
            drivers and product-level opportunities.
          </p>

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Dataset: {fileName || "Current dataset"}
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-violet-500 hover:text-violet-500"
        >
          <RotateCcw size={14} />
          Reset filters
        </button>
      </div>

      {/* FILTERS */}

      <section className={`${panelClass} space-y-4`}>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-violet-500" />

          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            Product filters
          </h3>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products..."
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-3 sm:min-w-[210px]">
            <Filter
              size={15}
              className="text-violet-500"
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="w-full bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="All">All Categories</option>

              {result.categories.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-[var(--surface)]"
                >
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-[10px] text-[var(--text-muted)]">
          Showing {number(filteredProducts.length)} products
          matching your selected filters.
        </p>
      </section>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Product Revenue"
          value={compactCurrency(filteredSummary.sales)}
          subtitle="Sales generated by selected products"
          icon={IndianRupee}
          color="bg-violet-500/10 text-violet-500"
        />

        <MetricCard
          title="Product Profit"
          value={compactCurrency(filteredSummary.profit)}
          subtitle="Combined product profitability"
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-500"
        />

        <MetricCard
          title="Units Sold"
          value={number(filteredSummary.quantity)}
          subtitle="Total quantity sold"
          icon={Boxes}
          color="bg-cyan-500/10 text-cyan-500"
        />

        <MetricCard
          title="Products Analyzed"
          value={number(filteredSummary.products)}
          subtitle={`${number(filteredSummary.losses)} loss-making products`}
          icon={Layers}
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* TOP PRODUCTS AND CATEGORY MIX */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <Panel
          title="Top Products by Revenue"
          subtitle="Highest revenue-generating products in the dataset"
          className="xl:col-span-2"
        >
          {topProducts.length ? (
            <div className="h-[330px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{
                    left: 12,
                    right: 20,
                    top: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    tickFormatter={compactCurrency}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 9,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      value.length > 23
                        ? `${value.slice(0, 23)}...`
                        : value
                    }
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{
                      fill: "var(--surface-hover)",
                    }}
                  />

                  <Bar
                    dataKey="sales"
                    name="Revenue"
                    fill="#8b5cf6"
                    radius={[0, 6, 6, 0]}
                    barSize={23}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              No product revenue data available.
            </EmptyState>
          )}
        </Panel>

        <Panel
          title="Category Revenue Mix"
          subtitle="How revenue is distributed across categories"
        >
          {categoryFiltered.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryFiltered}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {categoryFiltered.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => currency(value)}
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 10,
                      color: "var(--text-secondary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              No category data available.
            </EmptyState>
          )}
        </Panel>
      </div>

      {/* CATEGORY AND PROFIT CHARTS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <Panel
          title="Category Profitability"
          subtitle="Revenue versus profit by product category"
        >
          {categoryFiltered.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={categoryFiltered}>
                  <ChartAxes />

                  <XAxis
                    dataKey="name"
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--text-secondary)",
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
                    tickFormatter={compactCurrency}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                    }}
                  />

                  <Bar
                    dataKey="sales"
                    name="Revenue"
                    fill="#8b5cf6"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="profit"
                    name="Profit"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              No category profitability data available.
            </EmptyState>
          )}
        </Panel>

        <Panel
          title="Top Subcategories"
          subtitle="Subcategories ranked by generated revenue"
        >
          {result.subCategoryData.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={result.subCategoryData}
                  layout="vertical"
                  margin={{
                    left: 12,
                    right: 15,
                  }}
                >
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--chart-text)",
                      fontSize: 10,
                    }}
                    tickFormatter={compactCurrency}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={95}
                    stroke="var(--chart-text)"
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Bar
                    dataKey="sales"
                    name="Revenue"
                    fill="#06b6d4"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>
              Subcategory data is not available.
            </EmptyState>
          )}
        </Panel>
      </div>

      {/* TOP PROFIT PRODUCTS */}

      <Panel
        title="Top Products by Profit"
        subtitle="Products contributing the highest total profit"
      >
        {topProfitProducts.length ? (
          <div className="space-y-4">
            {topProfitProducts.map((product, index) => {
              const maxProfit = Math.max(
                ...topProfitProducts.map((item) =>
                  Math.max(item.profit, 0)
                ),
                1
              );

              const width = Math.max(
                0,
                (product.profit / maxProfit) * 100
              );

              return (
                <div key={product.name}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-[10px] font-bold text-violet-500">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                          {product.name}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          {product.category}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-emerald-500">
                      {currency(product.profit)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState>
            No profit information available.
          </EmptyState>
        )}
      </Panel>

      {/* DISCOUNT ANALYSIS */}

      <Panel
        title="Discount Impact Analysis"
        subtitle="Compare revenue and profit across discount ranges"
      >
        {fields.discount ? (
          <div className="h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={result.discountData}>
                <ChartAxes />

                <XAxis
                  dataKey="name"
                  stroke="var(--chart-text)"
                  tick={{
                    fill: "var(--text-secondary)",
                    fontSize: 11,
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
                  tickFormatter={compactCurrency}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<ChartTooltip />} />

                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                  }}
                />

                <Bar
                  dataKey="sales"
                  name="Revenue"
                  fill="#6366f1"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState>
            Your dataset does not contain a Discount column.
          </EmptyState>
        )}
      </Panel>

      {/* PRODUCT INSIGHTS */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
            <Award size={18} />
            Top Revenue Product
          </div>

          {bestProduct ? (
            <>
              <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
                {bestProduct.name}
              </h3>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Revenue: {currency(bestProduct.sales)}
              </p>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Profit: {currency(bestProduct.profit)}
              </p>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Units sold: {number(bestProduct.quantity)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No product data available.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-500">
            <AlertTriangle size={18} />
            Lowest Profit Product
          </div>

          {worstProduct ? (
            <>
              <h3 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
                {worstProduct.name}
              </h3>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Profit: {currency(worstProduct.profit)}
              </p>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Revenue: {currency(worstProduct.sales)}
              </p>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Profit margin: {worstProduct.margin.toFixed(1)}%
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No product data available.
            </p>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${panelClass} flex items-center gap-3`}>
          <div className="rounded-xl bg-violet-500/10 p-3 text-violet-500">
            <ShoppingBag size={19} />
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Total products
            </p>

            <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
              {number(result.productCount)}
            </p>
          </div>
        </div>

        <div className={`${panelClass} flex items-center gap-3`}>
          <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500">
            <Percent size={19} />
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Average discount
            </p>

            <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
              {(result.averageDiscount * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className={`${panelClass} flex items-center gap-3`}>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
            <Target size={19} />
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Overall profit margin
            </p>

            <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
              {result.totalSales
                ? (
                    (result.totalProfit / result.totalSales) *
                    100
                  ).toFixed(2)
                : "0.00"}
              %
            </p>
          </div>
        </div>
      </div>

      {/* PRODUCT EXPLORER */}

      <Panel
        title="Product Explorer"
        subtitle="Search, compare and sort individual product performance"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-3 py-3">Product</th>

                <th className="px-3 py-3">Category</th>

                <th className="px-3 py-3">
                  <button
                    onClick={() => changeSort("sales")}
                    className="flex items-center gap-1 transition hover:text-violet-500"
                  >
                    Revenue
                    <ArrowUpDown size={12} />
                  </button>
                </th>

                <th className="px-3 py-3">
                  <button
                    onClick={() => changeSort("profit")}
                    className="flex items-center gap-1 transition hover:text-violet-500"
                  >
                    Profit
                    <ArrowUpDown size={12} />
                  </button>
                </th>

                <th className="px-3 py-3">
                  <button
                    onClick={() => changeSort("quantity")}
                    className="flex items-center gap-1 transition hover:text-violet-500"
                  >
                    Units
                    <ArrowUpDown size={12} />
                  </button>
                </th>

                <th className="px-3 py-3">Margin</th>

                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.slice(0, 50).map(
                (product, index) => (
                  <tr
                    key={product.name}
                    className="border-b border-[var(--border-color)] transition hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-semibold text-violet-500">
                          {index + 1}
                        </div>

                        <div>
                          <p className="max-w-[240px] truncate text-xs font-medium text-[var(--text-primary)]">
                            {product.name}
                          </p>

                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {product.subCategory}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-xs text-[var(--text-secondary)]">
                      {product.category}
                    </td>

                    <td className="px-3 py-4 text-xs font-semibold text-[var(--text-primary)]">
                      {currency(product.sales)}
                    </td>

                    <td
                      className={`px-3 py-4 text-xs font-semibold ${
                        product.profit >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {currency(product.profit)}
                    </td>

                    <td className="px-3 py-4 text-xs text-[var(--text-secondary)]">
                      {number(product.quantity)}
                    </td>

                    <td className="px-3 py-4 text-xs text-[var(--text-secondary)]">
                      {product.margin.toFixed(1)}%
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          product.profit < 0
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {product.profit < 0
                          ? "Loss"
                          : "Profitable"}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <p className="py-10 text-center text-sm text-[var(--text-muted)]">
              No products match your search.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Showing {Math.min(filteredProducts.length, 50)} of{" "}
          {filteredProducts.length} matching products.
        </p>
      </Panel>

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)] pt-4 text-[10px] text-[var(--text-muted)]">
        <span>SHOPLYTICS · PRODUCT INTELLIGENCE</span>

        <span>Based on current dataset records</span>
      </div>
    </div>
  );
}

export default Products;

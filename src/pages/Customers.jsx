
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import {
  Users,
  Repeat2,
  Crown,
  Search,
  Filter,
  ShoppingBag,
  ArrowUpDown,
  RotateCcw,
  Award,
  TrendingUp,
  MapPin,
  UserRound,
} from "lucide-react";

import { useDataset } from "../context/DatasetContext";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

const currency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

const number = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value || 0);

const findField = (columns, names) =>
  columns.find((column) =>
    names.includes(column.toLowerCase().trim())
  );

const numericValue = (value) => {
  const result = Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(result) ? result : 0;
};

const panelStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border-color)",
};

const chartText = "var(--chart-text)";
const chartGrid = "var(--chart-grid)";

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={panelStyle}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </p>

        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <h2
        className="mt-4 text-2xl font-bold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </h2>

      <p
        className="mt-2 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section
      className="rounded-2xl p-5 transition-all duration-300"
      style={panelStyle}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>

          <p
            className="mt-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {subtitle}
          </p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border p-3 shadow-xl"
      style={{
        background: "var(--chart-tooltip-bg)",
        borderColor: "var(--border-color)",
        color: "var(--text-primary)",
      }}
    >
      {label && (
        <p className="mb-2 text-xs font-semibold">{label}</p>
      )}

      {payload.map((item, index) => (
        <p
          key={`${item.name}-${index}`}
          className="text-xs"
          style={{ color: item.color || "var(--text-secondary)" }}
        >
          {item.name}:{" "}
          {formatter ? formatter(item.value, item.name) : number(item.value)}
        </p>
      ))}
    </div>
  );
}

function Customers() {
  const { data, columns, loading, error, hasData, fileName } = useDataset();

  const [segment, setSegment] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("sales");
  const [sortDirection, setSortDirection] = useState("desc");

  const fields = useMemo(
    () => ({
      customerId: findField(columns, [
        "customer id",
        "customer_id",
        "customerid",
      ]),
      customerName: findField(columns, [
        "customer name",
        "customer_name",
        "customer",
      ]),
      segment: findField(columns, ["segment", "customer segment"]),
      sales: findField(columns, ["sales", "revenue", "total sales"]),
      profit: findField(columns, ["profit", "net profit"]),
      order: findField(columns, ["order id", "order number"]),
      date: findField(columns, ["order date", "date"]),
      region: findField(columns, ["region"]),
      state: findField(columns, ["state"]),
      city: findField(columns, ["city"]),
    }),
    [columns]
  );

  const analytics = useMemo(() => {
    const empty = {
      customers: [],
      segments: [],
      segmentData: [],
      regionData: [],
      purchaseFrequency: [],
      totalSales: 0,
      totalProfit: 0,
      totalOrders: 0,
      customerCount: 0,
      repeatCustomers: 0,
      topCustomer: null,
      averageCustomerValue: 0,
      averageOrders: 0,
    };

    if (!data.length || !fields.sales) return empty;

    const customerMap = new Map();
    const segmentMap = new Map();
    const regionMap = new Map();

    let totalSales = 0;
    let totalProfit = 0;
    const allOrders = new Set();

    data.forEach((row) => {
      const id = String(
        (fields.customerId && row[fields.customerId]) ||
          (fields.customerName && row[fields.customerName]) ||
          "Unknown Customer"
      ).trim();

      const name = String(
        (fields.customerName && row[fields.customerName]) || id
      ).trim();

      const segmentName = String(
        (fields.segment && row[fields.segment]) || "Unknown"
      ).trim();

      const regionName = String(
        (fields.region && row[fields.region]) ||
          (fields.state && row[fields.state]) ||
          "Unknown"
      ).trim();

      const sales = numericValue(row[fields.sales]);
      const profit = fields.profit
        ? numericValue(row[fields.profit])
        : 0;

      const orderId = fields.order
        ? String(row[fields.order] || "").trim()
        : "";

      totalSales += sales;
      totalProfit += profit;

      if (orderId) allOrders.add(orderId);

      if (!customerMap.has(id)) {
        customerMap.set(id, {
          id,
          name,
          segment: segmentName,
          sales: 0,
          profit: 0,
          orders: new Set(),
          regions: new Set(),
          cities: new Set(),
          firstOrder: null,
          lastOrder: null,
        });
      }

      const customer = customerMap.get(id);

      customer.sales += sales;
      customer.profit += profit;

      if (orderId) customer.orders.add(orderId);

      if (regionName !== "Unknown") {
        customer.regions.add(regionName);
      }

      if (fields.city && row[fields.city]) {
        customer.cities.add(String(row[fields.city]));
      }

      if (fields.date && row[fields.date]) {
        const date = new Date(row[fields.date]);

        if (!Number.isNaN(date.getTime())) {
          if (!customer.firstOrder || date < customer.firstOrder) {
            customer.firstOrder = date;
          }

          if (!customer.lastOrder || date > customer.lastOrder) {
            customer.lastOrder = date;
          }
        }
      }

      if (!segmentMap.has(segmentName)) {
        segmentMap.set(segmentName, {
          name: segmentName,
          customers: new Set(),
          sales: 0,
          profit: 0,
        });
      }

      const segmentGroup = segmentMap.get(segmentName);
      segmentGroup.customers.add(id);
      segmentGroup.sales += sales;
      segmentGroup.profit += profit;

      if (!regionMap.has(regionName)) {
        regionMap.set(regionName, {
          name: regionName,
          customers: new Set(),
          sales: 0,
        });
      }

      const regionGroup = regionMap.get(regionName);
      regionGroup.customers.add(id);
      regionGroup.sales += sales;
    });

    const customers = Array.from(customerMap.values()).map((customer) => ({
      ...customer,
      orders: customer.orders.size,
      regions: Array.from(customer.regions),
      cities: Array.from(customer.cities),
      averageOrderValue: customer.orders.size
        ? customer.sales / customer.orders.size
        : 0,
      margin: customer.sales
        ? (customer.profit / customer.sales) * 100
        : 0,
    }));

    const segmentData = Array.from(segmentMap.values()).map((item) => ({
      name: item.name,
      customers: item.customers.size,
      sales: item.sales,
      profit: item.profit,
    }));

    const regionData = Array.from(regionMap.values())
      .map((item) => ({
        name: item.name,
        customers: item.customers.size,
        sales: item.sales,
      }))
      .sort((a, b) => b.customers - a.customers)
      .slice(0, 8);

    const repeatCustomers = customers.filter(
      (customer) => customer.orders > 1
    ).length;

    const frequencyMap = new Map();

    [1, 2, 3, 4, 5].forEach((count) => {
      frequencyMap.set(
        count > 4 ? "5+ orders" : `${count} order${count > 1 ? "s" : ""}`,
        customers.filter((customer) =>
          count === 5
            ? customer.orders >= 5
            : customer.orders === count
        ).length
      );
    });

    const purchaseFrequency = Array.from(frequencyMap.entries()).map(
      ([name, customerCount]) => ({
        name,
        customers: customerCount,
      })
    );

    const sortedCustomers = [...customers].sort(
      (a, b) => b.sales - a.sales
    );

    return {
      customers,
      segments: segmentData.map((item) => item.name),
      segmentData,
      regionData,
      purchaseFrequency,
      totalSales,
      totalProfit,
      totalOrders: allOrders.size,
      customerCount: customers.length,
      repeatCustomers,
      topCustomer: sortedCustomers[0] || null,
      averageCustomerValue: customers.length
        ? totalSales / customers.length
        : 0,
      averageOrders: customers.length
        ? customers.reduce((sum, customer) => sum + customer.orders, 0) /
          customers.length
        : 0,
    };
  }, [data, fields]);

  const filteredCustomers = useMemo(() => {
    return analytics.customers
      .filter(
        (customer) =>
          segment === "All" || customer.segment === segment
      )
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.id.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const comparison = b[sortBy] - a[sortBy];
        return sortDirection === "desc" ? comparison : -comparison;
      });
  }, [analytics.customers, segment, search, sortBy, sortDirection]);

  const filteredSummary = useMemo(() => {
    const selected = analytics.customers.filter(
      (customer) =>
        segment === "All" || customer.segment === segment
    );

    return {
      customers: selected.length,
      sales: selected.reduce((sum, item) => sum + item.sales, 0),
      profit: selected.reduce((sum, item) => sum + item.profit, 0),
      repeat: selected.filter((item) => item.orders > 1).length,
      orders: selected.reduce((sum, item) => sum + item.orders, 0),
    };
  }, [analytics.customers, segment]);

  const filteredSegmentData =
    segment === "All"
      ? analytics.segmentData
      : analytics.segmentData.filter((item) => item.name === segment);

  const topCustomers = [...filteredCustomers]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 7);

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

  const resetFilters = () => {
    setSegment("All");
    setSearch("");
    setSortBy("sales");
    setSortDirection("desc");
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Loading customer analytics...
      </div>
    );
  }

  if (
    !hasData ||
    !fields.sales ||
    (!fields.customerId && !fields.customerName)
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Users size={42} className="mb-4 text-violet-400" />

        <h2
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Customer analytics unavailable
        </h2>

        <p
          className="mt-2 max-w-md text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Upload a dataset with Sales and Customer ID or Customer Name columns.
        </p>

        {error && (
          <p className="mt-3 text-xs text-amber-500">{error}</p>
        )}
      </div>
    );
  }

  const repeatRate = filteredSummary.customers
    ? (filteredSummary.repeat / filteredSummary.customers) * 100
    : 0;

  const averageRevenuePerCustomer = filteredSummary.customers
    ? filteredSummary.sales / filteredSummary.customers
    : 0;

  return (
    <div className="space-y-7" style={{ color: "var(--text-primary)" }}>
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-violet-500">
            <Users size={15} />
            CUSTOMER INTELLIGENCE
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Customer Analytics
          </h1>

          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Understand customer value, purchasing behaviour and customer distribution.
          </p>

          <p
            className="mt-2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Dataset: {fileName || "Current dataset"}
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition hover:border-violet-500 hover:text-violet-500"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--surface-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          <RotateCcw size={14} />
          Reset filters
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or ID..."
            className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-500"
            style={{
              background: "var(--input-bg)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div
          className="flex items-center gap-2 rounded-xl border px-3"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <Filter size={15} className="text-violet-500" />

          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="bg-transparent py-3 text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          >
            <option value="All">All Segments</option>

            {analytics.segments.map((item) => (
              <option
                key={item}
                value={item}
                style={{
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                }}
              >
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={number(filteredSummary.customers)}
          subtitle="Unique customers in selected segment"
          icon={Users}
          color="bg-violet-500/10 text-violet-500"
        />

        <MetricCard
          title="Customer Value"
          value={currency(averageRevenuePerCustomer)}
          subtitle="Average revenue per customer"
          icon={Crown}
          color="bg-amber-500/10 text-amber-500"
        />

        <MetricCard
          title="Repeat Customers"
          value={number(filteredSummary.repeat)}
          subtitle={`${repeatRate.toFixed(1)}% of selected customers`}
          icon={Repeat2}
          color="bg-emerald-500/10 text-emerald-500"
        />

        <MetricCard
          title="Customer Orders"
          value={number(filteredSummary.orders)}
          subtitle="Distinct orders across selected customers"
          icon={ShoppingBag}
          color="bg-cyan-500/10 text-cyan-500"
        />
      </div>

      {/* ADDITIONAL CUSTOMER METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-4" style={panelStyle}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Total Customer Revenue
            </span>
          </div>
          <p className="mt-3 text-xl font-bold">
            {currency(filteredSummary.sales)}
          </p>
        </div>

        <div className="rounded-2xl border p-4" style={panelStyle}>
          <div className="flex items-center gap-2">
            <Award size={16} className="text-violet-500" />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Customer Profit
            </span>
          </div>
          <p className="mt-3 text-xl font-bold">
            {currency(filteredSummary.profit)}
          </p>
        </div>

        <div className="rounded-2xl border p-4" style={panelStyle}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-cyan-500" />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Average Orders per Customer
            </span>
          </div>
          <p className="mt-3 text-xl font-bold">
            {filteredSummary.customers
              ? (
                  filteredSummary.orders / filteredSummary.customers
                ).toFixed(2)
              : "0.00"}
          </p>
        </div>
      </div>

      {/* SEGMENTS + TOP CUSTOMERS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <Panel
            title="Customer Segmentation"
            subtitle="Customer distribution by business segment"
          >
            {filteredSegmentData.length ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredSegmentData}
                      dataKey="customers"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {filteredSegmentData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      content={<ChartTooltip />}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: 10,
                        color: chartText,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p
                className="py-16 text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No segment data available.
              </p>
            )}
          </Panel>
        </div>

        <div className="xl:col-span-2">
          <Panel
            title="Top Customers by Revenue"
            subtitle="Customers generating the highest revenue"
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCustomers}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid
                    stroke={chartGrid}
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    stroke={chartText}
                    tickFormatter={(value) => `$${number(value)}`}
                    fontSize={10}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={115}
                    stroke={chartText}
                    fontSize={10}
                    tickFormatter={(value) =>
                      value.length > 17
                        ? `${value.slice(0, 17)}...`
                        : value
                    }
                  />

                  <Tooltip
                    content={
                      <ChartTooltip formatter={(value) => currency(value)} />
                    }
                  />

                  <Bar
                    dataKey="sales"
                    name="Revenue"
                    fill="#8b5cf6"
                    radius={[0, 6, 6, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      {/* CUSTOMER DISTRIBUTION */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="Customer Geographic Distribution"
          subtitle="Unique customers across regions or states"
          action={<MapPin size={17} className="text-cyan-500" />}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.regionData}
                layout="vertical"
                margin={{ left: 12, right: 15 }}
              >
                <CartesianGrid
                  stroke={chartGrid}
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke={chartText}
                  fontSize={10}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={95}
                  stroke={chartText}
                  fontSize={10}
                />

                <Tooltip content={<ChartTooltip />} />

                <Bar
                  dataKey="customers"
                  name="Unique Customers"
                  fill="#06b6d4"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Purchase Frequency"
          subtitle="Customer count grouped by number of distinct orders"
          action={<ActivityIcon />}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.purchaseFrequency}>
                <defs>
                  <linearGradient
                    id="customerFrequency"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="#8b5cf6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke={chartGrid}
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                  stroke={chartText}
                  fontSize={10}
                />

                <YAxis
                  stroke={chartText}
                  fontSize={10}
                />

                <Tooltip content={<ChartTooltip />} />

                <Area
                  type="monotone"
                  dataKey="customers"
                  name="Customers"
                  stroke="#8b5cf6"
                  fill="url(#customerFrequency)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* SEGMENT COMPARISON */}
      <Panel
        title="Segment Performance Comparison"
        subtitle="Compare customer count, revenue and profit by segment"
      >
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
                <th className="px-3 py-3">Segment</th>
                <th className="px-3 py-3">Customers</th>
                <th className="px-3 py-3">Revenue</th>
                <th className="px-3 py-3">Profit</th>
                <th className="px-3 py-3">Revenue / Customer</th>
              </tr>
            </thead>

            <tbody>
              {analytics.segmentData.map((item) => (
                <tr
                  key={item.name}
                  className="border-b transition hover:bg-violet-500/[0.04]"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td
                    className="px-3 py-4 text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.name}
                  </td>

                  <td
                    className="px-3 py-4 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {number(item.customers)}
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold">
                    {currency(item.sales)}
                  </td>

                  <td
                    className={`px-3 py-4 text-xs font-semibold ${
                      item.profit >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {currency(item.profit)}
                  </td>

                  <td
                    className="px-3 py-4 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {currency(
                      item.customers
                        ? item.sales / item.customers
                        : 0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* CUSTOMER SPOTLIGHT */}
      {analytics.topCustomer && (
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: "rgba(139,92,246,0.3)",
            background:
              "linear-gradient(120deg, rgba(139,92,246,0.12), rgba(99,102,241,0.04))",
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-500">
                <Award size={18} />
                Highest Revenue Customer
              </div>

              <h2 className="mt-4 text-xl font-bold">
                {analytics.topCustomer.name}
              </h2>

              <p
                className="mt-2 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Customer ID: {analytics.topCustomer.id}
              </p>

              <p
                className="mt-1 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Segment: {analytics.topCustomer.segment}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total Revenue
                </p>
                <p className="mt-2 text-xl font-bold">
                  {currency(analytics.topCustomer.sales)}
                </p>
              </div>

              <div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Distinct Orders
                </p>
                <p className="mt-2 text-xl font-bold">
                  {number(analytics.topCustomer.orders)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER EXPLORER */}
      <Panel
        title="Customer Explorer"
        subtitle="Search, compare and inspect individual customer performance"
        action={
          <span
            className="rounded-lg px-3 py-1.5 text-[10px] font-medium"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            {number(filteredCustomers.length)} customers
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr
                className="border-b text-[10px] uppercase tracking-wider"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Segment</th>

                <th className="px-3 py-3">
                  <button
                    onClick={() => changeSort("sales")}
                    className="flex items-center gap-1 hover:text-violet-500"
                  >
                    Revenue <ArrowUpDown size={12} />
                  </button>
                </th>

                <th className="px-3 py-3">
                  <button
                    onClick={() => changeSort("profit")}
                    className="flex items-center gap-1 hover:text-violet-500"
                  >
                    Profit <ArrowUpDown size={12} />
                  </button>
                </th>

                <th className="px-3 py-3">
                  <button
                    onClick={() => changeSort("orders")}
                    className="flex items-center gap-1 hover:text-violet-500"
                  >
                    Orders <ArrowUpDown size={12} />
                  </button>
                </th>

                <th className="px-3 py-3">Avg. Order Value</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.slice(0, 50).map((customer, index) => (
                <tr
                  key={customer.id}
                  className="border-b transition hover:bg-violet-500/[0.04]"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-semibold text-violet-500">
                        {index + 1}
                      </div>

                      <div>
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {customer.name}
                        </p>

                        <p
                          className="mt-1 text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {customer.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td
                    className="px-3 py-4 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {customer.segment}
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold">
                    {currency(customer.sales)}
                  </td>

                  <td
                    className={`px-3 py-4 text-xs font-semibold ${
                      customer.profit >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {currency(customer.profit)}
                  </td>

                  <td
                    className="px-3 py-4 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {number(customer.orders)}
                  </td>

                  <td
                    className="px-3 py-4 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {currency(customer.averageOrderValue)}
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        customer.orders > 1
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {customer.orders > 1 ? "Repeat" : "Single Order"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <p
              className="py-10 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No customers match your search.
            </p>
          )}
        </div>

        <p
          className="mt-4 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Showing {Math.min(filteredCustomers.length, 50)} of{" "}
          {filteredCustomers.length} matching customers.
        </p>
      </Panel>

      {/* FOOTER */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[10px]"
        style={{
          borderColor: "var(--border-color)",
          color: "var(--text-muted)",
        }}
      >
        <span>SHOPLYTICS · CUSTOMER INTELLIGENCE</span>
        <span>Based on current dataset records</span>
      </div>
    </div>
  );
}

function ActivityIcon() {
  return <UserRound size={17} className="text-violet-500" />;
}

export default Customers;

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  MapPin,
  Package,
  Users,
  Percent,
  AlertTriangle,
  ShieldCheck,
  Award,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";

import { useDataset } from "../context/DatasetContext";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactMoney = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return money(amount);
};

const percent = (value) => `${(Number(value) || 0).toFixed(1)}%`;

const toNumber = (value) => {
  const result = Number(String(value ?? "").replace(/[$,%\s,]/g, ""));
  return Number.isFinite(result) ? result : 0;
};

const Card = ({ children, className = "" }) => (
  <section className={`bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 ${className}`}>
    {children}
  </section>
);

const SectionHeading = ({ title, description, icon: Icon }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-300">
      <Icon size={19} />
    </div>
    <div>
      <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{description}</p>
    </div>
  </div>
);

const Metric = ({ label, value, detail, icon: Icon, color = "violet" }) => {
  const styles = {
    violet: "bg-violet-500/10 text-violet-300",
    cyan: "bg-cyan-500/10 text-cyan-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
    rose: "bg-rose-500/10 text-rose-300",
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 hover:border-[var(--border-color)] transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">{label}</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-3">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${styles[color]}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">{detail}</p>
    </div>
  );
};

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-color)] rounded-xl p-3 shadow-xl">
      <p className="text-xs text-[var(--text-secondary)] mb-2">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="text-xs mb-1" style={{ color: item.color }}>
          {item.name}: {money(item.value)}
        </p>
      ))}
    </div>
  );
};

function BusinessInsights() {
  const { data, loading, error, hasData } = useDataset();

  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [productSearch, setProductSearch] = useState("");
  const [sortBy, setSortBy] = useState("profit");

  const result = useMemo(() => {
    if (!data?.length) return null;

    const keys = Object.keys(data[0] || {});

    const findField = (...terms) =>
      keys.find((key) =>
        terms.some((term) =>
          key.toLowerCase().replace(/[^a-z0-9]/g, "").includes(term)
        )
      );

    const fields = {
      sales: findField("sales", "revenue", "amount"),
      profit: findField("profit", "netincome"),
      region: findField("region"),
      category: findField("category"),
      subcategory: findField("subcategory"),
      product: findField("productname", "product"),
      customer: findField("customername", "customerid"),
      segment: findField("segment"),
      discount: findField("discount"),
      quantity: findField("quantity"),
      order: findField("orderid"),
    };

    if (!fields.sales || !fields.profit) {
      return {
        error: "Your dataset must contain Sales and Profit columns.",
      };
    }

    const records = data
      .map((row) => ({
        sales: toNumber(row[fields.sales]),
        profit: toNumber(row[fields.profit]),
        region: fields.region ? String(row[fields.region] || "Unknown") : "Unknown",
        category: fields.category ? String(row[fields.category] || "Unknown") : "Unknown",
        subcategory: fields.subcategory ? String(row[fields.subcategory] || "Unknown") : "Unknown",
        product: fields.product ? String(row[fields.product] || "Unknown") : "Unknown",
        customer: fields.customer ? String(row[fields.customer] || "Unknown") : "Unknown",
        segment: fields.segment ? String(row[fields.segment] || "Unknown") : "Unknown",
        discount: fields.discount ? toNumber(row[fields.discount]) : 0,
        quantity: fields.quantity ? toNumber(row[fields.quantity]) : 0,
        order: fields.order ? String(row[fields.order] || "") : "",
      }))
      .filter((row) => Number.isFinite(row.sales) && Number.isFinite(row.profit));

    const regions = [...new Set(records.map((r) => r.region))].sort();
    const categories = [...new Set(records.map((r) => r.category))].sort();

    return {
      records,
      fields,
      regions,
      categories,
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!result?.records) return [];

    return result.records.filter(
      (row) =>
        (selectedRegion === "All" || row.region === selectedRegion) &&
        (selectedCategory === "All" || row.category === selectedCategory)
    );
  }, [result, selectedRegion, selectedCategory]);

  const insights = useMemo(() => {
    if (!filtered.length) return null;

    const sum = (rows, field) =>
      rows.reduce((total, row) => total + row[field], 0);

    const sales = sum(filtered, "sales");
    const profit = sum(filtered, "profit");
    const margin = sales ? (profit / sales) * 100 : 0;

    const groupBy = (field) => {
      const groups = {};

      filtered.forEach((row) => {
        const name = row[field] || "Unknown";

        if (!groups[name]) {
          groups[name] = {
            name,
            sales: 0,
            profit: 0,
            quantity: 0,
            orders: new Set(),
            customers: new Set(),
            discountTotal: 0,
            discountCount: 0,
            lossRows: 0,
          };
        }

        const group = groups[name];

        group.sales += row.sales;
        group.profit += row.profit;
        group.quantity += row.quantity;

        if (row.order) group.orders.add(row.order);

        group.customers.add(row.customer);
        group.discountTotal += row.discount;
        group.discountCount++;

        if (row.profit < 0) group.lossRows++;
      });

      return Object.values(groups).map((item) => ({
        ...item,
        orders: item.orders.size,
        customers: item.customers.size,
        margin: item.sales ? (item.profit / item.sales) * 100 : 0,
        averageDiscount: item.discountCount
          ? item.discountTotal / item.discountCount
          : 0,
      }));
    };

    const regionData = groupBy("region").sort((a, b) => b.profit - a.profit);
    const categoryData = groupBy("category").sort((a, b) => b.profit - a.profit);
    const segmentData = groupBy("segment").sort((a, b) => b.profit - a.profit);
    const productData = groupBy("product").sort((a, b) => b.profit - a.profit);
    const subcategoryData = groupBy("subcategory").sort((a, b) => b.profit - a.profit);

    const discountBands = [
      { name: "No discount", min: 0, max: 0 },
      { name: "1–10%", min: 0.000001, max: 0.1 },
      { name: "11–20%", min: 0.1, max: 0.2 },
      { name: "21–30%", min: 0.2, max: 0.3 },
      { name: "Above 30%", min: 0.3, max: Infinity },
    ].map((band) => {
      const matching = filtered.filter((row) =>
        band.min === 0
          ? row.discount === 0
          : row.discount > band.min && row.discount <= band.max
      );

      const bandSales = sum(matching, "sales");
      const bandProfit = sum(matching, "profit");

      return {
        name: band.name,
        sales: bandSales,
        profit: bandProfit,
        margin: bandSales ? (bandProfit / bandSales) * 100 : 0,
        rows: matching.length,
      };
    });

    const lossProducts = productData
      .filter((item) => item.profit < 0)
      .sort((a, b) => a.profit - b.profit);

    const highDiscountLosses = filtered.filter(
      (row) => row.discount > 0.2 && row.profit < 0
    );

    const highRevenueLowMargin = productData
      .filter((item) => item.sales > 0 && item.margin < 5)
      .sort((a, b) => b.sales - a.sales);

    const scatterData = filtered
      .filter((row) => row.sales > 0)
      .slice(0, 700)
      .map((row) => ({
        sales: row.sales,
        profit: row.profit,
        discount: row.discount,
      }));

    const averageDiscount = filtered.length
      ? filtered.reduce((sum, row) => sum + row.discount, 0) / filtered.length
      : 0;

    const customerData = groupBy("customer").sort((a, b) => b.sales - a.sales);
    const repeatCustomers = customerData.filter((item) => item.orders > 1);

    const recommendations = [];

    if (lossProducts.length) {
      recommendations.push({
        type: "Profitability",
        level: "High",
        title: "Review loss-making products",
        description: `${lossProducts.length} products have negative total profit. Review pricing, supplier costs, returns, and discount policies.`,
        action: "Review product margins",
      });
    }

    if (highDiscountLosses.length) {
      recommendations.push({
        type: "Discount strategy",
        level: "High",
        title: "Investigate high-discount losses",
        description: `${highDiscountLosses.length} transaction rows have discounts above 20% and negative profit. Evaluate discount limits.`,
        action: "Optimize discounts",
      });
    }

    if (highRevenueLowMargin.length) {
      recommendations.push({
        type: "Product strategy",
        level: "Medium",
        title: "Protect high-revenue products",
        description: `${highRevenueLowMargin.length} products generate revenue but have margins below 5%. Check costs and pricing.`,
        action: "Improve product margins",
      });
    }

    const weakestRegion = [...regionData].sort((a, b) => a.margin - b.margin)[0];

    if (weakestRegion && weakestRegion.sales > 0) {
      recommendations.push({
        type: "Regional strategy",
        level: "Medium",
        title: "Investigate regional profitability",
        description: `${weakestRegion.name} has the lowest regional profit margin at ${percent(weakestRegion.margin)}. Review its product mix and operating costs.`,
        action: "Review regional performance",
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        type: "Business health",
        level: "Low",
        title: "No critical profitability pattern detected",
        description: "The current filters did not trigger the configured loss-making product, discount, or low-margin checks.",
        action: "Continue monitoring",
      });
    }

    return {
      sales,
      profit,
      margin,
      rowCount: filtered.length,
      averageDiscount,
      regionData,
      categoryData,
      segmentData,
      productData,
      subcategoryData,
      discountBands,
      lossProducts,
      highRevenueLowMargin,
      highDiscountLosses,
      scatterData,
      customerData,
      repeatCustomers,
      recommendations,
      topRegion: regionData[0],
      topCategory: categoryData[0],
      topProduct: productData[0],
      bestSegment: segmentData[0],
      worstCategory: [...categoryData].sort((a, b) => a.margin - b.margin)[0],
      repeatRate: customerData.length
        ? (repeatCustomers.length / customerData.length) * 100
        : 0,
    };
  }, [filtered]);

  const displayedProducts = useMemo(() => {
    if (!insights) return [];

    return insights.productData
      .filter((item) =>
        item.name.toLowerCase().includes(productSearch.toLowerCase())
      )
      .sort((a, b) =>
        sortBy === "sales"
          ? b.sales - a.sales
          : sortBy === "margin"
          ? b.margin - a.margin
          : b.profit - a.profit
      )
      .slice(0, 12);
  }, [insights, productSearch, sortBy]);

  if (loading) {
    return (
      <div className="p-10 text-center text-[var(--text-secondary)]">
        Preparing business insights...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-xl bg-rose-500/10 text-rose-300">
        {error}
      </div>
    );
  }

  if (!hasData || !result) {
    return (
      <div className="p-10 text-center bg-[var(--surface)] rounded-2xl border border-[var(--border-color)]">
        <BriefcaseBusiness size={42} className="mx-auto text-violet-400 mb-4" />
        <h2 className="text-xl text-[var(--text-primary)] font-bold">
          Dataset Required
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Upload a dataset from Data Management to generate business insights.
        </p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-8 bg-[var(--surface)] border border-amber-500/20 rounded-2xl">
        <AlertTriangle className="text-amber-400 mb-3" size={28} />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Required columns missing
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {result.error}
        </p>
      </div>
    );
  }

  if (!insights || !filtered.length) {
    return (
      <div className="p-8 text-center bg-[var(--surface)] rounded-2xl border border-[var(--border-color)]">
        <Search className="mx-auto text-violet-300 mb-3" size={28} />
        <p className="text-[var(--text-primary)] font-semibold">
          No matching records
        </p>
        <p className="text-[var(--text-secondary)] text-xs mt-2">
          Change your filters to view business insights.
        </p>
      </div>
    );
  }

  return (
    <div className="business-insights-page space-y-7 pb-10">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-violet-500/15">
              <BriefcaseBusiness size={18} className="text-violet-300" />
            </div>
            <span className="text-[10px] tracking-[3px] text-violet-300 font-bold">
              BUSINESS INTELLIGENCE CENTER
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Business Insights
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Discover profitability patterns, business opportunities, and practical actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
          >
            <option value="All">All Regions</option>
            {result.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none"
          >
            <option value="All">All Categories</option>
            {result.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSelectedRegion("All");
              setSelectedCategory("All");
              setProductSearch("");
            }}
            className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric
          label="Filtered Revenue"
          value={money(insights.sales)}
          detail={`${insights.rowCount.toLocaleString()} transaction rows`}
          icon={TrendingUp}
          color="violet"
        />
        <Metric
          label="Net Profit"
          value={money(insights.profit)}
          detail="Profit after recorded costs"
          icon={Target}
          color={insights.profit >= 0 ? "emerald" : "rose"}
        />
        <Metric
          label="Profit Margin"
          value={percent(insights.margin)}
          detail="Profit as a percentage of sales"
          icon={Percent}
          color="cyan"
        />
        <Metric
          label="Average Discount"
          value={percent(insights.averageDiscount * 100)}
          detail="Average recorded discount per row"
          icon={Award}
          color="amber"
        />
      </div>

      {/* EXECUTIVE SUMMARY */}
      <Card className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-[var(--surface)] border-violet-500/20">
        <SectionHeading
          title="Executive Business Summary"
          description="A quick interpretation of the current filtered dataset"
          icon={Sparkles}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)]/50">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
              Top profit region
            </p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-2">
              {insights.topRegion?.name || "N/A"}
            </p>
            <p className="text-xs text-emerald-300 mt-1">
              {money(insights.topRegion?.profit || 0)} profit
            </p>
          </div>

          <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)]/50">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
              Best profit category
            </p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-2">
              {insights.topCategory?.name || "N/A"}
            </p>
            <p className="text-xs text-emerald-300 mt-1">
              {percent(insights.topCategory?.margin || 0)} margin
            </p>
          </div>

          <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-color)]/50">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
              Leading customer segment
            </p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-2">
              {insights.bestSegment?.name || "N/A"}
            </p>
            <p className="text-xs text-cyan-300 mt-1">
              {money(insights.bestSegment?.sales || 0)} sales
            </p>
          </div>
        </div>
      </Card>

      {/* PROFITABILITY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <SectionHeading
            title="Category Profitability"
            description="Compare revenue and profit by category"
            icon={Package}
          />

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                  tickFormatter={compactMoney}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[5, 5, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeading
            title="Profit Contribution"
            description="Share of total profit by category"
            icon={Award}
          />

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insights.categoryData.filter((item) => item.profit > 0)}
                  dataKey="profit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  {insights.categoryData
                    .filter((item) => item.profit > 0)
                    .map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* REGIONAL INSIGHTS */}
      <Card>
        <SectionHeading
          title="Regional Performance Intelligence"
          description="Find regions contributing most and least to business profit"
          icon={MapPin}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {insights.regionData.map((region, index) => (
            <div
              key={region.name}
              className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-color)]/50"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)]">
                  {region.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  #{index + 1}
                </span>
              </div>

              <p
                className={`text-lg font-bold mt-3 ${
                  region.profit >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {money(region.profit)}
              </p>

              <div className="flex justify-between mt-2 text-[10px] text-[var(--text-secondary)]">
                <span>Revenue</span>
                <span>{compactMoney(region.sales)}</span>
              </div>

              <div className="flex justify-between mt-1 text-[10px] text-[var(--text-secondary)]">
                <span>Margin</span>
                <span>{percent(region.margin)}</span>
              </div>

              <div className="h-1.5 bg-[var(--surface-secondary)] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-violet-400 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (region.profit /
                          Math.max(
                            ...insights.regionData.map((r) =>
                              Math.max(0, r.profit)
                            ),
                            1
                          )) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* DISCOUNT EFFECTIVENESS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <SectionHeading
            title="Discount Effectiveness"
            description="Compare profitability across discount bands"
            icon={Percent}
          />

          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.discountBands}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                  tickFormatter={compactMoney}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TooltipBox />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="sales" name="Sales" fill="#06b6d4" radius={[5, 5, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#a78bfa" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs">
              <thead className="text-[var(--text-muted)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="text-left py-3">Discount</th>
                  <th className="text-right py-3">Margin</th>
                  <th className="text-right py-3">Rows</th>
                </tr>
              </thead>
              <tbody>
                {insights.discountBands.map((band) => (
                  <tr key={band.name} className="border-b border-[var(--border-color)]">
                    <td className="py-3 text-[var(--text-secondary)]">
                      {band.name}
                    </td>
                    <td
                      className={`py-3 text-right ${
                        band.margin >= 0 ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {percent(band.margin)}
                    </td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">
                      {band.rows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionHeading
            title="Sales vs Profit Relationship"
            description="Explore transaction-level revenue and profit distribution"
            icon={Target}
          />

          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                />
                <XAxis
                  type="number"
                  dataKey="sales"
                  name="Sales"
                  tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                  tickFormatter={compactMoney}
                  label={{
                    value: "Sales",
                    position: "insideBottom",
                    fill: "var(--text-muted)",
                    fontSize: 10,
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="profit"
                  name="Profit"
                  tick={{ fill: "var(--chart-text)", fontSize: 10 }}
                  tickFormatter={compactMoney}
                />
                <ZAxis type="number" dataKey="discount" range={[45, 120]} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "discount"
                      ? percent(value * 100)
                      : money(value)
                  }
                />
                <Scatter
                  data={insights.scatterData}
                  fill="#8b5cf6"
                  fillOpacity={0.55}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            Each point represents a transaction row. The chart is capped at 700
            points for display performance.
          </p>
        </Card>
      </div>

      {/* CUSTOMER AND SEGMENT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <SectionHeading
            title="Customer Segment Intelligence"
            description="Understand the sales and profit contribution of each segment"
            icon={Users}
          />

          <div className="space-y-4">
            {insights.segmentData.map((segment) => (
              <div key={segment.name}>
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-semibold">
                      {segment.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {segment.customers.toLocaleString()} distinct customer labels
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-300 font-semibold">
                      {money(segment.profit)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {percent(segment.margin)} margin
                    </p>
                  </div>
                </div>

                <div className="h-2 bg-[var(--surface-secondary)] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          (segment.sales /
                            Math.max(
                              ...insights.segmentData.map((s) => s.sales),
                              1
                            )) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 bg-[var(--surface-secondary)] rounded-xl">
            <p className="text-xs text-[var(--text-secondary)]">
              Repeat-customer indicator
            </p>
            <p className="text-xl text-[var(--text-primary)] font-bold mt-1">
              {percent(insights.repeatRate)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Share of distinct customer labels with more than one distinct
              order ID.
            </p>
          </div>
        </Card>

        <Card>
          <SectionHeading
            title="Product Opportunity Finder"
            description="Identify products that deserve pricing or portfolio review"
            icon={Package}
          />

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[var(--surface-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
            >
              <option value="profit">Sort by profit</option>
              <option value="sales">Sort by sales</option>
              <option value="margin">Sort by margin</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--text-muted)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="text-left py-3">Product</th>
                  <th className="text-right py-3">Sales</th>
                  <th className="text-right py-3">Profit</th>
                  <th className="text-right py-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((product) => (
                  <tr key={product.name} className="border-b border-[var(--border-color)]">
                    <td className="py-3 pr-3 text-[var(--text-secondary)] max-w-[180px]">
                      <span className="line-clamp-2">{product.name}</span>
                    </td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">
                      {compactMoney(product.sales)}
                    </td>
                    <td
                      className={`py-3 text-right ${
                        product.profit >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {compactMoney(product.profit)}
                    </td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">
                      {percent(product.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!displayedProducts.length && (
              <p className="text-center text-xs text-[var(--text-muted)] py-8">
                No products match your search.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* LOSS MAKING PRODUCTS */}
      <Card>
        <SectionHeading
          title="Loss-Making Product Watchlist"
          description="Products with negative total profit under the selected filters"
          icon={AlertTriangle}
        />

        {insights.lossProducts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--text-muted)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="text-left py-3">Product</th>
                  <th className="text-right py-3">Sales</th>
                  <th className="text-right py-3">Loss</th>
                  <th className="text-right py-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {insights.lossProducts.slice(0, 8).map((item) => (
                  <tr key={item.name} className="border-b border-[var(--border-color)]">
                    <td className="py-3 text-[var(--text-secondary)] pr-3">
                      {item.name}
                    </td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">
                      {money(item.sales)}
                    </td>
                    <td className="py-3 text-right text-rose-400">
                      {money(item.profit)}
                    </td>
                    <td className="py-3 text-right text-rose-300">
                      {percent(item.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <ShieldCheck className="text-emerald-300" size={20} />
            <p className="text-xs text-emerald-200">
              No products with negative total profit were found under the
              current filters.
            </p>
          </div>
        )}
      </Card>

      {/* RECOMMENDATIONS */}
      <Card className="bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-[var(--surface)] border-violet-500/20">
        <SectionHeading
          title="Smart Business Recommendations"
          description="Rule-based suggestions generated from the selected dataset"
          icon={Lightbulb}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.recommendations.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-color)]/50"
            >
              <div className="flex justify-between items-center gap-3 mb-3">
                <span className="text-[10px] tracking-wider uppercase text-violet-300">
                  {item.type}
                </span>

                <span
                  className={`text-[10px] px-2 py-1 rounded-full ${
                    item.level === "High"
                      ? "bg-rose-500/10 text-rose-300"
                      : item.level === "Medium"
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {item.level} priority
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2">
                {item.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 text-xs text-violet-300">
                <ArrowUpRight size={14} />
                {item.action}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* FOOTNOTE */}
      <div className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] leading-relaxed">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <p>
          Insights and recommendations are generated using descriptive,
          rule-based analysis of the currently filtered dataset. They are
          decision-support suggestions, not causal findings or guaranteed
          business outcomes. The repeat-customer indicator depends on
          available customer and order identifiers.
        </p>
      </div>
    </div>
  );
}

export default BusinessInsights;
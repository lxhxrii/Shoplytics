import React, { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CalendarDays,
  TrendingUp,
  Package,
  Users,
  MapPin,
  BarChart3,
  RefreshCw,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useDataset } from "../context/DatasetContext";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const normalize = (value) =>
  String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function getField(columns, terms) {
  return columns.find((column) =>
    terms.some((term) => normalize(column).includes(normalize(term)))
  );
}

function getValue(row, field) {
  return field ? row[field] : "";
}

function numberValue(value) {
  const number = Number(String(value ?? "").replace(/[$,%\s,]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function groupRows(rows, field, metric) {
  const groups = {};

  rows.forEach((row) => {
    const name = String(getValue(row, field) || "Unknown");
    if (!groups[name]) groups[name] = 0;
    groups[name] += numberValue(getValue(row, metric));
  });

  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;

  const columns = Object.keys(rows[0]);
  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    columns.map(escapeCSV).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCSV(row[column])).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const reportOptions = [
  {
    id: "executive",
    title: "Executive Summary",
    description: "A high-level overview of business performance.",
    icon: BarChart3,
  },
  {
    id: "sales",
    title: "Sales Report",
    description: "Order activity, revenue and profit details.",
    icon: TrendingUp,
  },
  {
    id: "products",
    title: "Product Report",
    description: "Product performance and profitability.",
    icon: Package,
  },
  {
    id: "customers",
    title: "Customer Report",
    description: "Customer segments and purchase activity.",
    icon: Users,
  },
  {
    id: "regions",
    title: "Regional Report",
    description: "Business performance across regions.",
    icon: MapPin,
  },
];

export default function Reports() {
  const { data = [], columns = [], fileName = "Dataset", hasData } =
    useDataset();

  const [reportType, setReportType] = useState("executive");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(false);

  const fields = useMemo(
    () => ({
      order: getField(columns, ["orderid", "order_id"]),
      date: getField(columns, ["orderdate", "date"]),
      sales: getField(columns, ["sales", "revenue"]),
      profit: getField(columns, ["profit"]),
      quantity: getField(columns, ["quantity", "qty"]),
      category: getField(columns, ["category"]),
      product: getField(columns, ["productname", "product"]),
      customer: getField(columns, ["customername", "customerid", "customer"]),
      segment: getField(columns, ["segment"]),
      region: getField(columns, ["region"]),
    }),
    [columns]
  );

  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      const dateValue = fields.date ? getValue(row, fields.date) : "";
      const parsedDate = dateValue ? new Date(dateValue) : null;

      if (dateFrom && parsedDate && !Number.isNaN(parsedDate.getTime())) {
        if (parsedDate < new Date(dateFrom)) return false;
      }

      if (dateTo && parsedDate && !Number.isNaN(parsedDate.getTime())) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (parsedDate > endDate) return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const searchable = [
          getValue(row, fields.order),
          getValue(row, fields.product),
          getValue(row, fields.customer),
          getValue(row, fields.category),
          getValue(row, fields.region),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    });
  }, [data, fields, dateFrom, dateTo, search]);

  const report = useMemo(() => {
    const totalSales = filteredRows.reduce(
      (sum, row) => sum + numberValue(getValue(row, fields.sales)),
      0
    );

    const totalProfit = filteredRows.reduce(
      (sum, row) => sum + numberValue(getValue(row, fields.profit)),
      0
    );

    const totalQuantity = filteredRows.reduce(
      (sum, row) => sum + numberValue(getValue(row, fields.quantity)),
      0
    );

    const orders = fields.order
      ? new Set(filteredRows.map((row) => getValue(row, fields.order))).size
      : filteredRows.length;

    const customers = fields.customer
      ? new Set(filteredRows.map((row) => getValue(row, fields.customer))).size
      : 0;

    const averageOrderValue = orders ? totalSales / orders : 0;
    const profitMargin = totalSales ? (totalProfit / totalSales) * 100 : 0;

    return {
      totalSales,
      totalProfit,
      totalQuantity,
      orders,
      customers,
      averageOrderValue,
      profitMargin,
      categories: groupRows(filteredRows, fields.category, fields.sales),
      products: groupRows(filteredRows, fields.product, fields.sales),
      regions: groupRows(filteredRows, fields.region, fields.sales),
      segments: groupRows(filteredRows, fields.segment, fields.sales),
    };
  }, [filteredRows, fields]);

  const selectedReport = reportOptions.find((item) => item.id === reportType);

  const exportRows = useMemo(() => {
    if (reportType === "products") {
      return report.products.map((item) => ({
        Product: item.name,
        Sales: item.value.toFixed(2),
      }));
    }

    if (reportType === "regions") {
      return report.regions.map((item) => ({
        Region: item.name,
        Sales: item.value.toFixed(2),
      }));
    }

    if (reportType === "customers") {
      return report.segments.map((item) => ({
        CustomerSegment: item.name,
        Sales: item.value.toFixed(2),
      }));
    }

    if (reportType === "executive") {
      return [
        { Metric: "Total Sales", Value: report.totalSales },
        { Metric: "Total Profit", Value: report.totalProfit },
        { Metric: "Profit Margin (%)", Value: report.profitMargin.toFixed(2) },
        { Metric: "Orders", Value: report.orders },
        { Metric: "Customers", Value: report.customers },
        { Metric: "Quantity Sold", Value: report.totalQuantity },
        { Metric: "Average Order Value", Value: report.averageOrderValue },
      ];
    }

    return filteredRows;
  }, [reportType, report, filteredRows]);

  const handleGenerate = () => setGenerated(true);

  const handleExport = () => {
    downloadCSV(
      exportRows,
      `Shoplytics_${reportType}_report.csv`
    );
  };

  const handlePrint = () => window.print();

  if (!hasData || !data.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <FileText size={48} className="text-violet-400 mb-4" />

        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          No dataset available
        </h2>

        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Upload a CSV dataset in Data Management to generate reports.
        </p>
      </div>
    );
  }

  const reportRows =
    reportType === "products"
      ? report.products
      : reportType === "regions"
        ? report.regions
        : reportType === "customers"
          ? report.segments
          : report.categories;

  const tableTitle =
    reportType === "products"
      ? "Product Sales Breakdown"
      : reportType === "regions"
        ? "Regional Sales Breakdown"
        : reportType === "customers"
          ? "Customer Segment Breakdown"
          : "Category Sales Breakdown";

  return (
    <div className="reports-page space-y-7 pb-10">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold tracking-[2px] mb-2">
            <FileText size={15} />
            BUSINESS REPORTING CENTER
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Reports & <span className="text-violet-400">Export</span>
          </h1>

          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Generate, review and export reports from your business dataset.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold"
          >
            <RefreshCw size={16} />
            Generate Report
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-[var(--text-primary)] text-sm hover:bg-[var(--surface-hover)]"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Dataset information */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-300">
            <FileSpreadsheet size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {fileName}
            </p>

            <p className="text-xs text-[var(--text-muted)]">
              {formatNumber(filteredRows.length)} of {formatNumber(data.length)} records included
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 size={15} />
          Dataset connected
        </div>
      </div>

      {/* Report selector */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Choose a report
            </h2>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Select the business report you want to generate.
            </p>
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            05 report types
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {reportOptions.map((item) => {
            const Icon = item.icon;
            const active = reportType === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setReportType(item.id);
                  setGenerated(false);
                }}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  active
                    ? "bg-violet-500/10 border-violet-400/60"
                    : "bg-[var(--surface)] border-[var(--border-color)] hover:border-violet-400/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    active
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  <Icon size={20} />
                </div>

                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2">
                  {item.description}
                </p>

                {active && (
                  <div className="text-[10px] text-violet-300 mt-3 font-semibold">
                    SELECTED REPORT
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={17} className="text-violet-300" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Report filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">
              From date
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setGenerated(false);
              }}
              className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">
              To date
            </label>

            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setGenerated(false);
              }}
              className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">
              Search records
            </label>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3.5 text-[var(--text-muted)]"
              />

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setGenerated(false);
                }}
                placeholder="Order, product, customer..."
                className="w-full rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] pl-9 pr-3 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-violet-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Report summary */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {selectedReport?.title}
            </h2>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Report preview based on the selected filters.
            </p>
          </div>

          {generated && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} />
              Report generated
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            {
              label: "Total Sales",
              value: formatCurrency(report.totalSales),
              color: "text-violet-300",
            },
            {
              label: "Total Profit",
              value: formatCurrency(report.totalProfit),
              color: "text-emerald-300",
            },
            {
              label: "Total Orders",
              value: formatNumber(report.orders),
              color: "text-blue-300",
            },
            {
              label: "Customers",
              value: formatNumber(report.customers),
              color: "text-amber-300",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)]"
            >
              <p className="text-xs text-[var(--text-muted)]">
                {item.label}
              </p>

              <p className={`text-xl font-bold mt-2 ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)]">
              Profit Margin
            </p>

            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">
              {report.profitMargin.toFixed(2)}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)]">
              Average Order Value
            </p>

            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">
              {formatCurrency(report.averageOrderValue)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-muted)]">
              Units Sold
            </p>

            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">
              {formatNumber(report.totalQuantity)}
            </p>
          </div>
        </div>
      </section>

      {/* Breakdown table */}
      <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {tableTitle}
            </h2>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Ranked by sales contribution.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!exportRows.length}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-secondary)] text-[var(--text-secondary)] text-xs">
              <tr>
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-right px-5 py-3 font-medium">Sales</th>
                <th className="text-right px-5 py-3 font-medium">Share</th>
              </tr>
            </thead>

            <tbody>
              {reportRows
                .filter((item) =>
                  item.name.toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 15)
                .map((item, index) => (
                  <tr
                    key={item.name}
                    className="border-t border-[var(--border-color)] hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {index + 1}
                    </td>

                    <td className="px-5 py-3 text-[var(--text-primary)] font-medium">
                      {item.name}
                    </td>

                    <td className="px-5 py-3 text-right text-[var(--text-primary)]">
                      {formatCurrency(item.value)}
                    </td>

                    <td className="px-5 py-3 text-right text-violet-300">
                      {report.totalSales
                        ? ((item.value / report.totalSales) * 100).toFixed(1)
                        : "0.0"}%
                    </td>
                  </tr>
                ))}

              {!reportRows.length && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-[var(--text-muted)] py-8"
                  >
                    No report records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Export center */}
      <section className="p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-[var(--surface)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-300 mb-2">
              <Download size={18} />

              <span className="text-xs font-bold tracking-wider">
                EXPORT CENTER
              </span>
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Take your business data with you
            </h2>

            <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-lg">
              Download the selected report as a CSV file, or print this report
              preview and save it as a PDF using your browser's print dialog.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              <FileSpreadsheet size={16} />
              Download CSV
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold"
            >
              <Printer size={16} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </section>

      <p className="text-[11px] text-[var(--text-muted)] text-center">
        Shoplytics Report Engine · Reports are calculated from the currently loaded dataset.
      </p>
    </div>
  );
}

const normalizeKey = (key) =>
  String(key ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const findColumn = (columns, aliases) => {
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeKey(column),
  }));

  for (const alias of aliases) {
    const match = normalizedColumns.find(
      (column) => column.normalized === normalizeKey(alias)
    );

    if (match) return match.original;
  }

  return null;
};

const toNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? "").replace(/[$,%\s,]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
};

const toDate = (value) => {
  if (!value) return null;

  // Handles common US dates such as 11/8/2016.
  const usDate = String(value).trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (usDate) {
    const [, month, day, year] = usDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const round = (value, digits = 2) =>
  Number(value.toFixed(digits));

const groupBy = (rows, keyGetter, valueGetter) => {
  const result = new Map();

  rows.forEach((row) => {
    const key = keyGetter(row);

    if (key === null || key === undefined || key === "") return;

    result.set(key, (result.get(key) || 0) + valueGetter(row));
  });

  return result;
};

export function calculateAnalytics(data = [], columns = []) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      available: false,
      message: "Upload a dataset to view business analytics.",
    };
  }

  const fields = {
    sales: findColumn(columns, ["Sales", "Revenue", "Total Sales"]),
    profit: findColumn(columns, ["Profit", "Net Profit"]),
    quantity: findColumn(columns, ["Quantity", "Units Sold"]),
    orderId: findColumn(columns, ["Order ID", "Order Number"]),
    customerId: findColumn(columns, ["Customer ID", "Customer Number"]),
    orderDate: findColumn(columns, ["Order Date", "Date"]),
    shipDate: findColumn(columns, ["Ship Date"]),
    category: findColumn(columns, ["Category", "Product Category"]),
    subCategory: findColumn(columns, ["Sub-Category", "Sub Category"]),
    product: findColumn(columns, ["Product Name", "Product"]),
    region: findColumn(columns, ["Region"]),
    state: findColumn(columns, ["State"]),
    city: findColumn(columns, ["City"]),
    discount: findColumn(columns, ["Discount"]),
    shipMode: findColumn(columns, ["Ship Mode", "Shipping Mode"]),
    segment: findColumn(columns, ["Segment", "Customer Segment"]),
  };

  const validRows = data.filter((row) =>
    Object.values(row).some(
      (value) => String(value ?? "").trim() !== ""
    )
  );

  const sum = (field) =>
    field
      ? validRows.reduce((total, row) => total + toNumber(row[field]), 0)
      : null;

  const uniqueCount = (field) =>
    field
      ? new Set(
          validRows
            .map((row) => String(row[field] ?? "").trim())
            .filter(Boolean)
        ).size
      : null;

  const totalSales = sum(fields.sales);
  const totalProfit = sum(fields.profit);
  const totalQuantity = sum(fields.quantity);
  const totalOrders = uniqueCount(fields.orderId);
  const totalCustomers = uniqueCount(fields.customerId);

  const profitMargin =
    totalSales && totalProfit !== null
      ? (totalProfit / totalSales) * 100
      : null;

  const averageOrderValue =
    totalSales !== null && totalOrders
      ? totalSales / totalOrders
      : null;

  const salesByCategory = fields.category && fields.sales
    ? groupBy(
        validRows,
        (row) => row[fields.category],
        (row) => toNumber(row[fields.sales])
      )
    : new Map();

  const profitByCategory = fields.category && fields.profit
    ? groupBy(
        validRows,
        (row) => row[fields.category],
        (row) => toNumber(row[fields.profit])
      )
    : new Map();

  const salesByRegion = fields.region && fields.sales
    ? groupBy(
        validRows,
        (row) => row[fields.region],
        (row) => toNumber(row[fields.sales])
      )
    : new Map();

  const salesBySubCategory = fields.subCategory && fields.sales
    ? groupBy(
        validRows,
        (row) => row[fields.subCategory],
        (row) => toNumber(row[fields.sales])
      )
    : new Map();

  const monthlySalesMap = new Map();

  if (fields.orderDate && fields.sales) {
    validRows.forEach((row) => {
      const date = toDate(row[fields.orderDate]);

      if (!date) return;

      const monthKey =
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      monthlySalesMap.set(
        monthKey,
        (monthlySalesMap.get(monthKey) || 0) +
          toNumber(row[fields.sales])
      );
    });
  }

  const monthlySales = Array.from(monthlySalesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, sales]) => ({
      month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString(
        "en-US",
        { month: "short", year: "numeric" }
      ),
      sales: round(sales),
    }));

  const topProducts = fields.product && fields.sales
    ? Array.from(
        groupBy(
          validRows,
          (row) => row[fields.product],
          (row) => toNumber(row[fields.sales])
        ).entries()
      )
        .map(([name, sales]) => ({ name, sales: round(sales) }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
    : [];

  const topRegions = Array.from(salesByRegion.entries())
    .map(([name, sales]) => ({ name, sales: round(sales) }))
    .sort((a, b) => b.sales - a.sales);

  const categoryPerformance = Array.from(salesByCategory.entries())
    .map(([name, sales]) => ({
      name,
      sales: round(sales),
      profit: round(profitByCategory.get(name) || 0),
    }))
    .sort((a, b) => b.sales - a.sales);

  const subCategoryPerformance = Array.from(salesBySubCategory.entries())
    .map(([name, sales]) => ({ name, sales: round(sales) }))
    .sort((a, b) => b.sales - a.sales);

  const discountImpact = fields.discount && fields.profit
    ? Array.from(
        groupBy(
          validRows,
          (row) => `${round(toNumber(row[fields.discount]) * 100, 0)}%`,
          (row) => toNumber(row[fields.profit])
        ).entries()
      )
        .map(([discount, profit]) => ({ discount, profit: round(profit) }))
        .sort(
          (a, b) =>
            Number(a.discount.replace("%", "")) -
            Number(b.discount.replace("%", ""))
        )
    : [];

  const shippingModes = fields.shipMode && fields.orderId
    ? Array.from(
        groupBy(
          validRows,
          (row) => row[fields.shipMode],
          () => 1
        ).entries()
      ).map(([name, orders]) => ({ name, orders }))
    : [];

  const uniqueOrderRows = new Map();

  if (fields.orderId && fields.orderDate && fields.shipDate) {
    validRows.forEach((row) => {
      const id = row[fields.orderId];

      if (!id || uniqueOrderRows.has(id)) return;

      const orderDate = toDate(row[fields.orderDate]);
      const shipDate = toDate(row[fields.shipDate]);

      if (orderDate && shipDate) {
        uniqueOrderRows.set(id, {
          orderDate,
          shipDate,
          days: Math.round(
            (shipDate - orderDate) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    });
  }

  const shippingDays = Array.from(uniqueOrderRows.values())
    .map((order) => order.days)
    .filter((days) => days >= 0);

  const averageShippingDays = shippingDays.length
    ? shippingDays.reduce((a, b) => a + b, 0) / shippingDays.length
    : null;

  const lossMakingCategories = categoryPerformance.filter(
    (item) => item.profit < 0
  );

  const quality = {
    totalRows: data.length,
    validRows: validRows.length,
    missingValues: data.reduce(
      (total, row) =>
        total +
        columns.filter(
          (column) =>
            row[column] === null ||
            row[column] === undefined ||
            String(row[column]).trim() === ""
        ).length,
      0
    ),
    duplicateRows:
      data.length - new Set(data.map((row) => JSON.stringify(row))).size,
  };

  return {
    available: true,
    rowCount: validRows.length,
    fields,
    quality,
    kpis: {
      totalSales: totalSales === null ? null : round(totalSales),
      totalProfit: totalProfit === null ? null : round(totalProfit),
      totalOrders,
      totalCustomers,
      totalQuantity: totalQuantity === null ? null : round(totalQuantity),
      averageOrderValue:
        averageOrderValue === null ? null : round(averageOrderValue),
      profitMargin:
        profitMargin === null ? null : round(profitMargin),
      averageShippingDays:
        averageShippingDays === null ? null : round(averageShippingDays),
    },
    monthlySales,
    categoryPerformance,
    topProducts,
    topRegions,
    subCategoryPerformance,
    discountImpact,
    shippingModes,
    lossMakingCategories,
  };
}

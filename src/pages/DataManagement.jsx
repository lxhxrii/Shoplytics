
import {
  Upload,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";

import { useDataset } from "../context/DatasetContext";

export default function DataManagement() {
  const {
    data = [],
    columns = [],
    fileName,
    loading,
    error,
    uploadDataset,
    clearDataset,
    hasData,
  } = useDataset();

  const missingValues = data.reduce(
    (total, row) =>
      total +
      columns.filter(
        (column) =>
          row[column] === null ||
          row[column] === undefined ||
          String(row[column]).trim() === ""
      ).length,
    0
  );

  const duplicateCount =
    data.length - new Set(data.map((row) => JSON.stringify(row))).size;

  const stats = [
    {
      label: "Total Records",
      value: data.length,
      icon: Database,
    },
    {
      label: "Total Columns",
      value: columns.length,
      icon: FileSpreadsheet,
    },
    {
      label: "Missing Values",
      value: missingValues,
      icon: AlertCircle,
    },
    {
      label: "Duplicate Rows",
      value: duplicateCount,
      icon: AlertCircle,
    },
  ];

  const panel =
    "rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] shadow-sm";

  const mutedText = "text-[var(--text-secondary)]";
  const primaryText = "text-[var(--text-primary)]";

  return (
    <div className="space-y-7">
      {/* PAGE HEADER */}
      <div>
        <p className="text-sm font-semibold tracking-wider text-violet-500">
          WORKSPACE / DATA
        </p>

        <h1 className={`mt-2 text-3xl font-bold ${primaryText}`}>
          Data Management
        </h1>

        <p className={`mt-2 text-sm ${mutedText}`}>
          Upload, inspect and validate your e-commerce datasets.
        </p>
      </div>

      {/* UPLOAD SECTION */}
      <div className={`${panel} p-6 sm:p-8`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-3">
            <Upload className="text-violet-500" size={23} />
          </div>

          <div>
            <h2 className={`font-semibold ${primaryText}`}>
              Upload your dataset
            </h2>

            <p className={`text-sm ${mutedText}`}>
              Upload a CSV file to power your analytics dashboard.
            </p>
          </div>
        </div>

        <label
          className="
            mt-7 flex cursor-pointer flex-col items-center
            rounded-xl border-2 border-dashed border-violet-400/40
            bg-violet-500/5 px-5 py-10 text-center
            transition hover:border-violet-500 hover:bg-violet-500/10
          "
        >
          {loading ? (
            <Loader2
              size={30}
              className="mb-3 animate-spin text-violet-500"
            />
          ) : (
            <Upload size={30} className="mb-3 text-violet-500" />
          )}

          <span className={`font-medium ${primaryText}`}>
            {loading ? "Processing dataset..." : "Click to browse CSV file"}
          </span>

          <span className={`mt-2 text-xs ${mutedText}`}>
            CSV format only
          </span>

          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={loading}
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];

              if (selectedFile) {
                uploadDataset(selectedFile);
              }

              event.target.value = "";
            }}
          />
        </label>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-600">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {hasData && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="shrink-0 text-emerald-500" />

              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${primaryText}`}>
                  {fileName}
                </p>

                <p className={`text-xs ${mutedText}`}>
                  {data.length.toLocaleString()} records successfully loaded
                </p>
              </div>
            </div>

            <button
              onClick={clearDataset}
              title="Remove dataset"
              className="flex shrink-0 items-center justify-center gap-2 self-end rounded-lg p-2 text-red-500 transition hover:bg-red-500/10 sm:self-auto"
            >
              <Trash2 size={18} />
              <span className="text-xs font-medium">Remove</span>
            </button>
          </div>
        )}
      </div>

      {/* DATASET STATISTICS */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`${panel} p-5 transition hover:-translate-y-1 hover:shadow-md`}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <Icon className="text-violet-500" size={21} />
                  </div>

                  <p className={`text-sm ${mutedText}`}>
                    {item.label}
                  </p>

                  <p className={`mt-2 text-2xl font-bold ${primaryText}`}>
                    {item.value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* DATASET PREVIEW */}
          <div className={`${panel} overflow-hidden`}>
            <div className="border-b border-[var(--border-color)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className={`font-semibold ${primaryText}`}>
                    Dataset Preview
                  </h2>

                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Showing the first 10 records
                  </p>
                </div>

                <span className="rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-500">
                  {data.length.toLocaleString()} rows
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--surface-secondary)]">
                  <tr>
                    <th className={`whitespace-nowrap px-5 py-4 ${mutedText}`}>
                      #
                    </th>

                    {columns.map((column) => (
                      <th
                        key={column}
                        className={`whitespace-nowrap px-5 py-4 font-semibold ${primaryText}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.slice(0, 10).map((row, index) => (
                    <tr
                      key={index}
                      className="border-t border-[var(--border-color)] transition hover:bg-[var(--surface-hover)]"
                    >
                      <td className={`px-5 py-4 ${mutedText}`}>
                        {index + 1}
                      </td>

                      {columns.map((column) => (
                        <td
                          key={column}
                          className={`whitespace-nowrap px-5 py-4 ${mutedText}`}
                        >
                          {row[column] === null ||
                          row[column] === undefined ||
                          row[column] === ""
                            ? "—"
                            : String(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* EMPTY STATE */}
      {!hasData && (
        <div className={`${panel} p-10 text-center`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
            <Database size={32} className="text-violet-500" />
          </div>

          <h3 className={`font-semibold ${primaryText}`}>
            No dataset loaded
          </h3>

          <p className={`mt-2 text-sm ${mutedText}`}>
            Upload a CSV file to begin exploring your business data.
          </p>
        </div>
      )}
    </div>
  );
}

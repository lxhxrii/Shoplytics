
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

import Papa from "papaparse";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [datasetSource, setDatasetSource] = useState("");

  const processDataset = (results, name, source) => {
    const cleanedData = results.data.filter((row) =>
      Object.values(row).some(
        (value) => String(value ?? "").trim() !== ""
      )
    );

    if (!results.meta.fields?.length || cleanedData.length === 0) {
      setError("The dataset contains no usable records.");
      setLoading(false);
      return;
    }

    setData(cleanedData);
    setColumns(results.meta.fields);
    setFileName(name);
    setDatasetSource(source);
    setError(
      results.errors.length > 0
        ? `${results.errors.length} CSV parsing warning(s) detected.`
        : ""
    );
    setLoading(false);
  };

  // Automatically load the default Superstore dataset
  useEffect(() => {
    Papa.parse("/data/superstore.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),

      complete: (results) => {
        processDataset(
          results,
          "superstore.csv",
          "Default Superstore Dataset"
        );
      },

      error: (parseError) => {
        setError(
          "Unable to load the default dataset. Check public/data/superstore.csv."
        );
        setLoading(false);
      },
    });
  }, []);

  // Upload a custom CSV dataset
  const uploadDataset = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setLoading(true);
    setError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),

      complete: (results) => {
        processDataset(results, file.name, "User Uploaded Dataset");
      },

      error: (parseError) => {
        setError(parseError.message || "Unable to read the CSV file.");
        setLoading(false);
      },
    });
  };

  const clearDataset = () => {
    setData([]);
    setColumns([]);
    setFileName("");
    setDatasetSource("");
    setError("");
  };

  const value = useMemo(
    () => ({
      data,
      columns,
      fileName,
      loading,
      error,
      datasetSource,
      uploadDataset,
      clearDataset,
      hasData: data.length > 0,
    }),
    [data, columns, fileName, loading, error, datasetSource]
  );

  return (
    <DatasetContext.Provider value={value}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);

  if (!context) {
    throw new Error(
      "useDataset must be used inside DatasetProvider."
    );
  }

  return context;
}

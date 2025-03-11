import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import ParallelCoordinatesPlot from "./ParallelCoordinatesPlot";
import Dendrogram from "./Dendrogram";
import DataTable from "./DataTable";
import DataStatistics from "./DataStatistics";
import DataDistribution from "./DataDistribution";
import ScatterPlot from "./ScatterPlot";
import "../styles/DataDashboard.css";

const DataDashboard = () => {
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState([]);

  // Memoize the filtered data to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    if (!data) return null;
    return data.map(row => 
      row.map(value => {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      })
    );
  }, [data]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Clear existing data first
    setData(null);
    setHeaders([]);

    Papa.parse(file, {
      complete: (result) => {
        const parsedData = result.data;
        if (parsedData.length < 2) return;
        
        setHeaders(parsedData[0]);
        const rows = parsedData.slice(1).filter(row => row.length === parsedData[0].length);
        setData(rows);
        
        // Reset the file input
        event.target.value = '';
      },
      header: false,
      worker: true, // Use web worker for parsing
      skipEmptyLines: true, // Skip empty lines
      dynamicTyping: true, // Automatically convert numbers
      fastMode: true, // Use fast mode for homogeneous data
    });
  };

  return (
    <div className="dashboard-container">
      <h2>CSV File Uploader</h2>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileUpload} 
        className="file-upload"
        key="file-input"
      />
      
      {processedData && (
        <div className="dashboard-content">
          <DataStatistics key="stats" data={processedData} headers={headers} />
          <DataDistribution key="dist" data={processedData} />
          <ScatterPlot key="scatter" data={processedData} headers={headers} />
          <ParallelCoordinatesPlot key="parallel" data={processedData} headers={headers} />
          <Dendrogram key="dendro" data={processedData} headers={headers} />
          <DataTable key="table" data={processedData} headers={headers} />
        </div>
      )}
    </div>
  );
};

export default DataDashboard; 
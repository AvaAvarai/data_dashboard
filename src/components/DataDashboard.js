import React, { useState } from "react";
import Papa from "papaparse";
import ParallelCoordinatesPlot from "./ParallelCoordinatesPlot";
import Dendrogram from "./Dendrogram";
import DataTable from "./DataTable";
import "../styles/DataDashboard.css";

const DataDashboard = () => {
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const parsedData = result.data;
        if (parsedData.length < 2) return;
        
        setHeaders(parsedData[0]);
        const rows = parsedData.slice(1).filter(row => row.length === parsedData[0].length);
        setData(rows);
      },
      header: false,
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
      />
      
      {data && (
        <div className="dashboard-content">
          <ParallelCoordinatesPlot data={data} headers={headers} />
          <Dendrogram data={data} headers={headers} />
          <DataTable data={data} headers={headers} />
        </div>
      )}
    </div>
  );
};

export default DataDashboard; 
import React, { useState } from "react";
import Papa from "papaparse";

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
    <div>
      <h2>CSV File Uploader</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {data && (
        <div>
          <h3>Data Preview</h3>
          <table border="1">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && <p>Showing 10 of {data.length} rows</p>}
        </div>
      )}
    </div>
  );
};

export default DataDashboard;

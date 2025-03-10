import React from "react";
import "../styles/DataTable.css";

const DataTable = ({ data, headers }) => {
  if (!data || !data.length || !headers || !headers.length) {
    return null;
  }

  return (
    <div className="data-table-container">
      <h3>Data Preview</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="data-info">Showing all {data.length} rows</p>
    </div>
  );
};

export default DataTable; 
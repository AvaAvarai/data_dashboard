import React, { useState, useMemo } from "react";
import "../styles/DataTable.css";

const DataTable = ({ data, headers }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  // Early validation check
  const isDataValid = data && data.length && headers && headers.length;

  // Move useMemo before any conditional returns to follow React Hooks rules
  const sortedData = useMemo(() => {
    if (!isDataValid) return [];
    
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const columnIndex = headers.indexOf(sortConfig.key);
        
        // Handle numeric values
        if (!isNaN(a[columnIndex]) && !isNaN(b[columnIndex])) {
          return sortConfig.direction === 'ascending' 
            ? parseFloat(a[columnIndex]) - parseFloat(b[columnIndex])
            : parseFloat(b[columnIndex]) - parseFloat(a[columnIndex]);
        }
        
        // Handle string values
        if (a[columnIndex] < b[columnIndex]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[columnIndex] > b[columnIndex]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig, headers, isDataValid]);

  // Return early after hooks are called
  if (!isDataValid) {
    return null;
  }

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (header) => {
    if (sortConfig.key !== header) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  return (
    <div className="data-table-container">
      <h3>Data Table</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  onClick={() => requestSort(header)}
                  style={{ cursor: 'pointer' }}
                >
                  {header}{getSortIndicator(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
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
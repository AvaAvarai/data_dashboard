import React, { useState, useEffect } from 'react';

const DataStatistics = ({ data, headers }) => {
  // Calculate statistics
  const numCases = data.length;
  
  // Calculate ranges for each attribute and identify the first N/A column
  let defaultClassColumnIndex = -1;
  const ranges = headers.map((header, index) => {
    const values = data.map(row => parseFloat(row[index]));
    const validValues = values.filter(val => !isNaN(val));
    
    if (validValues.length === 0) {
      if (defaultClassColumnIndex === -1) {
        defaultClassColumnIndex = index; // Mark the first N/A column as the class column
      }
      return { min: 'N/A', max: 'N/A' };
    }
    
    return {
      min: Math.min(...validValues),
      max: Math.max(...validValues)
    };
  });
  
  // If no N/A column was found, default to the last column
  if (defaultClassColumnIndex === -1) {
    defaultClassColumnIndex = headers.length - 1;
  }
  
  // State for the selected class column
  const [classColumnIndex, setClassColumnIndex] = useState(defaultClassColumnIndex);
  
  // Count N/A columns (columns where all values are NaN)
  const naColumns = ranges.filter(range => range.min === 'N/A' && range.max === 'N/A').length;
  
  // Calculate actual number of attributes excluding N/A columns
  const numAttributes = headers.length - naColumns;

  // Count unique values in the class column
  const classColumn = data.map(row => row[classColumnIndex]);
  const uniqueClasses = [...new Set(classColumn)];
  const numClasses = uniqueClasses.length;

  // Handle class column change
  const handleClassColumnChange = (e) => {
    setClassColumnIndex(parseInt(e.target.value));
  };

  // Class column getter - expose the current class column index via a data attribute
  useEffect(() => {
    const statisticsContainer = document.querySelector('.statistics-container');
    if (statisticsContainer) {
      statisticsContainer.dataset.classColumnIndex = classColumnIndex;
    }
  }, [classColumnIndex]);

  // Public method to get the current class column index
  DataStatistics.getClassColumnIndex = () => {
    return classColumnIndex;
  };

  return (
    <div className="statistics-container">
      <h3>Dataset Statistics</h3>
      <div className="statistics-grid">
        <div className="stat-item">
          <strong>Number of Cases:</strong> {numCases}
        </div>
        <div className="stat-item">
          <strong>Number of Attributes:</strong> {numAttributes}
        </div>
        <div className="stat-item">
          <strong>Number of Classes:</strong> {numClasses}
        </div>
        <div className="stat-item">
          <strong>Class Column:</strong>
          <select 
            value={classColumnIndex}
            onChange={handleClassColumnChange}
            style={{ marginLeft: '10px', padding: '4px' }}
          >
            {headers.map((header, index) => (
              <option key={index} value={index}>
                {header}
              </option>
            ))}
          </select>
        </div>
        <div className="stat-item attribute-ranges">
          <strong>Attribute Ranges:</strong>
          <ul>
            {headers.map((header, index) => (
              ranges[index].min !== 'N/A' && ranges[index].max !== 'N/A' && (
                <li key={header}>
                  {header}: {ranges[index].min} to {ranges[index].max}
                </li>
              )
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataStatistics; 
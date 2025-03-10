import React from 'react';

const DataStatistics = ({ data, headers }) => {
  // Calculate statistics
  const numCases = data.length;
  const numAttributes = headers.length;

  // Calculate ranges for each attribute
  const ranges = headers.map((header, index) => {
    const values = data.map(row => parseFloat(row[index]));
    const validValues = values.filter(val => !isNaN(val));
    
    if (validValues.length === 0) return { min: 'N/A', max: 'N/A' };
    
    return {
      min: Math.min(...validValues),
      max: Math.max(...validValues)
    };
  });

  // Count unique values in the last column (assuming it's the class)
  const classColumn = data.map(row => row[row.length - 1]);
  const uniqueClasses = [...new Set(classColumn)];
  const numClasses = uniqueClasses.length;

  // Calculate cases per class
  const casesPerClass = uniqueClasses.reduce((acc, className) => {
    acc[className] = classColumn.filter(c => c === className).length;
    return acc;
  }, {});

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
          <strong>Attribute Ranges:</strong>
          <ul>
            {headers.map((header, index) => (
              <li key={header}>
                {header}: {ranges[index].min} to {ranges[index].max}
              </li>
            ))}
          </ul>
        </div>
        <div className="stat-item">
          <strong>Cases per Class:</strong>
          <ul>
            {Object.entries(casesPerClass).map(([className, count]) => (
              <li key={className}>
                {className}: {count} cases
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataStatistics; 
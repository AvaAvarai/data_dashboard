import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import * as d3 from "d3";
import "./App.css";

const ParallelCoordinatesPlot = ({ data, headers }) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!data || !data.length || !headers || !headers.length) return;
    
    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Convert data to numeric values where possible
    const numericData = data.map(row => {
      return row.map((value, i) => {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      });
    });
    
    // Determine which columns are numeric
    const numericColumns = headers.map((header, i) => {
      return numericData.every(row => typeof row[i] === "number");
    });
    
    // Filter to only use numeric columns for the parallel coordinates
    const numericHeaders = headers.filter((_, i) => numericColumns[i]);
    
    // If no numeric columns, show a message
    if (numericHeaders.length === 0) {
      d3.select(svgRef.current)
        .append("text")
        .attr("x", 10)
        .attr("y", 30)
        .text("No numeric columns found for parallel coordinates visualization");
      return;
    }
    
    // Setup dimensions
    const margin = { top: 30, right: 50, bottom: 10, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales for each dimension
    const y = {};
    numericHeaders.forEach((header, i) => {
      const columnIndex = headers.indexOf(header);
      const values = numericData.map(d => d[columnIndex]);
      y[header] = d3.scaleLinear()
        .domain(d3.extent(values))
        .range([height, 0]);
    });
    
    // Create x scale for dimensions
    const x = d3.scalePoint()
      .range([0, width])
      .domain(numericHeaders);
    
    // Add axis for each dimension
    numericHeaders.forEach(header => {
      svg.append("g")
        .attr("transform", `translate(${x(header)},0)`)
        .call(d3.axisLeft(y[header]))
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(header)
        .style("fill", "black");
    });
    
    // Add lines
    const line = d3.line()
      .defined(d => d !== null)
      .x(d => d.x)
      .y(d => d.y);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    numericData.forEach((row, i) => {
      const lineData = [];
      
      numericHeaders.forEach((header, j) => {
        const columnIndex = headers.indexOf(header);
        const value = row[columnIndex];
        
        if (typeof value === "number") {
          lineData.push({
            x: x(header),
            y: y[header](value)
          });
        } else {
          lineData.push(null); // Handle non-numeric values
        }
      });
      
      svg.append("path")
        .datum(lineData)
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", colorScale(i % 10))
        .style("opacity", 0.5)
        .style("stroke-width", 1.5);
    });
    
  }, [data, headers]);
  
  return (
    <div className="parallel-plot-container">
      <h3>Parallel Coordinates Plot</h3>
      <p>This visualization shows relationships between numeric dimensions in your data</p>
      <svg ref={svgRef}></svg>
    </div>
  );
};

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
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {data && (
        <div>
          <ParallelCoordinatesPlot data={data} headers={headers} />
          
          <h3>Data Preview</h3>
          <div className="table-container">
            <table border="1">
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
          <p>Showing all {data.length} rows</p>
        </div>
      )}
    </div>
  );
};

export default DataDashboard;

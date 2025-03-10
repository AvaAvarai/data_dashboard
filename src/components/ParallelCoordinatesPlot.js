import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { useFullscreen } from "../hooks/useFullscreen";
import { useDimensions } from "../hooks/useDimensions";
import "../styles/ParallelCoordinatesPlot.css";

const ParallelCoordinatesPlot = ({ data, headers }) => {
  const svgRef = useRef(null);
  const plotContainerRef = useRef(null);
  const [classColumn, setClassColumn] = useState(null);
  const [normalized, setNormalized] = useState(false);
  
  // Use custom hooks for fullscreen and dimensions
  const { isFullscreen, toggleFullscreen } = useFullscreen(plotContainerRef);
  const dimensions = useDimensions(plotContainerRef, isFullscreen);
  
  // Create the visualization using D3
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
  
    if (numericHeaders.length === 0) {
      d3.select(svgRef.current)
        .append("text")
        .attr("x", 10)
        .attr("y", 30)
        .text("No numeric columns found for parallel coordinates visualization");
      return;
    }
  
    // Setup dimensions
    const margin = { top: 30, right: isFullscreen ? 180 : 120, bottom: 20, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;
  
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Find the global min/max across all numeric values
    const allNumericValues = numericHeaders.flatMap(header => {
      const columnIndex = headers.indexOf(header);
      return numericData.map(row => row[columnIndex]);
    });
  
    const globalMin = d3.min(allNumericValues);
    const globalMax = d3.max(allNumericValues);
  
    // Create scales for each dimension
    const y = {};
    numericHeaders.forEach(header => {
      const columnIndex = headers.indexOf(header);
      const values = numericData.map(row => row[columnIndex]);
  
      if (normalized) {
        // Min-max normalization per column
        y[header] = d3.scaleLinear()
          .domain(d3.extent(values)) // Min-max per column
          .range([height, 0]);
      } else {
        // Global raw scale (same for all columns)
        y[header] = d3.scaleLinear()
          .domain([globalMin, globalMax]) // Global min-max
          .range([height, 0]);
      }
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
  
    // For class-based coloring
    let classValues = [];
    let classColorScale;
  
    if (classColumn !== null) {
      const classColumnIndex = headers.indexOf(classColumn);
      classValues = [...new Set(data.map(row => row[classColumnIndex]))];
      classColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(classValues);
    } else {
      classColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    }
  
    // Add lines
    const line = d3.line()
      .defined(d => d !== null)
      .x(d => d.x)
      .y(d => d.y);
  
    numericData.forEach((row, i) => {
      const lineData = numericHeaders.map(header => {
        const columnIndex = headers.indexOf(header);
        const value = row[columnIndex];
        return typeof value === "number" ? { x: x(header), y: y[header](value) } : null;
      });
  
      const lineColor = classColumn !== null
        ? classColorScale(row[headers.indexOf(classColumn)])
        : classColorScale(i % 10);
  
      svg.append("path")
        .datum(lineData)
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", lineColor)
        .style("opacity", 0.7)
        .style("stroke-width", isFullscreen ? 2 : 1.5);
    });
  
  }, [data, headers, classColumn, dimensions, isFullscreen, normalized]);
  
  const handleClassColumnChange = (e) => {
    setClassColumn(e.target.value === "none" ? null : e.target.value);
  };
  
  const toggleNormalization = () => {
    setNormalized(!normalized);
  };
  
  return (
    <div className={`parallel-plot-container ${isFullscreen ? 'fullscreen' : ''}`} ref={plotContainerRef}>
      <div className="plot-header">
        <h3>Parallel Coordinates Plot</h3>
        <div className="plot-controls">
          <label htmlFor="class-select">Color by class: </label>
          <select 
            id="class-select" 
            onChange={handleClassColumnChange}
            value={classColumn || "none"}
          >
            <option value="none">-- No class selected --</option>
            {headers.map((header, i) => (
              <option key={i} value={header}>{header}</option>
            ))}
          </select>
          <button 
            onClick={toggleNormalization}
            className="normalize-btn"
          >
            {normalized ? "Use Actual Values" : "Normalize Values"}
          </button>
          <button 
            className="fullscreen-btn" 
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>
      <p>This visualization shows relationships between numeric dimensions in your data</p>
      <div className="svg-container">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default ParallelCoordinatesPlot;

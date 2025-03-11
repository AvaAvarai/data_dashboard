import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

  // Memoize numeric data processing
  const { numericHeaders } = useMemo(() => {
    if (!data || !data.length || !headers || !headers.length) {
      return { numericHeaders: [] };
    }

    const numericColumns = headers.map((_, i) => {
      return data.every(row => typeof row[i] === "number");
    });

    const numericHeaders = headers.filter((_, i) => numericColumns[i]);

    return { numericHeaders };
  }, [data, headers]);

  // Memoize scales and color calculations
  const { y, x, classColorScale, classValues } = useMemo(() => {
    if (numericHeaders.length === 0) return {};

    const allNumericValues = numericHeaders.flatMap(header => {
      const columnIndex = headers.indexOf(header);
      return data.map(row => row[columnIndex]);
    });

    const globalMin = d3.min(allNumericValues);
    const globalMax = d3.max(allNumericValues);

    // Create scales for each dimension
    const y = {};
    numericHeaders.forEach(header => {
      const columnIndex = headers.indexOf(header);
      const values = data.map(row => row[columnIndex]);

      if (normalized) {
        y[header] = d3.scaleLinear()
          .domain(d3.extent(values))
          .range([dimensions.height, 0]);
      } else {
        y[header] = d3.scaleLinear()
          .domain([globalMin, globalMax])
          .range([dimensions.height, 0]);
      }
    });

    const x = d3.scalePoint()
      .range([0, dimensions.width])
      .domain(numericHeaders);

    let classValues = [];
    let classColorScale;

    if (classColumn !== null) {
      const classColumnIndex = headers.indexOf(classColumn);
      classValues = [...new Set(data.map(row => row[classColumnIndex]))];
      classColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(classValues);
    } else {
      classColorScale = d3.scaleOrdinal(d3.schemeCategory10);
      classValues = Array.from({length: 10}, (_, i) => `Group ${i + 1}`);
    }

    return { y, x, classColorScale, classValues };
  }, [numericHeaders, headers, data, normalized, classColumn, dimensions]);

  // Memoize line generator
  const line = useMemo(() => {
    return d3.line()
      .defined(d => d !== null)
      .x(d => d.x)
      .y(d => d.y);
  }, []);

  // Create the visualization using D3
  useEffect(() => {
    if (!data?.length || !headers?.length || !numericHeaders.length) return;

    const margin = { 
      top: 20, 
      right: 30,
      bottom: 20, 
      left: 50 
    };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

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

    // Prepare line data
    const lineData = data.map((row, i) => {
      const points = numericHeaders.map(header => {
        const columnIndex = headers.indexOf(header);
        const value = row[columnIndex];
        return typeof value === "number" ? { x: x(header), y: y[header](value) } : null;
      });

      return {
        points,
        color: classColumn !== null
          ? classColorScale(row[headers.indexOf(classColumn)])
          : classColorScale(i % 10)
      };
    });

    // Add lines using efficient join pattern
    svg.selectAll("path.line")
      .data(lineData)
      .join("path")
      .attr("class", "line")
      .attr("d", d => line(d.points))
      .style("fill", "none")
      .style("stroke", d => d.color)
      .style("opacity", 0.7)
      .style("stroke-width", isFullscreen ? 2 : 1.5);

  }, [data, headers, numericHeaders, dimensions, isFullscreen, x, y, line, classColumn, classColorScale, classValues]);

  const handleClassColumnChange = useCallback((e) => {
    setClassColumn(e.target.value === "none" ? null : e.target.value);
  }, []);

  const toggleNormalization = useCallback(() => {
    setNormalized(prev => !prev);
  }, []);

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
      <div className="visualization-container">
        <div className="svg-container">
          <svg ref={svgRef}></svg>
        </div>
        <div className="legend-container">
          <h4>{classColumn ? "Classes" : "Color Groups"}</h4>
          {classValues.map((value, i) => (
            <div key={i} className="legend-item">
              <span 
                className="legend-color" 
                style={{
                  backgroundColor: classColorScale(classColumn ? value : i),
                  opacity: 0.7
                }}
              />
              <span className="legend-label">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParallelCoordinatesPlot;

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { useFullscreen } from "../hooks/useFullscreen";
import { useDimensions } from "../hooks/useDimensions";
import "../styles/ParallelCoordinatesPlot.css";

const ParallelCoordinatesPlot = ({ data, headers }) => {
  const svgRef = useRef(null);
  const plotContainerRef = useRef(null);
  const [normalized, setNormalized] = useState(false);
  const [classColumn, setClassColumn] = useState(null);
  
  // Use custom hooks for fullscreen and dimensions
  const { isFullscreen, toggleFullscreen } = useFullscreen(plotContainerRef);
  const dimensions = useDimensions(plotContainerRef, isFullscreen);

  // Memoize numeric data processing
  const { numericHeaders } = useMemo(() => {
    if (!data || !data.length || !headers || !headers.length) {
      return { numericHeaders: [], nonNumericHeaders: [] };
    }

    const numericColumns = headers.map((_, i) => {
      return data.every(row => typeof row[i] === "number");
    });

    const numericHeaders = headers.filter((_, i) => numericColumns[i]);

    return { numericHeaders };
  }, [data, headers]);

  // Update the useEffect to use a more reliable way to get class column changes
  useEffect(() => {
    const handleClassColumnChange = (event) => {
      const statisticsContainer = event.target;
      if (!statisticsContainer) return;  // Add guard clause
      
      const newClassColumnIndex = parseInt(statisticsContainer.dataset.classColumnIndex);
      if (!isNaN(newClassColumnIndex) && headers[newClassColumnIndex]) {
        setClassColumn(headers[newClassColumnIndex]);
      }
    };

    // Wait for DOM to be ready
    const initializeObserver = () => {
      const statisticsContainer = document.querySelector('.statistics-container');
      if (!statisticsContainer) {
        // If container isn't found, try again in a short while
        setTimeout(initializeObserver, 100);
        return;
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-class-column-index') {
            handleClassColumnChange({ target: mutation.target });
          }
        });
      });

      observer.observe(statisticsContainer, {
        attributes: true,
        attributeFilter: ['data-class-column-index']
      });

      // Initial setup
      handleClassColumnChange({ target: statisticsContainer });

      return () => observer.disconnect();
    };

    initializeObserver();
  }, [headers]);

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

    // Extract unique class values if a class column is selected
    let classValues = [];
    if (classColumn) {
      const columnIndex = headers.indexOf(classColumn);
      classValues = Array.from(new Set(data.map(row => row[columnIndex])));
    } else {
      classValues = Array.from({length: 10}, (_, i) => `Group ${i + 1}`);
    }

    const classColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(classValues);

    return { y, x, classColorScale, classValues };
  }, [numericHeaders, headers, data, normalized, dimensions, classColumn]);

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

    // Get the container dimensions
    const containerWidth = svgRef.current.parentNode.clientWidth;
    const containerHeight = svgRef.current.parentNode.clientHeight;

    const margin = { 
      top: 40,  // More space for labels
      right: 40,
      bottom: 40,
      left: 60  // More space for axis labels
    };

    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Update scale ranges to use new dimensions
    x.range([0, width]);
    Object.values(y).forEach(scale => scale.range([height, 0]));

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
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

      // Determine color based on class column if available
      let color;
      if (classColumn) {
        const classIndex = headers.indexOf(classColumn);
        const classValue = row[classIndex];
        color = classColorScale(classValue);
      } else {
        color = classColorScale(i % 10);
      }

      return {
        points,
        color
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

  }, [data, headers, numericHeaders, dimensions, isFullscreen, x, y, line, classColorScale, classValues, classColumn]);

  const toggleNormalization = useCallback(() => {
    setNormalized(prev => !prev);
  }, []);

  return (
    <div className={`parallel-plot-container ${isFullscreen ? 'fullscreen' : ''}`} ref={plotContainerRef}>
      <div className="plot-header">
        <h3>Parallel Coordinates Plot</h3>
        <div className="plot-controls">
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
          <h4>{classColumn ? `Colors by ${classColumn}` : 'Color Groups'}</h4>
          {classValues.map((value, i) => (
            <div key={i} className="legend-item">
              <span 
                className="legend-color" 
                style={{
                  backgroundColor: classColorScale(value),
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

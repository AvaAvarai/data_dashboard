import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/ScatterPlot.css';
import { getColorScale } from '../utils/colorScales';

const ScatterPlot = ({ data, headers }) => {
  const [xAttribute, setXAttribute] = useState(headers[0]);
  const [yAttribute, setYAttribute] = useState(headers[1]);
  const plotRef = useRef();

  useEffect(() => {
    if (!plotRef.current || !xAttribute || !yAttribute) return;

    // Clear any existing chart
    d3.select(plotRef.current).selectAll("*").remove();

    // Get indices for selected attributes
    const xIndex = headers.indexOf(xAttribute);
    const yIndex = headers.indexOf(yAttribute);
    const classIndex = headers.length - 1; // Assuming last column is class

    // Convert string values to numbers and create point objects
    const points = data.map(row => ({
      x: parseFloat(row[xIndex]),
      y: parseFloat(row[yIndex]),
      class: row[classIndex]
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    // Set up dimensions
    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 80, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([d3.min(points, d => d.x), d3.max(points, d => d.x)])
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([d3.min(points, d => d.y), d3.max(points, d => d.y)])
      .range([innerHeight, 0])
      .nice();

    // Get unique classes and use shared color scale
    const uniqueClasses = [...new Set(points.map(d => d.class))];
    const colorScale = getColorScale(uniqueClasses);

    // Create SVG
    const svg = d3.select(plotRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create main group and translate it to account for margins
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text(xAttribute);

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text(yAttribute);

    // Add scatter points
    g.selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 5)
      .attr('fill', d => colorScale(d.class))
      .attr('opacity', 0.7);

  }, [data, headers, xAttribute, yAttribute]);

  // Get unique classes for the legend using shared color scale
  const uniqueClasses = [...new Set(data.map(row => row[headers.length - 1]))];
  const colorScale = getColorScale(uniqueClasses);

  return (
    <div className="scatter-plot-container">
      <h3>Attribute Relationship</h3>
      <div className="controls">
        <div className="select-group">
          <label>X Axis:</label>
          <select 
            value={xAttribute} 
            onChange={(e) => setXAttribute(e.target.value)}
          >
            {headers.slice(0, -1).map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>
        <div className="select-group">
          <label>Y Axis:</label>
          <select 
            value={yAttribute} 
            onChange={(e) => setYAttribute(e.target.value)}
          >
            {headers.slice(0, -1).map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="visualization-container">
        <div className="plot-container" ref={plotRef}></div>
        <div className="legend-container">
          <h4>Classes</h4>
          {uniqueClasses.map((value, i) => (
            <div key={i} className="legend-item">
              <span 
                className="legend-color" 
                style={{
                  backgroundColor: colorScale(value),
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

export default ScatterPlot; 
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/ScatterPlot.css';

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
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
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

    // Create color scale for classes
    const uniqueClasses = [...new Set(points.map(d => d.class))];
    const colorScale = d3.scaleOrdinal()
      .domain(uniqueClasses)
      .range(['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f']);

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

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

    uniqueClasses.forEach((className, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', colorScale(className));
      
      legendRow.append('text')
        .attr('x', 10)
        .attr('y', 4)
        .text(className)
        .style('font-size', '12px');
    });

  }, [data, headers, xAttribute, yAttribute]);

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
      <div className="plot-container" ref={plotRef}></div>
    </div>
  );
};

export default ScatterPlot; 
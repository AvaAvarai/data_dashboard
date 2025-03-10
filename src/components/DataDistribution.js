import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/DataDistribution.css';

const DataDistribution = ({ data }) => {
  const pieChartRef = useRef();

  // Count unique values in the last column (assuming it's the class)
  const classColumn = data.map(row => row[row.length - 1]);
  const uniqueClasses = [...new Set(classColumn)];

  // Calculate cases per class
  const casesPerClass = uniqueClasses.reduce((acc, className) => {
    acc[className] = classColumn.filter(c => c === className).length;
    return acc;
  }, {});

  useEffect(() => {
    if (!pieChartRef.current) return;

    // Clear any existing chart
    d3.select(pieChartRef.current).selectAll("*").remove();

    // Set up dimensions with extra padding for labels
    const width = 500;  // Increased from 400
    const height = 500; // Increased from 400
    const margin = {
      top: 50,
      right: 120,
      bottom: 50,
      left: 120
    };
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(uniqueClasses)
      .range(['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f']);

    // Create SVG
    const svg = d3.select(pieChartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie chart data
    const pie = d3.pie()
      .value(d => d[1])
      .sort(null);

    const data_ready = pie(Object.entries(casesPerClass));

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Create outer arc for labels
    const outerArc = d3.arc()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);

    // Add the arcs
    const paths = svg.selectAll('path')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data[0]))
      .attr('stroke', 'white')
      .style('stroke-width', '2px');

    // Add percentage calculation
    const total = Object.values(casesPerClass).reduce((a, b) => a + b, 0);

    // Add labels with background
    const labelGroups = svg.selectAll('g.label')
      .data(data_ready)
      .join('g')
      .attr('class', 'label')
      .attr('transform', d => {
        const pos = outerArc.centroid(d);
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 1.2 * (midangle < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      });

    // Add text background for better readability
    labelGroups.append('rect')
      .attr('class', 'label-background')
      .attr('x', d => {
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midangle < Math.PI ? 5 : -105;
      })
      .attr('y', -20)
      .attr('width', 100)
      .attr('height', 40)
      .attr('fill', 'white')
      .attr('fill-opacity', 0.8)
      .attr('rx', 4);

    // Add class names
    labelGroups.append('text')
      .attr('x', d => {
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midangle < Math.PI ? 10 : -10;
      })
      .style('text-anchor', d => {
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midangle < Math.PI ? 'start' : 'end';
      })
      .attr('y', -5)
      .text(d => `${d.data[0]}`);

    // Add values with percentages
    labelGroups.append('text')
      .attr('x', d => {
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midangle < Math.PI ? 10 : -10;
      })
      .style('text-anchor', d => {
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midangle < Math.PI ? 'start' : 'end';
      })
      .attr('y', 15)
      .text(d => `${d.data[1]} (${((d.data[1] / total) * 100).toFixed(1)}%)`);

    // Add polylines between arcs and labels
    svg.selectAll('polyline')
      .data(data_ready)
      .join('polyline')
      .attr('stroke', 'black')
      .style('fill', 'none')
      .attr('stroke-width', 1)
      .attr('points', d => {
        const posA = arc.centroid(d);
        const posB = outerArc.centroid(d);
        const posC = outerArc.centroid(d);
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        posC[0] = radius * 1.2 * (midangle < Math.PI ? 1 : -1);
        return [posA, posB, posC];
      });

  }, [casesPerClass, uniqueClasses]);

  return (
    <div className="distribution-container">
      <h3>Data Distribution</h3>
      <div className="distribution-content">
        <div className="pie-chart-section">
          <div ref={pieChartRef} className="pie-chart"></div>
        </div>
        <div className="distribution-stats">
          <h4>Class Distribution Summary</h4>
          <ul>
            {Object.entries(casesPerClass).map(([className, count]) => (
              <li key={className}>
                <span className="class-name">{className}:</span>
                <span className="class-count">{count} cases</span>
                <span className="class-percentage">
                  ({((count / data.length) * 100).toFixed(1)}%)
                </span>
              </li>
            ))}
          </ul>
          <p className="total-cases">Total Cases: {data.length}</p>
        </div>
      </div>
    </div>
  );
};

export default DataDistribution; 
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import '../styles/Dendrogram.css';

const Dendrogram = ({ data, headers }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedMetric, setSelectedMetric] = useState('euclidean');
  const [selectedLinkage, setSelectedLinkage] = useState('ward');

  // Move helper functions inside useCallback to properly handle dependencies
  const getAllLeaves = useCallback((node) => {
    if (!node.children || node.children.length === 0) {
      return [node.id];
    }
    return node.children.flatMap(getAllLeaves);
  }, []);

  const calculateWardLinkage = useCallback((clusterI, clusterJ, distances) => {
    let sum = 0;
    let count = 0;
    for (let i of clusterI) {
      for (let j of clusterJ) {
        sum += Math.pow(distances[i][j], 2);
        count++;
      }
    }
    return Math.sqrt(sum / count);
  }, []);

  const calculateCompleteLinkage = useCallback((clusterI, clusterJ, distances) => {
    const leavesI = getAllLeaves(clusterI);
    const leavesJ = getAllLeaves(clusterJ);
    let maxDist = -Infinity;
    for (let i of leavesI) {
      for (let j of leavesJ) {
        maxDist = Math.max(maxDist, distances[i][j]);
      }
    }
    return maxDist;
  }, [getAllLeaves]);

  const calculateSingleLinkage = useCallback((clusterI, clusterJ, distances) => {
    const leavesI = getAllLeaves(clusterI);
    const leavesJ = getAllLeaves(clusterJ);
    let minDist = Infinity;
    for (let i of leavesI) {
      for (let j of leavesJ) {
        minDist = Math.min(minDist, distances[i][j]);
      }
    }
    return minDist;
  }, [getAllLeaves]);

  useEffect(() => {
    if (!data || !data.length || !headers || !headers.length) return;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Convert data to numeric values and filter numeric columns
    const numericData = data.map(row => 
      row.map((value, i) => {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      })
    );

    const numericColumns = headers.map((_, i) => 
      numericData.every(row => typeof row[i] === "number")
    );

    const numericHeaders = headers.filter((_, i) => numericColumns[i]);
    const processedData = numericData.map(row => 
      row.filter((_, i) => numericColumns[i])
    );

    // Calculate distances between points
    const distances = [];
    for (let i = 0; i < processedData.length; i++) {
      distances[i] = [];
      for (let j = 0; j < processedData.length; j++) {
        if (i === j) {
          distances[i][j] = 0;
          continue;
        }
        
        let distance = 0;
        if (selectedMetric === 'euclidean') {
          distance = Math.sqrt(
            processedData[i].reduce((sum, val, k) => 
              sum + Math.pow(val - processedData[j][k], 2), 0
            )
          );
        } else if (selectedMetric === 'manhattan') {
          distance = processedData[i].reduce((sum, val, k) => 
            sum + Math.abs(val - processedData[j][k]), 0
          );
        }
        distances[i][j] = distance;
      }
    }

    // Hierarchical clustering
    let clusters = processedData.map((_, i) => ({
      id: i,
      height: 0,
      children: [],
      data: data[i] // Store original data for labels
    }));

    while (clusters.length > 1) {
      let minDist = Infinity;
      let mergeI = 0;
      let mergeJ = 0;

      // Find closest clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          let dist;
          if (selectedLinkage === 'ward') {
            const clusterI = getAllLeaves(clusters[i]);
            const clusterJ = getAllLeaves(clusters[j]);
            dist = calculateWardLinkage(clusterI, clusterJ, distances);
          } else if (selectedLinkage === 'complete') {
            dist = calculateCompleteLinkage(clusters[i], clusters[j], distances);
          } else {
            dist = calculateSingleLinkage(clusters[i], clusters[j], distances);
          }

          if (dist < minDist) {
            minDist = dist;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Merge clusters
      const newCluster = {
        children: [clusters[mergeI], clusters[mergeJ]],
        height: minDist,
      };

      clusters = [
        ...clusters.slice(0, mergeI),
        ...clusters.slice(mergeI + 1, mergeJ),
        ...clusters.slice(mergeJ + 1),
        newCluster
      ];
    }

    // Draw dendrogram
    const margin = { top: 90, right: 30, bottom: 90, left: 90 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const cluster = d3.cluster()
      .size([width, height]); // Swap width and height for horizontal layout

    const root = d3.hierarchy(clusters[0]);
    cluster(root);

    // Draw links with rotated coordinates
    svg.selectAll('path.link')
      .data(root.descendants().slice(1))
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => `
        M${d.x},${d.y}
        C${d.x},${(d.y + d.parent.y) / 2}
        ${d.parent.x},${(d.y + d.parent.y) / 2}
        ${d.parent.x},${d.parent.y}
      `);

    // Draw nodes with rotated coordinates
    const node = svg.selectAll('g.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => 'node' + (d.children ? ' node--internal' : ' node--leaf'))
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Add circles to nodes
    node.append('circle')
      .attr('r', 2.5);

    // Add labels to leaf nodes with rotated text
    node.filter(d => !d.children)
      .append('text')
      .attr('dy', 3)
      .attr('x', 8)
      .style('text-anchor', 'start')
      .attr('transform', 'rotate(45)') // Rotate labels for better readability
      .text(d => {
        if (!d.data.data) return `Item ${d.data.id}`;
        const classValue = d.data.data[headers.indexOf(headers[headers.length - 1])];
        return `${classValue} (${d.data.id})`;
      })
      .append('title') // Add tooltip with full data
      .text(d => {
        if (!d.data.data) return '';
        return headers.map((h, i) => `${h}: ${d.data.data[i]}`).join('\n');
      });

  }, [data, headers, selectedMetric, selectedLinkage, getAllLeaves, calculateWardLinkage, calculateCompleteLinkage, calculateSingleLinkage]);

  return (
    <div className="dendrogram-container" ref={containerRef}>
      <h3>Hierarchical Clustering Dendrogram</h3>
      <p className="description">
        This dendrogram shows the hierarchical relationships between data points. 
        Similar items are grouped together, with the height of connections indicating the distance between clusters.
      </p>
      <div className="controls">
        <div className="control-group">
          <label htmlFor="metric-select">Distance Metric: </label>
          <select
            id="metric-select"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <option value="euclidean">Euclidean</option>
            <option value="manhattan">Manhattan</option>
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="linkage-select">Linkage Method: </label>
          <select
            id="linkage-select"
            value={selectedLinkage}
            onChange={(e) => setSelectedLinkage(e.target.value)}
          >
            <option value="ward">Ward</option>
            <option value="complete">Complete</option>
            <option value="single">Single</option>
          </select>
        </div>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Dendrogram; 
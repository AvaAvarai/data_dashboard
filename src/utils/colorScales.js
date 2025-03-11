import * as d3 from "d3";

// Create a singleton color scale that can be shared across components
let globalColorScale = null;

export const getColorScale = (domain) => {
  if (!globalColorScale || !arraysEqual(globalColorScale.domain(), domain)) {
    globalColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(domain);
  }
  return globalColorScale;
};

// Helper function to compare arrays
const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}; 
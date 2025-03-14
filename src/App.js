import React from "react";
import DataDashboard from "./components/DataDashboard";
import { version } from './version';
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header-minimal">
        <h1>Data Dashboard</h1>
      </header>
      <main>
        <DataDashboard />
      </main>
      <footer className="App-footer">
        <p>Created with React and D3.js | CWU-VKD-LAB MIT License 2025 | Version: {version}</p>
      </footer>
    </div>
  );
}

export default App;

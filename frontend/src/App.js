import React from "react";
import SkillsTable from "./SkillsTable";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Skills Dashboard</h1>
      </header>
      <main className="App-main">
        <SkillsTable />
      </main>
      <footer className="App-footer">
        <p>© 2024 Skills Dashboard</p>
      </footer>
    </div>
  );
}

export default App;

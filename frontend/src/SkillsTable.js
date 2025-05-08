import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SkillsTable.css";

const BACKEND_URL = "http://localhost:5001"; // Updated to match the backend port

function SkillsTable() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/skills`);
        setSkills(response.data);
        setError(null);
      } catch (err) {
        const errorMessage = err.response?.status === 404 
          ? "No skills data available on the server."
          : "Failed to fetch skills data. Please check if the server is running.";
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedSkills = React.useMemo(() => {
    if (!sortConfig.key) return skills;

    return [...skills].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [skills, sortConfig]);

  const filteredSkills = sortedSkills.filter(skill =>
    Object.values(skill).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading skills data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="no-data-container">
        <p>No skills data available.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>
      <div className="table-container">
        <table className="skills-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('Skill')}>
                Skill {getSortIcon('Skill')}
              </th>
              <th onClick={() => handleSort('Experience')}>
                Experience {getSortIcon('Experience')}
              </th>
              <th onClick={() => handleSort('Education')}>
                Education {getSortIcon('Education')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.map((item, index) => (
              <tr key={index}>
                <td>{item.Skill}</td>
                <td>{item.Experience}</td>
                <td>{item.Education}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSkills.length === 0 && (
          <div className="no-results">
            No matching skills found
          </div>
        )}
      </div>
      <div className="table-footer">
        <p>Showing {filteredSkills.length} of {skills.length} skills</p>
      </div>
    </div>
  );
}

export default SkillsTable;

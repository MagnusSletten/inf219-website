import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import logo from './logo.svg';

function App() {
  const IP = 'https://d9b4-2001-464a-61a0-0-19f2-c5e7-5526-bec8.ngrok-free.app/';
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("Upload your info.yaml file here");
  const [name, setName] = useState("");
  const [branches, setBranches] = useState([]); // State for branches
  const [selectedBranch, setSelectedBranch] = useState("main"); // Default to 'main'

  useEffect(() => {
    // Fetch branches from GitHub repository
    const fetchBranches = async () => {
      try {
        const response = await axios.get('https://api.github.com/repos/MagnusSletten/Databank/branches');
        const branchNames = response.data.map(branch => branch.name);
        setBranches(branchNames);

        // Set 'main' as the selected branch if it exists, otherwise default to the first branch
        if (branchNames.includes("main")) {
          setSelectedBranch("main");
        } else if (branchNames.length > 0) {
          setSelectedBranch(branchNames[0]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setMessage("Failed to load branches.");
      }
    };
    fetchBranches();
  }, []);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setMessage(selectedFile ? `You have selected ${selectedFile.name} for upload` : "Upload your info.yaml file here");
  };

  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }
    if (!name) {
      setMessage("Please enter your name.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('branch', selectedBranch); // Append selected branch to form data

    setMessage("Your data is currently being processed and sent to GitHub");

    try {
      const response = await axios.post(`${IP}upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || "An error occurred.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Welcome to the NMRLipids Upload API</h1>
        <h3 dangerouslySetInnerHTML={{ __html: message }} />
        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            className="name-input"
          />
          {/* Dropdown description */}
          <label htmlFor="branch-select" className="dropdown-label">
            Select a branch to upload to:
          </label>
          <select value={selectedBranch} onChange={handleBranchChange} className="branch-select">
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <input
            id="file-upload"
            type="file"
            className="file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="button"
            onClick={() => document.getElementById('file-upload').click()}
          >
            Select file
          </button>
          <button type="submit" className="button">Upload</button>
        </form>
      </header>
    </div>
  );
}

export default App;

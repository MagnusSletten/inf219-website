// App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import logo from './logo.svg'; // Ensure the logo file path is correct

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
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
        <img src={logo} className="App-logo" alt="logo" /> {/* Logo element */}
        <Welcome />
        <Info />
        <form onSubmit={handleSubmit}>
          <input type="file" accept=".yaml, .jpeg" onChange={handleFileChange} />
          <button type="submit">Upload</button>
        </form>
        {message && <p>{message}</p>}
      </header>
    </div>
  );
}

function Welcome() {
  return <h1>Welcome to the NMRLipids Info File Upload API</h1>;
}

function Info() {
  return <h3>This allows for uploads of info.yaml files</h3>;
}

export default App;


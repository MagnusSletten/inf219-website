import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import logo from './logo.svg'; // Ensure the logo file path is correct

function App() {
  const IP = 'http://127.0.0.1'   //Change this to your local IP or IP of hosted python server. 
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("Upload your info.yaml file here");
  const [name, setName] = useState("");

  const handleNameChange = (event) => {
    const curr_name = event.target.value;
    setName(curr_name);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setMessage(selectedFile ? `You have selected ${selectedFile.name} for upload` : "Upload your info.yaml file here");
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
    setMessage("Your data is currently being processed and sent to GitHub")
    try {
      const response = await axios.post('${IP}:5001/upload', formData, {
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

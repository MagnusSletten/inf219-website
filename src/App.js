import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import logo from './logo.svg';
import BranchSelect from './BranchSelect';
import Description from './Description';


function App() {
  const ClientID = "Ov23liS8svKowq4uyPcG"; 
  const IP = '/app/';
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("Upload your info.yaml file below:");
  const [name, setName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [loggedIn,setLoginStatus] = useState(false) 
  const [githubUsername, setGithubUsername] = useState("")

  
  const handleNameChange = (event) => setName(event.target.value);
  
  function githubLogin(){
    window.location.assign("https://github.com/login/oauth/authorize/?client_id=" + ClientID)
  }

  useEffect(() => {
    const fetchAuth = async() => {
      const currUrl = window.location.search;
      const urlParams = new URLSearchParams(currUrl)
      const code = urlParams.get("code")
      if(localStorage.getItem("jwtToken")){
         setLoginStatus(true)
        return; 
      }
      if (code){
        try {
          const response = await axios.post(`${IP}verifyCode`, { code }, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = response.data
          console.log(data)
          if(data.authenticated){
            setLoginStatus(true)
            console.log(data.authenticated)
            localStorage.setItem("jwtToken", data.token);
            
          }  
      }
      catch(error){
        console.error("Login failed", error);
      }

      }
    }
  fetchAuth();

  },[])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setMessage(selectedFile ? `You have selected ${selectedFile.name} for upload` : "Upload your info.yaml file here");
  };

  const handleBranchChange = (event) => setSelectedBranch(event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const userToken = localStorage.getItem("jwtToken")
    if(!userToken){
      setMessage("Please log in through Github by clicking the Github Login Button")
      return; 
    }
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
    formData.append('branch', selectedBranch); 

    setMessage("Your data is currently being processed and sent to GitHub");
        try {
        const userToken = localStorage.getItem("jwtToken");
        const response = await axios.post(`${IP}upload`, formData, {
  
          headers: { 
            'Content-Type': 'multipart/form-data' ,
            "Authorization": `Bearer ${userToken}`
          },
        });
        setMessage(response.data.message);
      }
        catch (error) {
        setMessage(error.response?.data?.error || "An error occurred.");
      }
  };
  
  return (
    
      <div className="Container"> 
        <div className="Left">
        </div>
        <div className="App"> 
            <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <h1>Welcome to the NMRLipids Upload Portal</h1>
            </header>
            {!loggedIn &&<button onClick={githubLogin} className='button'>Github Login</button>} 
            {loggedIn &&
            <form onSubmit={handleSubmit} className="upload-form">
            <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={handleNameChange}
                className="name-input"
              />
            <BranchSelect 
                selectedBranch={selectedBranch} 
                setSelectedBranch={setSelectedBranch} 
                setMessage={setMessage} 
            />        
                <input
                    id="file-upload"
                    type="file"
                    className="file-input"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                <h3 className="upload-message" dangerouslySetInnerHTML={{ __html: message }} />
                <div className="Upload-buttons">
                <button
                    type="button"
                    className="button"
                    onClick={() => document.getElementById('file-upload').click()}>
                    Select file
                  </button>
                  <button type="submit" className="button">Upload</button>
                  </div>
            </form>}
         {!loggedIn && (
            <p>Please log in with GitHub to access the upload tool.</p>
          )}
          </div>
        <div className="Right">
        <div className="description-content">
          <Description />
        </div>
        </div>   
      </div>
    );
    
  }
export default App;




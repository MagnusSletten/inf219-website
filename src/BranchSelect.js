import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BranchSelect({ selectedBranch, setSelectedBranch, setMessage }) {  
  const [branches, setBranches] = useState([]); 

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('https://api.github.com/repos/MagnusSletten/Databank/branches');
        const branchNames = response.data.map(branch => branch.name);
        setBranches(branchNames);

        if (branchNames.includes("main")) {
          setSelectedBranch("main");
        } else if (branchNames.length > 0) {
          setSelectedBranch(branchNames[0]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setMessage("Failed to load branches."); // 
      }
    };

    fetchBranches();
  }, [setSelectedBranch, setMessage]); 

  const handleBranchChange = (event) => setSelectedBranch(event.target.value);

  return (
    <>
      <h3 htmlFor="branch-select" className="dropdown-label"> Select a branch to upload to:</h3>
      <select value={selectedBranch} onChange={handleBranchChange} className="branch-select">
        {branches.map(branch => (
          <option key={branch} value={branch}>{branch}</option>
        ))}
      </select>
    </>
  );
}

export default BranchSelect;

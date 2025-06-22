import React, { useState, useEffect } from 'react';
import YAML from 'yaml';
import axios from 'axios';
import './App.css';
import logo from './logo.svg';
import BranchSelect from './BranchSelect';
import Description from './Description';
import { useImmer } from 'use-immer';

// Scalar fields
const scalarFields = [
  'DOI','SOFTWARE','TRJ','TPR','PREEQTIME','TIMELEFTOUT','DIR_WRK',
  'UNITEDATOM_DICT','TYPEOFSYSTEM','SYSTEM','PUBLICATION','AUTHORS_CONTACT',
  'BATCHID','SOFTWARE_VERSION','FF','FF_SOURCE','FF_DATE','CPT','LOG','TOP','EDR','TRAJECTORY_SIZE'
];
const compositionList = [
  'POPC',
  'POPG',
  'POPS',
  'POPE',
  'PYPC',
  'PAzePCprot',
  'PAzePCdeprot',
  'DMPC',
  'DPPC',
  'DPPE',
  'DPPG',
  'DEPC',
  'DRPC',
  'DYPC',
  'DLPC',
  'DLIPC',
  'DOG',
  'DOPC',
  'DOPE',
  'DDOPC',
  'DOPS',
  'DSPC',
  'DAPC',
  'SLiPC',
  'DMTAP',
  'GM1',
  'SOPC',
  'POPI',
  'SAPI',
  'SAPI24',
  'SLPI',
  'SDG',
  'SDPE',
  'SM16',
  'SM18',
  'TOCL',
  'TLCL',
  'CER',
  'CER180',
  'CHOL',
  'DCHOL',
  'DHMDMAB',
  'DPPGK',
  'POT',
  'SOD',
  'CLA',
  'CAL',
  'CES',
  'C20',
  'SOL'
];


export default function App() {
  const ClientID = 'Ov23liS8svKowq4uyPcG';
  const IP = '/app/';

  /* Auth & User */
  const [loggedIn, setLoggedIn] = useState(true);
  const [loggedInMessage, setLoggedInMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [branch, setBranch] = useState('main');
  const [message, setMessage] = useState('Fill in the form');
  const [pullRequestUrl, setPullRequestUrl] = useState(null);

  /* YAML Preview */
  const [yamlPreview, setYamlPreview] = useState('');

  /* Form state */
  const [data, setData] = useImmer({
    DOI: '',
    SOFTWARE: '',
    TRJ: '',
    TPR: '',
    PREEQTIME: 0,
    TIMELEFTOUT: 0,
    DIR_WRK: '',
    UNITEDATOM_DICT: '',
    TYPEOFSYSTEM: '',
    SYSTEM: '',
    PUBLICATION: '',
    AUTHORS_CONTACT: '',
    BATCHID: '',
    SOFTWARE_VERSION: '',
    FF: '',
    FF_SOURCE: '',
    FF_DATE: '',
    CPT: '',
    LOG: '',
    TOP: '',
    EDR: '',
    COMPOSITION: {}
    // key: nmrlipids-name   value: { name: string, mapping_file: string }
    // this starts empty
    
  });
  const clone = obj => JSON.parse(JSON.stringify(obj));
/* scalar values */
  
// 1) change any scalar
const handleChange = e => {
  const { name, value } = e.target;
  setData(draft => { draft[name] = value });
};


  /* GitHub OAuth */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (localStorage.githubToken) {
      setLoggedIn(true);
      setLoggedInMessage(`Logged in as ${localStorage.username}`);
      return;
    }
    if (code) {
      axios.post(`${IP}verifyCode`, { code })
        .then(res => {
          if (res.data.authenticated) {
            localStorage.githubToken = res.data.token;
            localStorage.username = res.data.username || '';
            setLoggedIn(true);
            setLoggedInMessage(`Logged in as ${res.data.username || ''}`);
            window.history.replaceState(null, '', window.location.pathname);
          }
        })
        .catch(() => setMessage('GitHub login failed'));
    }
  }, []);

  const githubLogin = () => {
    window.location.assign(`https://github.com/login/oauth/authorize/?client_id=${ClientID}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
    setLoggedInMessage('');
    setMessage('Fill in the form');
    setUserName('');
    setBranch('main');
    setPullRequestUrl(null);
    setYamlPreview('');
    setData({
      DOI: '', SOFTWARE: '', TRJ: '', TPR: '', PREEQTIME: 0, TIMELEFTOUT: 0,
      DIR_WRK: '', PUBLICATION: '', AUTHORS_CONTACT: '', SYSTEM: '', SOFTWARE_VERSION: '',
      FF: '', FF_SOURCE: '', FF_DATE: '', CPT: '', LOG: '', TOP: '',
      COMPOSITION: [{ name: '', mapping: '' }]
    });
  };



const handleSubmit = async e => {
  e.preventDefault();

  const jsonPayload = {
    ...data,
    userName,
    branch
  };

  console.log('📤 Sending payload:', jsonPayload);

  try {
    const resp = await axios.post('/app/upload', jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.githubToken}`
      }
    });
    console.log('✅ Upload succeeded:', resp.data);
    setMessage('Upload succeeded!');
  } catch (err) {
    // If the server returned JSON, this will log it
    if (err.response) {
      console.error('❌ Server responded with:', err.response.status, err.response.data);
      setMessage(`Upload failed: ${err.response.data.error}`);
    } else {
      console.error('❌ Network or other error', err);
      setMessage(`Upload failed: ${err.message}`);
    }
  }
};



  return (
    <div className="Container">
      <div className="Left" />
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Welcome to NMRLipids Upload Portal</h1>
        </header>

        {!loggedIn ? (
          <button onClick={githubLogin} className="button centered">GitHub Login</button>
        ) : (
          <button onClick={handleLogout} className="button centered">Logout</button>
        )}

        {loggedIn && (
          <form onSubmit={handleSubmit} className="upload-form">
            <h3 className='logInMessage'>{loggedInMessage}</h3>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="name-input centered"
            />
            <BranchSelect
              selectedBranch={branch}
              setSelectedBranch={setBranch}
              setMessage={setMessage}/>

            <p className="upload-message centered">{message}</p>

            <div className="scalar-fields">
              {scalarFields.map(key => (
                <div key={key} className="field">
                  <label>{key}</label>
                  <input
                    name={key}
                    value={data[key]}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>

      <fieldset>
        <legend>COMPOSITION</legend>

        {Object.entries(data.COMPOSITION).map(([lipidId, info]) => (
          <div key={lipidId} className="comp-row">
            {/* 1) select lipid */}
            <select
              value={lipidId}
              onChange={e =>
                setData(draft => {
                  const newId = e.target.value;
                  // move the object under the new key
                  draft.COMPOSITION[newId] = draft.COMPOSITION[lipidId];
                  delete draft.COMPOSITION[lipidId];
                })
              }
            >
              <option value="" disabled>Select lipid…</option>
              {compositionList.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>

            {/* 2) mapping input */}
            <input
              placeholder="Mapping file"
              value={info.MAPPING}
              onChange={e =>
                setData(draft => {
                  draft.COMPOSITION[lipidId].MAPPING = e.target.value;
                })
              }
            />

            {/* 3) remove */}
            <button
              type="button"
              onClick={() =>
                setData(draft => {
                  delete draft.COMPOSITION[lipidId];
                })
              }
            >
              ✕
            </button>
          </div>
        ))}

        {/* add a blank entry under an empty key */}
        <button
          type="button"
          onClick={() =>
            setData(draft => {
              draft.COMPOSITION[''] = { MAPPING: '' };
            })
          }
        >
          + Add Composition
        </button>
      </fieldset>

            <button type="submit" className="button centered">Submit</button>

            {pullRequestUrl && (
              <p className="centered">
                <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer">View Pull Request</a>
              </p>
            )}
          </form>
        )}
      </div>
      <div className="Right">
        <Description />
      </div>
    </div>
  );
}

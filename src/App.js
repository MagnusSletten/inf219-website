import React, { useState, useEffect } from 'react';
import YAML from 'yaml';
import axios from 'axios';
import './App.css';
import logo from './logo.svg';
import BranchSelect from './BranchSelect';
import Description from './Description';

// Scalar fields
const scalarFields = [
  'DOI','SOFTWARE','TRJ','TPR','PREEQTIME','TIMELEFTOUT','DIR_WRK',
  'UNITEDATOM_DICT','TYPEOFSYSTEM','SYSTEM','PUBLICATION','AUTHORS_CONTACT',
  'BATCHID','SOFTWARE_VERSION','FF','FF_SOURCE','FF_DATE','CPT','LOG','TOP','EDR','TRAJECTORY_SIZE'
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
  const [data, setData] = useState({
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
    TRAJECTORY_SIZE: '',
    COMPOSITION: [{ name: '', mapping: '' }]
  });

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

  /* Form handlers */
  const handleChange = e => {
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleCompChange = (idx, field) => e => {
    const items = [...data.COMPOSITION];
    items[idx][field] = e.target.value;
    setData(d => ({ ...d, COMPOSITION: items }));
  };

  const addComp = () => {
    setData(d => ({
      ...d,
      COMPOSITION: [...d.COMPOSITION, { name: '', mapping: '' }]
    }));
  };

  const removeComp = idx => {
    setData(d => {
      const items = d.COMPOSITION.filter((_, i) => i !== idx);
      return { ...d, COMPOSITION: items.length ? items : [{ name: '', mapping: '' }] };
    });
  };

const handleSubmit = async e => {
  e.preventDefault();
  console.log('🔔 handleSubmit called');

  // Build YAML
  const compMap = Object.fromEntries(
    data.COMPOSITION.map(c => [c.name, { NAME: c.name, MAPPING: c.mapping }])
  );
  const yamlString = YAML.stringify({ ...data, COMPOSITION: compMap });
  console.log('📦 payload YAML:\n', yamlString);

  // Build form
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([yamlString], { type: 'application/x-yaml' }),
    'data.yaml'
  );
  formData.append('name', userName);
  formData.append('branch', branch);

  // LOG EVERY ENTRY
  for (let [key, val] of formData.entries()) {
    console.log('📮 formData entry:', key, val);
  }

  // *** FIX: use a single “/app/upload” path ***
  const uploadUrl = '/app/upload';
  console.log('🔗 Uploading to:', uploadUrl);

  try {
    const resp = await axios.post(uploadUrl, formData, {
      headers: { Authorization: `Bearer ${localStorage.githubToken}` },
      validateStatus: () => true,
    });
    console.log('📥 response:', resp.status, resp.data);

    setMessage(
      resp.status === 200
        ? resp.data.message
        : `Error ${resp.status}: ${resp.data?.error || JSON.stringify(resp.data)}`
    );
  } catch (err) {
    console.error('🔥 request threw:', err);
    setMessage('Network or CORS error—see console.');
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
              setMessage={setMessage}
            />
            <p className="upload-message centered">{message}</p>

            {scalarFields.map(key => (
              <div key={key} className="field centered" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }}>
                <label style={{ marginBottom: 4 }}>{key}</label>
                <input
                  name={key}
                  value={data[key]}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            <fieldset className="centered">
              <legend>COMPOSITION</legend>
              {data.COMPOSITION.map((c, i) => (
                <div key={i} className="comp-row centered" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    placeholder="Name"
                    value={c.name}
                    onChange={handleCompChange(i,'name')}
                  />
                  <input
                    placeholder="Mapping"
                    value={c.mapping}
                    onChange={handleCompChange(i,'mapping')}
                  />
                  <button type="button" onClick={() => removeComp(i)}>✕</button>
                </div>
              ))}
              <button type="button" onClick={addComp} className="button centered">+ Add Composition</button>
            </fieldset>

            <button type="submit" className="button centered">Submit</button>

            {yamlPreview && (
              <pre style={{ background: '#f4f4f4', padding: 10, whiteSpace: 'pre-wrap', marginTop: 12 }}>
                {yamlPreview}
              </pre>
            )}

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

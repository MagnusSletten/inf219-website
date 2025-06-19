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

  // 1) Build your YAML payload
  const compMap = Object.fromEntries(
    data.COMPOSITION.map(c => [c.name, { NAME: c.name, MAPPING: c.mapping }])
  );
  const payload = { ...data, COMPOSITION: compMap };
  const yamlString = YAML.stringify(payload);

  const token = localStorage.githubToken;
  if (!token) {
    setMessage('Please login first');
    return;
  }
  if (!userName) {
    setMessage('Please enter your name.');
    return;
  }

  // 2) Wrap it in FormData under “file” (so Flask sees request.files['file'])
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([yamlString], { type: 'application/x-yaml' }),
    'data.yaml'
  );
  formData.append('name', userName);
  formData.append('branch', branch);

  setMessage('Submitting your data…');

  try {
    const response = await axios.post(
      `${IP}upload`,      // make sure IP ends in “/app/” (or use `/app/upload` explicitly)
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // omit Content-Type so axios adds the correct multipart boundary
        },
        // allow us to see EVERY response, not just 2xx
        validateStatus: status => true,
      }
    );

    console.log('📥 server responded:', response.status, response.data);

    if (response.status !== 200) {
      // show the exact error JSON (or string) you got back
      const err = response.data?.error || JSON.stringify(response.data);
      setMessage(`Error ${response.status}: ${err}`);
      return;
    }

    setMessage(response.data.message);
    setPullRequestUrl(response.data.pullUrl || null);

  } catch (err) {
    console.error('🔥 upload failed:', err);
    setMessage('Unexpected error – check console for details.');
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

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFireFlameSimple, faBoltLightning, faPlus, faTimes, faTowerCell, faCircleXmark, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const initialFormState = {
  name: '',
  type: 'Gas',
  rate: '',
  duration: '',
};

// Get API host from environment variable, default to empty string for relative URLs
const API_HOST = process.env.REACT_APP_API_HOST || '';

function App() {
  // Best rates state
  const [bestGas, setBestGas] = useState(null);
  const [bestElectric, setBestElectric] = useState(null);
  const [loadingGas, setLoadingGas] = useState(true);
  const [loadingElectric, setLoadingElectric] = useState(true);
  const [errorGas, setErrorGas] = useState(null);
  const [errorElectric, setErrorElectric] = useState(null);

  // Modal and form state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // store selected utility
  const [selectedUtility, setSelectedUtility] = useState(null);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTypeSelect = (type) => {
    setForm((prev) => ({
      ...prev,
      type: type,
    }));
  };

  const canSubmit = form.name.trim() && form.type.trim() && form.rate !== '';
  const isSubmitting = status === 'loading';

  // Fetch best gas rate
  const fetchBestGas = async () => {
    try {
      setLoadingGas(true);
      setErrorGas(null);
      const response = await fetch(`${API_HOST}/api/putility/best/gas`);
      if (!response.ok) {
        throw new Error('Failed to fetch best gas rate');
      }
      const data = await response.json();
      setBestGas(data);
    } catch (error) {
      console.error('Error fetching best gas rate:', error);
      setErrorGas(error.message);
    } finally {
      setLoadingGas(false); //Will make this prettier later
    }
  };

  // Fetch best electric rate
  const fetchBestElectric = async () => {
    try {
      setLoadingElectric(true);
      setErrorElectric(null);
      const response = await fetch(`${API_HOST}/api/putility/best/electric`);
      if (!response.ok) {
        throw new Error('Failed to fetch best electric rate');
      }
      const data = await response.json();
      setBestElectric(data);
    } catch (error) {
      console.error('Error fetching best electric rate:', error);
      setErrorElectric(error.message);
    } finally {
      setLoadingElectric(false); //Will make this prettier later
    }
  };

  // Calls the fetch config endpoint to get all saved configs.
  const fetchConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const response = await fetch(`${API_HOST}/api/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch configs');
      }
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const saveConfigs = async (payload) =>{
    const response = await fetch(`${API_HOST}/api/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // hopefully this never triggers...since i control both ends
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText || 'Server rejected the Current Rate');
    }

    return response
  }
  useEffect(() => {
    fetchBestGas();
    fetchBestElectric();
    fetchConfigs();
  }, []);

  const handleRateClick = async (putility) => {
    console.log('Clicked rate:', putility);
    setShowConfirmModal(true);
    setSelectedUtility(putility);
  }

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedUtility(null);
  }

  const rateClickSelected = async () =>{
    console.log(selectedUtility)

    //convert putility to cutility
    try {

      // for duration its current date + ratelength months added we can get same logic as best rate for this
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + selectedUtility.rateLength);

      const payload = {
        name: selectedUtility.name,
        type: selectedUtility.type,
        duration: expirationDate.toISOString(),
        rate: selectedUtility.rate,
      };
      await saveConfigs(payload);
    }catch (e) {
      console.error('Error converting putility to cutility:', e);
    } finally {
      setShowConfirmModal(false);
      fetchConfigs(); // Reload configs after successful save
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault(); //blcok basic js

    if (!canSubmit) {
      setErrorMessage('Name, type, and rate are required before submitting.');
      setStatus('error');
      return;
    }


    // should probably also check if decimal...but maybe places like CA have really high numbers
    const numericRate = Number(form.rate);
    if (Number.isNaN(numericRate)) {
      setErrorMessage('Rate must be a valid number.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type.trim(),
        rate: numericRate,
      };

      // Add optional fields if provided
      if (form.duration.trim()) {
        payload.duration = new Date(form.duration).toISOString();
      }

      saveConfigs(payload);
      setStatus('success');
      setForm(initialFormState);
      await fetchConfigs(); // Reload configs after successful save

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setShowModal(false);
        setStatus('idle');
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unknown error while saving the Current Rate',
      );
      console.error(error);
    }
  };

  const renderUtilityCard = (utility, loading, error, icon, typeClass) => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (error) {
      return <div className="error-state">Error: {error}</div>;
    }

    if (!utility) {
      return <div className="empty-state">No data available</div>;
    }

    return (
      <div className="utility-card" onClick={() => handleRateClick(utility)}>
        <div className="utility-header">
          <FontAwesomeIcon icon={icon} className={`utility-icon ${typeClass}`} />
          <h3>{utility.name}</h3>
        </div>
        <div className="utility-details">
          <div className="utility-row">
            <span className="utility-label">Type:</span>
            <span className={`utility-type ${typeClass}`}>{utility.type}</span>
          </div>
          <div className="utility-row">
            <span className="utility-label">Rate:</span>
            <span className="utility-value rate">${Number(utility.rate).toFixed(5)}</span>
          </div>
          {utility.url && (
            <div className="utility-row">
              <span className="utility-label">URL:</span>
              <a href={utility.url} target="_blank" rel="noopener noreferrer" className="utility-link">
                View Details
              </a>
            </div>
          )}
          {utility.rateLength && (
            <div className="utility-row">
              <span className="utility-label">Valid For:</span>
              <span className="utility-value">{utility.rateLength} months</span>
            </div>
          )}
          {utility.createdAt && (
            <div className="utility-row">
              <span className="utility-label">Last Updated:</span>
              <span className="utility-value">
                {new Date(utility.createdAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="App">
      <div className="app-container">
        <div className="header-section">
          <h1><FontAwesomeIcon icon={faTowerCell} /> Power Switch</h1>
          <button className="add-utility-button" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Current Utility</span>
          </button>
        </div>

        <section className="best-rates-section">
          <div className="best-rates-grid">
            <div className="rate-card-wrapper">
              <h2>
                <FontAwesomeIcon icon={faFireFlameSimple} className="section-icon gas" />
                Best Gas Rate
              </h2>
              {renderUtilityCard(bestGas, loadingGas, errorGas, faFireFlameSimple, 'gas')}
            </div>

            <div className="rate-card-wrapper">
              <h2>
                <FontAwesomeIcon icon={faBoltLightning} className="section-icon electric" />
                Best Electric Rate
              </h2>
              {renderUtilityCard(bestElectric, loadingElectric, errorElectric, faBoltLightning, 'electric')}
            </div>
          </div>
        </section>

        <section className="configs-section">
          <h2>Current Utility Rates</h2>
          {loadingConfigs ? (
            <div className="loading">Loading configurations...</div>
          ) : configs.length === 0 ? (
            <div className="empty-state">No configurations saved yet. Add your first one using the button above!</div>
          ) : (
            <div className="configs-grid">
              {configs.map((config) => (
                <div key={config.id} className="config-card">
                  <div className="config-header">
                    <h3>{config.name}</h3>
                    <span className={`config-type ${config.type?.toLowerCase()}`}>
                      {config.type}
                    </span>
                  </div>
                  <div className="config-details">
                    <div className="config-row">
                      <span className="config-label">Rate:</span>
                      <span className="config-value rate">${Number(config.rate).toFixed(5)}</span>
                    </div>
                    {config.duration && (
                      <div className="config-row">
                        <span className="config-label">Valid Until:</span>
                        <span className="config-value">
                          {new Date(config.duration).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {config.fields && Object.keys(config.fields).length > 0 && (
                      <div className="config-row">
                        <span className="config-label">Additional Fields:</span>
                        <pre className="config-json">{JSON.stringify(config.fields, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Are you sure you want to save this utility?</h2>
              <button className="modal-close" onClick={closeConfirmModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <p className="modal-description">Saving this will replace your current configuration with the selected rate.</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-btn cancel" onClick={closeConfirmModal}>
                <FontAwesomeIcon icon={faCircleXmark} />
                <span>Keep current</span>
              </button>
              <button type="button" className="confirm-btn confirm" onClick={rateClickSelected}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <span>Save this rate</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Current Utility</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Current Utility Name
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  disabled={isSubmitting}
                  required
                />
              </label>
              <div className="type-selection">
                <label>Utility Type</label>
                <div className="type-buttons">
                  <button
                    type="button"
                    className={`type-button ${form.type === 'Gas' ? 'active' : ''}`}
                    onClick={() => handleTypeSelect('Gas')}
                    disabled={isSubmitting}
                  >
                    <FontAwesomeIcon icon={faFireFlameSimple} className="type-icon" />
                    <span>Gas</span>
                  </button>
                  <button
                    type="button"
                    className={`type-button ${form.type === 'Electric' ? 'active' : ''}`}
                    onClick={() => handleTypeSelect('Electric')}
                    disabled={isSubmitting}
                  >
                    <FontAwesomeIcon icon={faBoltLightning} className="type-icon" />
                    <span>Electric</span>
                  </button>
                </div>
              </div>
              <label>
                Rate per {form.type === 'Gas' ? '(ccf)' : '(kWh)'}
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.00001"
                    value={form.rate}
                    onChange={handleChange('rate')}
                    disabled={isSubmitting}
                    required
                    className="input-with-prefix-field"
                  />
                </div>
              </label>
              <label>
                Duration (how long is this rate good for)
                <input
                  type="datetime-local"
                  value={form.duration}
                  onChange={handleChange('duration')}
                  disabled={isSubmitting}
                />
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save Current Utility Record'}
              </button>
            </form>

            {status === 'success' && <p className="status success">Current Rate stored successfully.</p>}
            {status === 'error' && (
              <p className="status error">
                {errorMessage || 'Unable to save Current Rate; check console for more details.'}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;

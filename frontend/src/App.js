import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFireFlameSimple, faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const initialFormState = {
  name: '',
  type: 'Gas',
  rate: '',
  duration: '',
};

function App() {
  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

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

  // Calls the fetch config endpoint to get all saved configs.
  const fetchConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const response = await fetch('/api/config');
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

  useEffect(() => {
    fetchConfigs();
  }, []);

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

      // Its hard coded for now...but i might have to change this later to be env based or something
      const response = await fetch('/api/config', {
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

      setStatus('success');
      setForm(initialFormState);
      fetchConfigs(); // Reload configs after successful save
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unknown error while saving the Current Rate',
      );
      console.error(error);
    }
  };

  return (
    <main className="App">
      <div className="app-container">
        <section className="form-card">
          <h1>Add Current Utility</h1>
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
                className={`type-button ${form.type === 'Electricity' ? 'active' : ''}`}
                onClick={() => handleTypeSelect('Electricity')}
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faBoltLightning} className="type-icon" />
                <span>Electricity</span>
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
        </section>

        <section className="configs-section">
          <h2>Saved Utility Configurations</h2>
          {loadingConfigs ? (
            <div className="loading">Loading configurations...</div>
          ) : configs.length === 0 ? (
            <div className="empty-state">No configurations saved yet. Create your first one above!</div>
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
    </main>
  );
}

export default App;

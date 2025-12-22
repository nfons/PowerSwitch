import { useState } from 'react';
import './App.css';

const initialFormState = {
  name: '',
  type: '',
  rate: '',
  duration: '',
};

function App() {
  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const canSubmit = form.name.trim() && form.type.trim() && form.rate !== '';
  const isSubmitting = status === 'loading';

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
      <section className="form-card">
        <h1>Create Current Utility</h1>
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
          <label>
            Utility Type
            <select
              value={form.type}
              onChange={handleChange('type')}
              disabled={isSubmitting}
              required
            >
              <option value="">Select a type...</option>
              <option value="Gas">Gas</option>
              <option value="Electricity">Electricity</option>
            </select>
          </label>
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
    </main>
  );
}

export default App;

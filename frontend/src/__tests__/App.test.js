import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock fetch globally
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Default mock for GET /api/config
    fetch.mockImplementation((url) => {
      if (url === '/api/config' || url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders form heading', async () => {
      render(<App />);
      expect(screen.getByText('Add Current Utility')).toBeInTheDocument();
    });

    test('renders all form fields', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Current Utility Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Utility Type/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Gas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Electricity/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Rate per/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
      });
    });

    test('renders submit button', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Save Current Utility Record/i })).toBeInTheDocument();
      });
    });

    test('fetches configs on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/config');
      });
    });
  });

  describe('Type Selection Buttons', () => {
    test('clicking Gas button selects Gas type', async () => {
      render(<App />);

      await waitFor(() => screen.getByText('Gas'));

      const gasButton = screen.getByRole('button', { name: /Gas/i });
      await userEvent.click(gasButton);

      expect(gasButton).toHaveClass('type-button active');
    });

    test('clicking Electricity button selects Electricity type', async () => {
      render(<App />);

      await waitFor(() => screen.getByText('Electricity'));

      const electricityButton = screen.getByRole('button', { name: /Electricity/i });
      await userEvent.click(electricityButton);

      expect(electricityButton).toHaveClass('active');
    });

    test('type buttons are mutually exclusive', async () => {
      render(<App />);

      await waitFor(() => screen.getByText('Gas'));

      const gasButton = screen.getByRole('button', { name: /Gas/i });
      const electricityButton = screen.getByRole('button', { name: /Electricity/i });

      await userEvent.click(gasButton);
      expect(gasButton).toHaveClass('active');
      expect(electricityButton).not.toHaveClass('active');

      await userEvent.click(electricityButton);
      expect(electricityButton).toHaveClass('active');
      expect(gasButton).not.toHaveClass('active');
    });
  });

  describe('Form Validation', () => {
    test('shows error when submitting empty form', async () => {
      render(<App />);

      await waitFor(() => screen.getByRole('button', { name: /Save Current Utility Record/i }));

      const submitButton = screen.getByRole('button', { name: /Save Current Utility Record/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const errorSpan = document.querySelector('.status');
        expect(errorSpan).not.toBeNull();
      });
    });

    test('shows error when rate is not a number', async () => {
      render(<App />);

      await waitFor(() => screen.getByLabelText(/Current Utility Name/i));

      const nameInput = screen.getByLabelText(/Current Utility Name/i);
      const rateInput = screen.getByLabelText(/Rate per/i);
      const gasButton = screen.getByRole('button', { name: /Gas/i });
      const submitButton = screen.getByRole('button', { name: /Save Current Utility Record/i });

      await userEvent.type(nameInput, 'Test Utility');
      await userEvent.click(gasButton);
      await userEvent.type(rateInput, 'abc');
      await userEvent.click(submitButton);

      await waitFor(() => {
        const errorSpan = document.querySelector('.status');
        expect(errorSpan).not.toBeNull();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form successfully with valid data', async () => {

      fetch.mockImplementation((url, options) => {
        if (url === '/api/config' && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 1, name: 'Test Utility', type: 'Gas', rate: 0.12 }),
          });
        }
        if (url === '/api/config') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<App />);

      await waitFor(() => screen.getByLabelText(/Current Utility Name/i));

      const nameInput = screen.getByLabelText(/Current Utility Name/i);
      const rateInput = screen.getByLabelText(/Rate per/i);
      const gasButton = screen.getByRole('button', { name: /Gas/i });
      const submitButton = screen.getByRole('button', { name: /Save Current Utility Record/i });

      await userEvent.type(nameInput, 'Test Utility');
      await userEvent.click(gasButton);
      await userEvent.type(rateInput, '0.12');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/config', expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Utility',
            type: 'Gas',
            rate: 0.12,
          }),
        }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Current Rate stored successfully/i)).toBeInTheDocument();
      });
    });

    test('clears form after successful submission', async () => {

      fetch.mockImplementation((url, options) => {
        if (url === '/api/config' && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 1, name: 'Test Utility', type: 'Gas', rate: 0.12 }),
          });
        }
        if (url === '/api/config') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<App />);

      await waitFor(() => screen.getByLabelText(/Current Utility Name/i));

      const nameInput = screen.getByLabelText(/Current Utility Name/i);
      const rateInput = screen.getByLabelText(/Rate per/i);
      const gasButton = screen.getByRole('button', { name: /Gas/i });
      const submitButton = screen.getByRole('button', { name: /Save Current Utility Record/i });

      await userEvent.type(nameInput, 'Test Utility');
      await userEvent.click(gasButton);
      await userEvent.type(rateInput, '0.12');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Current Rate stored successfully/i)).toBeInTheDocument();
      });

      expect(nameInput).toHaveValue('');
      expect(rateInput).toHaveValue(null);
    });

    test('handles submission error', async () => {

      fetch.mockImplementation((url, options) => {
        if (url === '/api/config' && options?.method === 'PUT') {
          return Promise.resolve({
            ok: false,
            text: async () => 'Server error',
          });
        }
        if (url === '/api/config') {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<App />);

      await waitFor(() => screen.getByLabelText(/Current Utility Name/i));

      const nameInput = screen.getByLabelText(/Current Utility Name/i);
      const rateInput = screen.getByLabelText(/Rate per/i);
      const gasButton = screen.getByRole('button', { name: /Gas/i });
      const submitButton = screen.getByRole('button', { name: /Save Current Utility Record/i });

      await userEvent.type(nameInput, 'Test Utility');
      await userEvent.click(gasButton);
      await userEvent.type(rateInput, '0.12');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Configs Display', () => {
    test('displays loading state initially', () => {
      render(<App />);
      expect(screen.getByText(/Loading configurations/i)).toBeInTheDocument();
    });

    test('displays empty state when no configs', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/No configurations saved yet/i)).toBeInTheDocument();
      });
    });

    test('displays configs when available', async () => {
      fetch.mockImplementation((url) => {
        if (url === '/api/config' || url.includes('/api/config')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: 1, name: 'Gas Utility', type: 'Gas', rate: 0.12 },
              { id: 2, name: 'Electric Utility', type: 'Electricity', rate: 0.15 },
            ],
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Gas Utility')).toBeInTheDocument();
        expect(screen.getByText('Electric Utility')).toBeInTheDocument();
      });
    });

    test('refetches configs after successful submission', async () => {

      let callCount = 0;
      fetch.mockImplementation((url, options) => {
        if (url === '/api/config' && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 1, name: 'Test Utility', type: 'Gas', rate: 0.12 }),
          });
        }
        if (url === '/api/config') {
          callCount++;
          return Promise.resolve({
            ok: true,
            json: async () => callCount === 1 ? [] : [{ id: 1, name: 'Test Utility', type: 'Gas', rate: 0.12 }],
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<App/>)

      await waitFor(() => screen.getByLabelText(/Current Utility Name/i));

      const nameInput = screen.getByLabelText(/Current Utility Name/i);
      const rateInput = screen.getByLabelText(/Rate per/i);
      const gasButton = screen.getByRole('button', { name: /Gas/i });
      const submitButton = screen.getByRole('button', { name: /Save Current Utility Record/i });

      await userEvent.type(nameInput, 'Test Utility');
      await userEvent.click(gasButton);
      await userEvent.type(rateInput, '0.12');
      await userEvent.click(submitButton);
       await waitFor(() => {
         expect(fetch).toHaveBeenCalledTimes(3); // Initial fetch of current + put current+ refetch after submit
      });
    });
  });
});

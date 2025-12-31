import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';


// Base Values for responses
const bestGas = { id: 1, name: 'Gas Saver', type: 'Gas', rate: 0.12345, rateLength: 12, createdAt: new Date().toISOString() };
const bestElectric = { id: 2, name: 'Spark Deal', type: 'Electric', rate: 0.23456, rateLength: 6, url: 'https://example.com' };
const currentGas = { id: 10, name: 'Current Gas', type: 'Gas', rate: 0.34567, duration: new Date().toISOString() };
const currentElectric = { id: 11, name: 'Current Electric', type: 'Electric', rate: 0.45678, duration: new Date().toISOString() };

// Helper to mock fetch responses sequence based on URL
function createFetchMock(routes) {
  return jest.fn(async (url, options) => {
    const route = routes.find(r => (typeof r.match === 'function' ? r.match(url, options) : url.includes(r.match)));
    if (!route) {
      throw new Error(`Unmocked fetch call: ${url}`);
    }
    if (route.error) {
      return {
        ok: false,
        status: route.status || 500,
        json: async () => ({ message: route.error }),
        text: async () => route.error,
      };
    }
    return {
      ok: true,
      status: route.status || 200,
      json: async () => route.json,
      text: async () => JSON.stringify(route.json),
    };
  });
}

describe('App', () => {
  beforeAll(() => {
    jest.setTimeout(15000);
  });

  beforeEach(() => {
    process.env.REACT_APP_API_HOST = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('shows loading states and then renders best rates and configs after successful fetch', async () => {
    global.fetch = createFetchMock([
      { match: '/api/putility/best/gas', json: bestGas },
      { match: '/api/putility/best/electric', json: bestElectric },
      { match: '/api/config/current/gas', json: currentGas },
      { match: '/api/config/current/electric', json: currentElectric },
    ]);

    render(<App />);

    // Loading states initially
    expect(screen.getAllByText(/Loading/i).length).toBeGreaterThan(0);

    // Wait for best gas card wrapper
    const gasHeading = await screen.findByRole('heading', { name: /Best Gas Rate/i });
    const gasWrapper = gasHeading.closest('.rate-card-wrapper');

    // Wait for loading to disappear inside gas wrapper
    await waitFor(() => {
      expect(within(gasWrapper).queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Best gas utility card content (scoped)
    const gasCard = within(gasWrapper).getByRole('heading', { name: 'Gas Saver' });
    expect(gasCard).toBeInTheDocument();
    expect(within(gasWrapper).getByText(/Type:/i)).toBeInTheDocument();
    // exact match to avoid section heading
    expect(within(gasWrapper).getByText(/^Gas$/)).toBeInTheDocument();
    expect(within(gasWrapper).getByText('$0.12345')).toBeInTheDocument();

    // Best electric utility card content (scoped)
    const electricHeading = await screen.findByRole('heading', { name: /Best Electric Rate/i });
    const electricWrapper = electricHeading.closest('.rate-card-wrapper');
    await waitFor(() => {
      expect(within(electricWrapper).queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    const spark = within(electricWrapper).getByRole('heading', { name: 'Spark Deal' });
    expect(spark).toBeInTheDocument();
    expect(within(electricWrapper).getByText('$0.23456')).toBeInTheDocument();
    // Link present when url exists
    expect(within(electricWrapper).getByRole('link', { name: /View Details/i })).toHaveAttribute('href', 'https://example.com');

    // Configs section renders current gas and electric cards
    const configsHeading = screen.getByRole('heading', { name: /Current Utility Rates/i });
    expect(configsHeading).toBeInTheDocument();

    // Check for current gas
    expect(await screen.findByText('Current Gas')).toBeInTheDocument();
    expect(screen.getByText('$0.34567')).toBeInTheDocument();

    // Check for current electric
    expect(await screen.findByText('Current Electric')).toBeInTheDocument();
    expect(screen.getByText('$0.45678')).toBeInTheDocument();
  });

  test('handles error states for best rates', async () => {
    // Mock the fetch responses
    global.fetch = createFetchMock([
      { match: '/api/putility/best/gas', error: 'Failed to fetch best gas rate' },
      { match: '/api/putility/best/electric', error: 'Failed to fetch best electric rate' },
      { match: '/api/config/current/gas', json: null },
      { match: '/api/config/current/electric', json: null },
    ]);

    // Mock console error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    expect(await screen.findAllByText(/Error:/i)).toHaveLength(2);
    expect(screen.getByText(/Failed to fetch best gas rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch best electric rate/i)).toBeInTheDocument();
  });

  test('shows empty states when no utilities returned', async () => {
    global.fetch = createFetchMock([
      { match: '/api/putility/best/gas', json: null },
      { match: '/api/putility/best/electric', json: null },
      { match: '/api/config/current/gas', json: null },
      { match: '/api/config/current/electric', json: null },
    ]);

    render(<App />);

    expect(await screen.findAllByText(/No data available/i)).toHaveLength(2);
    expect(await screen.findAllByText(/No (gas|electric) configuration saved yet/i)).toHaveLength(2);
  });

  test('opens Add Current Utility modal and validates form', async () => {
    global.fetch = createFetchMock([
      { match: '/api/putility/best/gas', json: bestGas },
      { match: '/api/putility/best/electric', json: bestElectric },
      { match: '/api/config/current/gas', json: null },
      { match: '/api/config/current/electric', json: null },
    ]);

    render(<App />);

    const addBtn = screen.getByRole('button', { name: /Add Current Utility/i });
    await userEvent.click(addBtn);

    // Modal visible
    const modalHeading = screen.getByRole('heading', { name: /Add Current Utility/i });
    expect(modalHeading).toBeInTheDocument();

    // Submit with empty required fields -> error (bypass HTML5 required by dispatching submit)
    const form = modalHeading.closest('.modal-content').querySelector('form');
    fireEvent.submit(form);
    expect(await screen.findByText(/Name, type, and rate are required/i)).toBeInTheDocument();

    // Fill invalid rate (non-numeric)
    const nameInput = screen.getByLabelText(/Current Utility Name/i);
    await userEvent.type(nameInput, 'My Utility');

    const rateInput = screen.getByLabelText(/Rate per/i);
    fireEvent.change(rateInput, { target: { value: 'abc' } });
    fireEvent.submit(form);
    // For type="number" inputs, invalid strings are rejected and value remains empty
    // so expect the required-fields error message again
    expect(await screen.findByText(/Name, type, and rate are required/i)).toBeInTheDocument();
  });

  test('submits valid form, saves config, resets form, reloads configs, and closes modal after timeout', async () => {
    const fetchMock = jest.fn(async (url, options) => {
      if (url.includes('/api/putility/best/gas')) return { ok: true, json: async () => bestGas };
      if (url.includes('/api/putility/best/electric')) return { ok: true, json: async () => bestElectric };
      if (url.includes('/api/config/current/gas')) return { ok: true, json: async () => null };
      if (url.includes('/api/config/current/electric')) return { ok: true, json: async () => null };
      if (url.includes('/api/config') && options && options.method === 'PUT') {
        // echo back success
        return { ok: true, json: async () => ({ success: true }) };
      }
      throw new Error(`Unexpected call: ${url}`);
    });
    global.fetch = fetchMock;

    render(<App />);

    // Open modal
    await userEvent.click(screen.getByRole('button', { name: /Add Current Utility/i }));
    const modalHeading = screen.getByRole('heading', { name: /Add Current Utility/i });
    expect(modalHeading).toBeInTheDocument();

    // Fill form
    await userEvent.type(screen.getByLabelText(/Current Utility Name/i), 'My Utility');
    const rateInput = screen.getByLabelText(/Rate per/i);
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '0.5');
    const durationInput = screen.getByLabelText(/Duration \(how long is this rate good for\)/i);
    await userEvent.type(durationInput, '2025-01-01T00:00');

    // Submit (bypass HTML5 required with fireEvent)
    const form2 = modalHeading.closest('.modal-content').querySelector('form');
    fireEvent.submit(form2);

    // Status success appears
    expect(await screen.findByText(/Current Rate stored successfully/i)).toBeInTheDocument();

    // Wait for modal to close by timeout (1.5s)
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Add Current Utility/i })).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('clicking a best rate card opens confirm modal and saving calls PUT with converted payload', async () => {
    const bestGas = { id: 1, name: 'Gas Saver', type: 'Gas', rate: 0.12345, rateLength: 12 };

    const fetchSpy = jest.fn(async (url, options) => {
      if (url.includes('/api/putility/best/gas')) return { ok: true, json: async () => bestGas };
      if (url.includes('/api/putility/best/electric')) return { ok: true, json: async () => bestElectric };
      if (url.includes('/api/config/current/gas')) return { ok: true, json: async () => null };
      if (url.includes('/api/config/current/electric')) return { ok: true, json: async () => null };
      if (url.includes('/api/config') && options && options.method === 'PUT') return { ok: true, json: async () => ({ ok: true }) };
      throw new Error(`Unexpected call: ${url}`);
    });
    global.fetch = fetchSpy;

    render(<App />);

    // Click the best gas card (wait for it to render)
    const gasHeading = await screen.findByRole('heading', { name: /Best Gas Rate/i });
    const gasWrapper = gasHeading.closest('.rate-card-wrapper');
    await waitFor(() => {
      expect(within(gasWrapper).queryByText(/Loading/i)).not.toBeInTheDocument();
    });
    const gasCardTitle = within(gasWrapper).getByRole('heading', { name: 'Gas Saver' });
    await userEvent.click(gasCardTitle);

    // Confirm modal appears
    expect(screen.getByRole('heading', { name: /Are you sure you want to save this utility\?/i })).toBeInTheDocument();

    // Click Save this rate
    await userEvent.click(screen.getByRole('button', { name: /Save this rate/i }));

    // Expect a PUT with converted payload
    const putCall = fetchSpy.mock.calls.find(c => c[0].includes('/api/config') && c[1] && c[1].method === 'PUT');
    expect(putCall).toBeTruthy();
    const body = JSON.parse(putCall[1].body);
    expect(body.name).toBe(bestGas.name);
    expect(body.type).toBe('Gas');
    expect(body.rate).toBe(bestGas.rate);
    expect(typeof body.duration).toBe('string');

    // Modal closes after save
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Are you sure you want to save this utility\?/i })).not.toBeInTheDocument();
    });
  });

  test('shows Best badge and tooltip for Gas when isBestGas is true', async () => {
    // Mock best rates lower than current to trigger isBestGas true
    const bestGas = { id: 1, name: 'Gas Saver', type: 'Gas', rate: 0.10, rateLength: 12 };
    const bestElectric = { id: 2, name: 'Spark Deal', type: 'Electric', rate: 0.20, rateLength: 6 };
    const currentGas = { id: 10, name: 'My Gas', type: 'gas', rate: 0.50, duration: new Date().toISOString() };
    const currentElectric = { id: 11, name: 'My Electric', type: 'electric', rate: 0.18, duration: new Date().toISOString() };

    global.fetch = jest.fn(async (url) => {
      if (url.includes('/api/putility/best/gas')) return { ok: true, json: async () => bestGas };
      if (url.includes('/api/putility/best/electric')) return { ok: true, json: async () => bestElectric };
      if (url.includes('/api/config/current/gas')) return { ok: true, json: async () => currentGas };
      if (url.includes('/api/config/current/electric')) return { ok: true, json: async () => currentElectric };
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<App />);

    const gasHeading = await screen.findByRole('heading', { name: /Best Gas Rate/i });
    const gasWrapper = gasHeading.closest('.rate-card-wrapper');
    await waitFor(() => {
      expect(within(gasWrapper).queryByText(/Loading/i)).not.toBeInTheDocument();
    });


    const gasCard = within(gasWrapper).getByRole('heading', { name: 'Gas Saver' }).closest('.utility-card');
    expect(within(gasWrapper).getByText('Best')).toBeInTheDocument();

    // Tooltip should appear on hover
    const tooltip = within(gasWrapper).getByRole('tooltip');

    await userEvent.hover(gasCard);
    expect(tooltip).toBeInTheDocument();
  });

  test('shows Best badge and tooltip for Electric when isBestElectric is true', async () => {
    //Mocks like above
    const bestGas = { id: 1, name: 'Gas Saver', type: 'Gas', rate: 0.10, rateLength: 12 };
    const bestElectric = { id: 2, name: 'Spark Deal', type: 'Electric', rate: 0.15, rateLength: 6 };
    const currentGas = { id: 10, name: 'My Gas', type: 'gas', rate: 0.05, duration: new Date().toISOString() };
    const currentElectric = { id: 11, name: 'My Electric', type: 'electric', rate: 0.50, duration: new Date().toISOString() };

    global.fetch = jest.fn(async (url) => {
      if (url.includes('/api/putility/best/gas')) return { ok: true, json: async () => bestGas };
      if (url.includes('/api/putility/best/electric')) return { ok: true, json: async () => bestElectric };
      if (url.includes('/api/config/current/gas')) return { ok: true, json: async () => currentGas };
      if (url.includes('/api/config/current/electric')) return { ok: true, json: async () => currentElectric };
      throw new Error(`Unexpected url: ${url}`);
    });

    render(<App />);

    const electricHeading = await screen.findByRole('heading', { name: /Best Electric Rate/i });
    const electricWrapper = electricHeading.closest('.rate-card-wrapper');
    await waitFor(() => {
      expect(within(electricWrapper).queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const electricCard = within(electricWrapper).getByRole('heading', { name: 'Spark Deal' }).closest('.utility-card');
    expect(within(electricWrapper).getByText('Best')).toBeInTheDocument();

    const tooltip = within(electricWrapper).getByRole('tooltip');
    await userEvent.hover(electricCard);
    expect(tooltip).toBeInTheDocument();
  });
});

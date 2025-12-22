import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import App from '../App';

test('renders Create Utility Text', () => {
  render(<App />);
  const linkElement = screen.getByText(/Add Current Utility/i);
  expect(linkElement).toBeInTheDocument();
});

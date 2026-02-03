import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the wheel of lunch heading', () => {
  render(React.createElement(App));
  const headingElement = screen.getByRole('heading', { name: /lakey's wheel of lunch/i });
  expect(headingElement).toBeInTheDocument();
});

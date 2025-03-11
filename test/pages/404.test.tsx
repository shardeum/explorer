import React from 'react';
import { render, screen } from '@testing-library/react';
import Custom404 from '../../src/pages/404';

describe('404 Page', () => {
  it('renders 404 message', () => {
    render(<Custom404 />);
    const heading = screen.getByRole('heading', { name: /404 - Page Not Found/i });
    expect(heading).toBeInTheDocument();
  });
}); 
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders GeoScope title', () => {
    render(<App />);
    expect(screen.getByText('GeoScope')).toBeInTheDocument();
  });

  it('renders main navigation buttons', () => {
    render(<App />);
    expect(screen.getByText('🎮 Play Solo')).toBeInTheDocument();
    expect(screen.getByText('🏠 Create Room')).toBeInTheDocument();
    expect(screen.getByText('🚪 Join Room')).toBeInTheDocument();
  });

  it('renders setup status indicators', () => {
    render(<App />);
    expect(screen.getByText('✅ React + TypeScript + Vite')).toBeInTheDocument();
    expect(screen.getByText('✅ TailwindCSS v4 + shadcn/ui')).toBeInTheDocument();
    expect(screen.getByText('✅ React Router + Navigation')).toBeInTheDocument();
  });
}); 
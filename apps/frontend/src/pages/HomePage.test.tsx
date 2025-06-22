import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

// Wrapper component to provide Router context
function HomePageWrapper() {
  return (
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  );
}

describe('HomePage', () => {
  it('renders the main title and description', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('GEOSCOPE')).toBeInTheDocument();
    expect(screen.getByText('> EXPLORE THE WORLD THROUGH REAL PHOTOS')).toBeInTheDocument();
  });

  it('renders all main action buttons', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('[ SOLO ADVENTURE ]')).toBeInTheDocument();
    expect(screen.getByText('[ MULTIPLAYER ]')).toBeInTheDocument();
    expect(screen.getByText('🚪 JOIN ROOM')).toBeInTheDocument();
    expect(screen.getByText('🏆 LEADERBOARD')).toBeInTheDocument();
  });

  it('renders action card descriptions', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('> Test your geography skills solo')).toBeInTheDocument();
    expect(screen.getByText('> Compete with friends worldwide')).toBeInTheDocument();
  });

  it('renders action card features', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('Instant play • Unlimited rounds')).toBeInTheDocument();
    expect(screen.getByText('Up to 8 players • Real-time')).toBeInTheDocument();
  });
}); 
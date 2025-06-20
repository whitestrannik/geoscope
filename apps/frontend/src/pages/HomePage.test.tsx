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

  it('renders gaming-style stats section', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('Explorers Worldwide')).toBeInTheDocument();
    expect(screen.getByText('Countries Featured')).toBeInTheDocument();
    expect(screen.getByText('Adventures Await')).toBeInTheDocument();
  });

  it('renders live activity feed', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('[LIVE]')).toBeInTheDocument();
    expect(screen.getByText(/Explorer_47 discovered Tokyo, Japan|GeoMaster pinpointed|WorldWanderer scored|Navigator_X completed|AtlasSeeker found/)).toBeInTheDocument();
  });
}); 
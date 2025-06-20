import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

const HomePageWrapper = () => (
  <BrowserRouter>
    <HomePage />
  </BrowserRouter>
);

describe('HomePage', () => {
  it('renders the main title and description', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('🌍 GeoScope')).toBeInTheDocument();
    expect(screen.getByText('Discover the world through real photos')).toBeInTheDocument();
  });

  it('renders all main action buttons', () => {
    render(<HomePageWrapper />);
    
    expect(screen.getByText('🎮 Play Solo')).toBeInTheDocument();
    expect(screen.getByText('🏠 Create Room')).toBeInTheDocument();
    expect(screen.getByText('🚪 Join Room')).toBeInTheDocument();
    expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
  });

  it('applies correct styling classes to main card', () => {
    render(<HomePageWrapper />);
    
    const mainCard = screen.getByText('🌍 GeoScope').closest('.bg-white\\/10');
    expect(mainCard).toHaveClass('backdrop-blur-md', 'border-white/20');
  });
}); 
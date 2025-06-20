import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

// Mock the AuthContext to avoid authentication-related errors
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock the UserMenu component to avoid complex authentication testing
vi.mock('@/components/auth/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

function AppShellWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AppShell>{children}</AppShell>
    </BrowserRouter>
  );
}

describe('AppShell', () => {
  it('renders the main navigation elements', () => {
    render(<AppShellWrapper />);
    
    // Check for gaming-style logo
    expect(screen.getByText('GEOSCOPE')).toBeInTheDocument();
    
    // Check for navigation links (desktop version)
    expect(screen.getAllByText('[ HOME ]')[0]).toBeInTheDocument();
    expect(screen.getAllByText('[ SOLO ]')[0]).toBeInTheDocument();
    expect(screen.getAllByText('[ MULTIPLAYER ]')[0]).toBeInTheDocument();
    expect(screen.getAllByText('[ LEADERBOARD ]')[0]).toBeInTheDocument();
    expect(screen.getAllByText('[ STATS ]')[0]).toBeInTheDocument();
  });

  it('renders user menu', () => {
    render(<AppShellWrapper />);
    
    expect(screen.getAllByTestId('user-menu')).toHaveLength(2); // Desktop and mobile versions
  });

  it('renders child content', () => {
    render(
      <AppShellWrapper>
        <div>Test Content</div>
      </AppShellWrapper>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('toggles mobile menu', () => {
    render(<AppShellWrapper />);
    
    // Find mobile menu button
    const mobileMenuButton = screen.getByRole('button');
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('[ SOLO MODE ]')).not.toBeInTheDocument();
    
    // Click to open mobile menu
    fireEvent.click(mobileMenuButton);
    
    // Menu should be open - check for mobile-specific text
    expect(screen.getByText('[ SOLO MODE ]')).toBeInTheDocument();
    expect(screen.getByText('[ CREATE ROOM ]')).toBeInTheDocument();
    expect(screen.getByText('[ JOIN ROOM ]')).toBeInTheDocument();
  });

  it('applies correct gaming-style classes', () => {
    render(<AppShellWrapper />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-black/40', 'backdrop-blur-sm', 'border-cyan-500/30');
  });
}); 
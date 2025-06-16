import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  }),
}));

// Mock react-router-dom's useLocation
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  };
});

const AppShellWrapper = ({ children }: { children?: React.ReactNode }) => (
  <BrowserRouter>
    <AppShell>{children}</AppShell>
  </BrowserRouter>
);

describe('AppShell', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/' });
  });

  it('renders the app logo and title', () => {
    render(<AppShellWrapper />);
    
    expect(screen.getByText('🌍')).toBeInTheDocument();
    expect(screen.getByText('GeoScope')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    render(<AppShellWrapper />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('highlights active navigation link', () => {
    mockUseLocation.mockReturnValue({ pathname: '/solo' });
    render(<AppShellWrapper />);
    
    const soloLink = screen.getByText('Solo');
    expect(soloLink).toHaveClass('text-blue-400');
  });

  it('renders mobile menu button', () => {
    render(<AppShellWrapper />);
    
    // Look for the mobile menu button specifically (has hamburger icon)
    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M4 6h16M4 12h16M4 18h16"]')
    );
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<AppShellWrapper />);
    
    // Get the mobile menu button (the one with hamburger icon)
    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M4 6h16M4 12h16M4 18h16"]')
    );
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('🏠 Home')).not.toBeInTheDocument();
    
    // Click to open mobile menu
    fireEvent.click(menuButton!);
    expect(screen.getByText('🏠 Home')).toBeInTheDocument();
    expect(screen.getByText('🎮 Solo Mode')).toBeInTheDocument();
    expect(screen.getByText('🏠 Create Room')).toBeInTheDocument();
    expect(screen.getByText('🚪 Join Room')).toBeInTheDocument();
    
    // Click to close mobile menu
    fireEvent.click(menuButton!);
    expect(screen.queryByText('🏠 Home')).not.toBeInTheDocument();
  });

  it('closes mobile menu when a link is clicked', () => {
    render(<AppShellWrapper />);
    
    // Get the mobile menu button (the one with hamburger icon)
    const menuButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M4 6h16M4 12h16M4 18h16"]')
    );
    fireEvent.click(menuButton!);
    
    // Menu should be open
    expect(screen.getByText('🏠 Home')).toBeInTheDocument();
    
    // Click a menu link
    fireEvent.click(screen.getByText('🎮 Solo Mode'));
    
    // Menu should close
    expect(screen.queryByText('🏠 Home')).not.toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <AppShellWrapper>
        <div data-testid="test-content">Test Content</div>
      </AppShellWrapper>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<AppShellWrapper />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-black/20', 'backdrop-blur-md');
  });
}); 
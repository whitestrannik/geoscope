import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock the AuthContext
vi.mock('./contexts/AuthContext', () => ({
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

// Mock MapLibre GL to avoid issues in test environment
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      getSource: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    })),
    NavigationControl: vi.fn(),
    AttributionControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
  },
  setWorkerUrl: vi.fn(),
}));

// Mock tRPC to avoid API calls in tests
vi.mock('./lib/trpc', () => ({
  trpc: {
    image: {
      getRandom: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          error: null,
        })),
      },
    },
    guess: {
      evaluate: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}));

describe('App', () => {
  it('renders GEOSCOPE title', () => {
    render(<App />);
    expect(screen.getAllByText('GEOSCOPE')).toHaveLength(2); // Header + Homepage
  });

  it('renders main navigation and action buttons', () => {
    render(<App />);
    expect(screen.getByText('[ SOLO ADVENTURE ]')).toBeInTheDocument();
    expect(screen.getByText('> EXPLORE THE WORLD THROUGH REAL PHOTOS')).toBeInTheDocument();
    expect(screen.getByText('🚪 JOIN ROOM')).toBeInTheDocument();
  });
}); 
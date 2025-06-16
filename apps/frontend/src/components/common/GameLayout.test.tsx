import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GameLayout } from './GameLayout';

const GameLayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('GameLayout', () => {
  const mockProps = {
    layoutMode: 'split' as const,
    onLayoutModeChange: vi.fn(),
    imageSection: <div data-testid="image-section">Image Section</div>,
    mapSection: <div data-testid="map-section">Map Section</div>,
    title: 'Test Game Mode'
  };

  it('renders title correctly', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByText('Test Game Mode')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} subtitle="Test subtitle" />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders home button when showHomeButton is true', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} showHomeButton={true} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByText('← Home')).toBeInTheDocument();
  });

  it('does not render home button when showHomeButton is false', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} showHomeButton={false} />
      </GameLayoutWrapper>
    );
    
    expect(screen.queryByText('← Home')).not.toBeInTheDocument();
  });

  it('renders image and map sections in split mode', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} layoutMode="split" />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByTestId('image-section')).toBeInTheDocument();
    expect(screen.getByTestId('map-section')).toBeInTheDocument();
  });

  it('renders action section when provided', () => {
    const actionSection = <div data-testid="action-section">Action Section</div>;
    
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} actionSection={actionSection} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByTestId('action-section')).toBeInTheDocument();
  });

  it('renders results overlay when provided', () => {
    const resultsOverlay = <div data-testid="results-overlay">Results Overlay</div>;
    
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} resultsOverlay={resultsOverlay} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByTestId('results-overlay')).toBeInTheDocument();
  });

  it('renders header actions when provided', () => {
    const headerActions = <button data-testid="header-action">Header Action</button>;
    
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} headerActions={headerActions} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByTestId('header-action')).toBeInTheDocument();
  });

  it('shows help overlay by default', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByText('Controls:')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('hides help overlay when showHelpOverlay is false', () => {
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} showHelpOverlay={false} />
      </GameLayoutWrapper>
    );
    
    expect(screen.queryByText('Controls:')).not.toBeInTheDocument();
  });

  it('renders custom help content when provided', () => {
    const customHelpContent = <div data-testid="custom-help">Custom Help</div>;
    
    render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} customHelpContent={customHelpContent} />
      </GameLayoutWrapper>
    );
    
    expect(screen.getByTestId('custom-help')).toBeInTheDocument();
  });

  it('calls onLayoutModeChange when keyboard shortcuts are used', () => {
    const mockOnLayoutModeChange = vi.fn();
    
    render(
      <GameLayoutWrapper>
        <GameLayout 
          {...mockProps} 
          onLayoutModeChange={mockOnLayoutModeChange}
          enableKeyboardShortcuts={true}
        />
      </GameLayoutWrapper>
    );
    
    // Test F key for image fullscreen
    fireEvent.keyDown(document, { key: 'f' });
    expect(mockOnLayoutModeChange).toHaveBeenCalledWith('image-full');
    
    // Test M key for map fullscreen
    fireEvent.keyDown(document, { key: 'm' });
    expect(mockOnLayoutModeChange).toHaveBeenCalledWith('map-full');
  });

  it('calls onEnterPress when Enter key is pressed', () => {
    const mockOnEnterPress = vi.fn();
    
    render(
      <GameLayoutWrapper>
        <GameLayout 
          {...mockProps} 
          onEnterPress={mockOnEnterPress}
          enableKeyboardShortcuts={true}
        />
      </GameLayoutWrapper>
    );
    
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockOnEnterPress).toHaveBeenCalledTimes(1);
  });

  it('calls onNPress when N key is pressed', () => {
    const mockOnNPress = vi.fn();
    
    render(
      <GameLayoutWrapper>
        <GameLayout 
          {...mockProps} 
          onNPress={mockOnNPress}
          enableKeyboardShortcuts={true}
        />
      </GameLayoutWrapper>
    );
    
    fireEvent.keyDown(document, { key: 'n' });
    expect(mockOnNPress).toHaveBeenCalledTimes(1);
  });

  it('does not handle keyboard shortcuts when enableKeyboardShortcuts is false', () => {
    const mockOnLayoutModeChange = vi.fn();
    
    render(
      <GameLayoutWrapper>
        <GameLayout 
          {...mockProps} 
          onLayoutModeChange={mockOnLayoutModeChange}
          enableKeyboardShortcuts={false}
        />
      </GameLayoutWrapper>
    );
    
    fireEvent.keyDown(document, { key: 'f' });
    expect(mockOnLayoutModeChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <GameLayoutWrapper>
        <GameLayout {...mockProps} className="custom-class" />
      </GameLayoutWrapper>
    );
    
    // The className is applied to the main div which is the first child
    expect(container.firstChild).toHaveClass('custom-class');
  });
}); 
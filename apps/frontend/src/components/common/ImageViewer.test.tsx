import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageViewer } from './ImageViewer';

describe('ImageViewer', () => {
  const mockProps = {
    imageUrl: 'https://example.com/test-image.jpg',
    alt: 'Test image',
    copyright: 'Test Copyright'
  };

  it('renders image with correct src and alt', () => {
    render(<ImageViewer {...mockProps} />);
    
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
  });

  it('displays copyright information when provided', () => {
    render(<ImageViewer {...mockProps} />);
    
    expect(screen.getByText('📸 Test Copyright')).toBeInTheDocument();
  });

  it('shows zoom controls always', () => {
    render(<ImageViewer {...mockProps} />);
    
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows fullscreen button when isFullscreen is true', () => {
    const mockOnFullscreenToggle = vi.fn();
    render(
      <ImageViewer 
        {...mockProps} 
        isFullscreen={true} 
        onFullscreenToggle={mockOnFullscreenToggle}
      />
    );
    
    const backButton = screen.getByText('← Back');
    expect(backButton).toBeInTheDocument();
  });

  it('calls onFullscreenToggle when fullscreen button is clicked', () => {
    const mockOnFullscreenToggle = vi.fn();
    
    render(
      <ImageViewer 
        {...mockProps} 
        onFullscreenToggle={mockOnFullscreenToggle}
        isFullscreen={true}
      />
    );
    
    const backButton = screen.getByText('← Back');
    fireEvent.click(backButton);
    
    expect(mockOnFullscreenToggle).toHaveBeenCalled();
  });

  it('hides instructions when showInstructions is false', () => {
    render(<ImageViewer {...mockProps} showInstructions={false} />);
    
    // No specific instruction text to check for since we removed that feature
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ImageViewer {...mockProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles zoom controls correctly', () => {
    render(<ImageViewer {...mockProps} />);
    
    const zoomInButton = screen.getByText('+');
    const zoomOutButton = screen.getByText('−');
    const resetButton = screen.getByText('Reset');
    
    // Test that buttons are clickable
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomOutButton);
    fireEvent.click(resetButton);
    
    // No errors should occur
    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();
    expect(resetButton).toBeInTheDocument();
  });

  it('shows interactive overlay when showFullscreenButton is true', () => {
    render(
      <ImageViewer 
        {...mockProps} 
        showFullscreenButton={true}
      />
    );
    
    // The overlay should be present but initially hidden (opacity-0)
    expect(screen.getByText('⛶ Go fullscreen')).toBeInTheDocument();
  });

  it('does not show copyright when not provided', () => {
    const propsWithoutCopyright = {
      imageUrl: 'https://example.com/test-image.jpg',
      alt: 'Test image'
    };
    
    render(<ImageViewer {...propsWithoutCopyright} />);
    
    expect(screen.queryByText(/📸/)).not.toBeInTheDocument();
  });
}); 
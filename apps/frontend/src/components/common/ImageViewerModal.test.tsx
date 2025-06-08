import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageViewerModal } from './ImageViewerModal';

const mockOnClose = vi.fn();

const defaultProps = {
  src: 'https://example.com/test-image.jpg',
  alt: 'Test image',
  isOpen: true,
  onClose: mockOnClose,
  title: 'Test Modal',
  description: 'Test description'
};

describe('ImageViewerModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders modal content when open', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ImageViewerModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders image with correct src and alt attributes', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('renders zoom controls', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    expect(screen.getByText('🔍−')).toBeInTheDocument();
    expect(screen.getByText('🔍+')).toBeInTheDocument();
    expect(screen.getByText('↻ Reset')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('increases zoom when zoom in button is clicked', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    const zoomInButton = screen.getByText('🔍+');
    fireEvent.click(zoomInButton);
    
    expect(screen.getByText('125%')).toBeInTheDocument();
  });

  it('decreases zoom when zoom out button is clicked', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    // First zoom in to have room to zoom out
    const zoomInButton = screen.getByText('🔍+');
    fireEvent.click(zoomInButton);
    
    const zoomOutButton = screen.getByText('🔍−');
    fireEvent.click(zoomOutButton);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('resets zoom when reset button is clicked', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    // Zoom in first
    const zoomInButton = screen.getByText('🔍+');
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomInButton);
    
    expect(screen.getByText('150%')).toBeInTheDocument();
    
    // Reset zoom
    const resetButton = screen.getByText('↻ Reset');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('disables zoom out button at minimum zoom', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    // Zoom out to minimum
    const zoomOutButton = screen.getByText('🔍−');
    fireEvent.click(zoomOutButton);
    fireEvent.click(zoomOutButton);
    
    expect(zoomOutButton).toBeDisabled();
  });

  it('disables zoom in button at maximum zoom', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    const zoomInButton = screen.getByText('🔍+');
    
    // Zoom in to maximum (3x = 300%)
    for (let i = 0; i < 8; i++) {
      fireEvent.click(zoomInButton);
    }
    
    expect(zoomInButton).toBeDisabled();
  });

  it('handles keyboard shortcuts', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    const modalContent = screen.getByRole('dialog');
    
    // Test zoom in with + key
    fireEvent.keyDown(modalContent, { key: '+' });
    expect(screen.getByText('125%')).toBeInTheDocument();
    
    // Test zoom out with - key
    fireEvent.keyDown(modalContent, { key: '-' });
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    // Test reset with 0 key
    fireEvent.keyDown(modalContent, { key: '+' });
    fireEvent.keyDown(modalContent, { key: '0' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders keyboard shortcuts hint', () => {
    render(<ImageViewerModal {...defaultProps} />);
    
    expect(screen.getByText(/Keyboard:/)).toBeInTheDocument();
    expect(screen.getByText(/zoom/)).toBeInTheDocument();
    expect(screen.getByText(/reset/)).toBeInTheDocument();
    expect(screen.getByText(/close/)).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const propsWithoutDescription = { 
      ...defaultProps,
      description: undefined
    };
    
    render(<ImageViewerModal {...propsWithoutDescription} />);
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });
}); 
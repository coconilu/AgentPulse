import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('should render running status with pulse animation', () => {
    render(<StatusBadge status="running" />);

    const badge = screen.getByText('Running');
    expect(badge).toBeInTheDocument();

    // Check for animated dot
    const dot = document.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('should render completed status without animation', () => {
    render(<StatusBadge status="completed" />);

    const badge = screen.getByText('Done');
    expect(badge).toBeInTheDocument();

    // No pulse animation for completed
    const animatedDots = document.querySelectorAll('.animate-pulse');
    expect(animatedDots.length).toBe(0);
  });

  it('should render idle status', () => {
    render(<StatusBadge status="idle" />);

    const badge = screen.getByText('Idle');
    expect(badge).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(<StatusBadge status="error" />);

    const badge = screen.getByText('Error');
    expect(badge).toBeInTheDocument();
  });

  it('should render pending status with pulse', () => {
    render(<StatusBadge status="pending" />);

    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();

    const dot = document.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('should render failed status', () => {
    render(<StatusBadge status="failed" />);

    const badge = screen.getByText('Failed');
    expect(badge).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    render(<StatusBadge status="running" />);

    // Should have a span with inline-flex
    const container = document.querySelector('.inline-flex');
    expect(container).toBeInTheDocument();

    // Should have a dot (w-2 h-2 rounded-full)
    const dot = document.querySelector('.w-2.h-2.rounded-full');
    expect(dot).toBeInTheDocument();
  });
});

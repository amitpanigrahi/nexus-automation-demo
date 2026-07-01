import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'fs';
import path from 'path';
import { SalesAnalyticsWidget } from './SalesAnalyticsWidget';

describe('SalesAnalyticsWidget', () => {
  it('renders the widget with default range (30d)', () => {
    render(<SalesAnalyticsWidget />);

    // Heading is present
    expect(screen.getByText('Sales Analytics')).toBeInTheDocument();

    // Default select value is 30d
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('30d');

    // First row of 30d data should be visible (appears in stats tile and table)
    expect(screen.getAllByText('Aurora Plan').length).toBeGreaterThanOrEqual(1);
  });

  it('changing the select changes visible rows', () => {
    render(<SalesAnalyticsWidget />);

    const select = screen.getByRole('combobox');

    // Switch to 7d
    fireEvent.change(select, { target: { value: '7d' } });

    // Revenue values differ between ranges — 7d Aurora revenue is $12,400
    expect(screen.getByText('$12,400')).toBeInTheDocument();

    // Switch to 90d
    fireEvent.change(select, { target: { value: '90d' } });

    // 90d Aurora revenue is $148,000
    expect(screen.getByText('$148,000')).toBeInTheDocument();
  });

  it('pagination works correctly — page 2 shows different rows than page 1', () => {
    render(<SalesAnalyticsWidget />);

    // PAGE_SIZE = 3, so page 1 shows rows 0-2 (Aurora, Borealis, Cirrus)
    // Aurora also appears in the stats tile (Top Performer), so use getAllByText
    expect(screen.getAllByText('Aurora Plan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Borealis Plan')).toBeInTheDocument();
    expect(screen.getByText('Cirrus Plan')).toBeInTheDocument();

    // Delta and Echo are NOT on page 1
    expect(screen.queryByText('Delta Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Echo Plan')).not.toBeInTheDocument();

    // Navigate to page 2
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));

    // Page 2 shows rows 3-4 (Delta, Echo)
    expect(screen.getByText('Delta Plan')).toBeInTheDocument();
    expect(screen.getByText('Echo Plan')).toBeInTheDocument();

    // Aurora is no longer in the table on page 2, but still shows in stats tile
    const auroraEls = screen.queryAllByText('Aurora Plan');
    // Only the stats tile (Top Performer) should show Aurora, not the table row
    expect(auroraEls.length).toBe(1);
  });

  it('shows total revenue stat', () => {
    render(<SalesAnalyticsWidget />);

    // 30d total: 51000 + 38400 + 27600 + 18200 + 11900 = 147100
    expect(screen.getByText('$147,100')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('shows top performer', () => {
    render(<SalesAnalyticsWidget />);

    // Aurora Plan has the highest 30d revenue ($51,000)
    expect(screen.getByText('Top Performer')).toBeInTheDocument();
    // Aurora Plan text appears in both the stats tile and the table
    const auroraMatches = screen.getAllByText('Aurora Plan');
    expect(auroraMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('does not import chart.js in the component file', () => {
    const componentPath = path.resolve(__dirname, 'SalesAnalyticsWidget.tsx');
    const source = readFileSync(componentPath, 'utf-8');

    expect(source).not.toContain("'chart.js'");
    expect(source).not.toContain('"chart.js"');
    expect(source).not.toContain("from 'chart.js/auto'");
    expect(source).not.toContain('from "chart.js/auto"');
  });
});

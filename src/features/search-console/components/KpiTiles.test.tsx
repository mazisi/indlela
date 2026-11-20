import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KpiTiles } from './KpiTiles';
import { ChangeBadge } from './ChangeBadge';

const totals = { clicks: 1200, impressions: 48000, ctr: 0.025, position: 6.2 };
const previous = { clicks: 1000, impressions: 50000, ctr: 0.02, position: 8.4 };

describe('KpiTiles', () => {
  it('shows each figure with its change, position colour inverted', () => {
    render(<KpiTiles totals={totals} compareTotals={previous} compareLabel="previous period" selected="clicks" onSelect={() => {}} />);

    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('48,000')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('6.2')).toBeInTheDocument();

    const clicks = screen.getByRole('img', { name: 'Clicks up 20.0% vs previous period' });
    expect(clicks).toHaveAttribute('data-tone', 'good');
    expect(clicks).toHaveClass('text-ok');

    const impressions = screen.getByRole('img', { name: 'Impressions down 4.0% vs previous period' });
    expect(impressions).toHaveAttribute('data-tone', 'bad');
    expect(impressions).toHaveClass('text-bad');

    expect(screen.getByRole('img', { name: 'Average CTR up 0.5 pp vs previous period' })).toHaveAttribute('data-tone', 'good');

    // 8.4 → 6.2 is a smaller number but a better ranking: green.
    const position = screen.getByRole('img', { name: 'Average position improved 2.2 vs previous period' });
    expect(position).toHaveAttribute('data-tone', 'good');
    expect(position).toHaveClass('text-ok');
  });

  it('colours a worse position red', () => {
    render(<ChangeBadge value={1.5} better="lower" format={(n) => n.toFixed(1)} label="Position" />);
    expect(screen.getByRole('img', { name: 'Position worsened 1.5' })).toHaveClass('text-bad');
  });

  it('shows hints instead of changes without a compare period, and picks the chart metric', async () => {
    const onSelect = vi.fn();
    render(<KpiTiles totals={totals} compareTotals={null} compareLabel="" selected="clicks" onSelect={onSelect} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Lower is better (1 is the top)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Clicks/ })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: /Average position/ }));
    expect(onSelect).toHaveBeenCalledWith('position');
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { platformUsage } from '../test/fixtures';
import { CostByMonthChart } from './CostByMonthChart';

describe('CostByMonthChart', () => {
  it('describes the trend, and switches to a table with cost and checks per month, newest first', async () => {
    const { series, month } = platformUsage();
    render(<CostByMonthChart series={series} current={month} />);

    expect(screen.getByRole('img', { name: /Cost by month from June 2026 \(\$0\.00\) to November 2026 \(\$31\.20 so far\)/ })).toBeInTheDocument();
    expect(screen.getByText(/\$96\.75 over 6 months/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Table' }));
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(7);
    expect(rows[1]).toHaveTextContent('November 2026So far$31.2018,400');
    expect(rows[2]).toHaveTextContent('October 2026$28.7516,500');
    expect(rows[6]).toHaveTextContent('June 2026$0.000');

    await userEvent.click(screen.getByRole('button', { name: 'Chart' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

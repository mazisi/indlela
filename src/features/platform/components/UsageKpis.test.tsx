import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { platformUsage } from '../test/fixtures';
import { UsageKpis } from './UsageKpis';

const tile = (id: string) => screen.getByTestId(id);
const spendBar = () => within(tile('kpi-spend')).getByRole('progressbar', { name: 'Spend against the monthly cap' });

describe('UsageKpis', () => {
  it('shows spend against the cap with what is pending, the balance, keywords and checks', () => {
    render(<UsageKpis usage={platformUsage()} />);

    expect(tile('kpi-spend')).toHaveTextContent('$31.20');
    expect(tile('kpi-spend')).toHaveTextContent('of $50 cap');
    expect(tile('kpi-spend')).toHaveTextContent('Incl. $0.40 pending');
    expect(tile('kpi-spend')).toHaveAttribute('data-tone', 'neutral');
    expect(spendBar()).toHaveAttribute('data-level', 'ok');
    expect(spendBar()).toHaveAttribute('aria-valuenow', '62');

    expect(tile('kpi-balance')).toHaveTextContent('$68.80');
    expect(within(tile('kpi-balance')).queryByText('Sandbox')).not.toBeInTheDocument();
    expect(tile('kpi-keywords')).toHaveTextContent('1,240');
    expect(tile('kpi-keywords')).toHaveTextContent('in 3 active workspaces of 5');
    expect(tile('kpi-checks')).toHaveTextContent('18,400');
    expect(tile('kpi-checks')).toHaveTextContent('42 live checks');
  });

  it('turns amber from 80 % of the cap and red at the cap', () => {
    const { rerender } = render(<UsageKpis usage={platformUsage({ spend: { thisMonth: 40, pending: 0, cap: 50, capUsedPct: 80 } })} />);
    expect(tile('kpi-spend')).toHaveAttribute('data-tone', 'warn');
    expect(spendBar()).toHaveAttribute('data-level', 'near');
    expect(tile('kpi-spend')).toHaveTextContent('Nothing pending · nearing the cap');

    rerender(<UsageKpis usage={platformUsage({ spend: { thisMonth: 52.1, pending: 0.1, cap: 50, capUsedPct: 104.2 } })} />);
    expect(tile('kpi-spend')).toHaveAttribute('data-tone', 'bad');
    expect(spendBar()).toHaveAttribute('data-level', 'over');
    expect(spendBar()).toHaveAttribute('aria-valuenow', '100');
    expect(tile('kpi-spend')).toHaveTextContent('cap reached, checks paused');
  });

  it('shows no meter without a cap', () => {
    render(<UsageKpis usage={platformUsage({ spend: { thisMonth: 3, pending: 0, cap: null, capUsedPct: null } })} />);
    expect(tile('kpi-spend')).toHaveTextContent('no cap');
    expect(within(tile('kpi-spend')).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('badges the sandbox, shows "—" for an unreadable balance and "Not configured" without credentials', () => {
    const { rerender } = render(<UsageKpis usage={platformUsage({ provider: { configured: true, sandbox: true, balance: 0 } })} />);
    expect(within(tile('kpi-balance')).getByText('Sandbox')).toBeInTheDocument();
    expect(tile('kpi-balance')).toHaveTextContent('not billed');

    rerender(<UsageKpis usage={platformUsage({ provider: { configured: true, sandbox: false, balance: null } })} />);
    expect(tile('kpi-balance')).toHaveTextContent('—');
    expect(tile('kpi-balance')).toHaveTextContent("Couldn't read the balance");

    rerender(<UsageKpis usage={platformUsage({ provider: { configured: false, sandbox: true, balance: null } })} />);
    expect(tile('kpi-balance')).toHaveTextContent('Not configured');
    expect(tile('kpi-balance')).toHaveAttribute('data-tone', 'bad');
    expect(within(tile('kpi-balance')).queryByText('Sandbox')).not.toBeInTheDocument();
  });
});

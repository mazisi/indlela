import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueDetails } from './issues/IssueDetails';
import { ComparisonBanner } from './Comparison';
import { VitalMetric } from './vitals/VitalsTab';
import { HealthGauge, ScoreRing } from './ScoreGauge';
import { categorise } from '../lib/vitals';

describe('IssueDetails', () => {
  it('draws a redirect chain as a → b → c with each status', () => {
    render(
      <IssueDetails
        details={{
          redirects: 2,
          finalUrl: 'https://www.karoocoffee.co.za/shop/',
          chain: [
            { url: 'http://karoocoffee.co.za/shop', statusCode: 301 },
            { url: 'https://karoocoffee.co.za/shop', statusCode: 301 },
            { url: 'https://www.karoocoffee.co.za/shop/', statusCode: 200 },
          ],
        }}
      />,
    );
    const chain = screen.getByRole('list', { name: 'Redirect chain of 3 steps' });
    expect(within(chain).getAllByRole('listitem')).toHaveLength(3);
    expect(within(chain).getAllByLabelText('redirects to')).toHaveLength(2);
    expect(chain).toHaveTextContent('/shop301/shop301/shop/200');
    expect(screen.queryByText('Ends at')).not.toBeInTheDocument();
    expect(screen.queryByText(/Redirects/)).not.toBeInTheDocument();
  });

  it('shows where a broken link points and its status (the row is the linking page)', () => {
    render(<IssueDetails details={{ toUrl: 'https://www.karoocoffee.co.za/old-menu', statusCode: 404, kind: 'link' }} />);
    expect(screen.getByText('Links to')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\/old-menu/ })).toHaveAttribute('href', 'https://www.karoocoffee.co.za/old-menu');
    expect(screen.getByText('404')).toHaveClass('text-bad');
    expect(screen.queryByText(/Kind/)).not.toBeInTheDocument();
  });

  it('labels a broken image and shows where an internal redirect ends', () => {
    render(<IssueDetails details={{ toUrl: 'https://www.karoocoffee.co.za/img/x.png', statusCode: 301, kind: 'image', finalUrl: 'https://www.karoocoffee.co.za/img/y.png' }} />);
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('301')).toHaveClass('text-warn');
    expect(screen.getByText('Ends at')).toBeInTheDocument();
  });

  it('quotes a duplicate title and lists the other pages using it', () => {
    render(<IssueDetails details={{ title: 'Karoo Coffee | Home', pages: 3, otherUrls: ['https://www.karoocoffee.co.za/a', 'https://www.karoocoffee.co.za/b'] }} />);
    expect(screen.getByText('Karoo Coffee | Home').tagName).toBe('Q');
    expect(screen.getByText('Shared with 2 other pages:')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('describes poor Core Web Vitals without dumping the raw readings', () => {
    render(<IssueDetails details={{ strategy: 'mobile', performanceScore: 38, lab: { lcpMs: 5200 }, field: null }} />);
    expect(screen.getByText('Mobile: performance score 38')).toBeInTheDocument();
    expect(screen.queryByText(/lcpMs/)).not.toBeInTheDocument();
  });

  it('points a canonical at its target', () => {
    render(<IssueDetails details={{ canonical: 'https://www.karoocoffee.co.za/shop/' }} />);
    expect(screen.getByText('Canonical')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\/shop\// })).toHaveAttribute('href', 'https://www.karoocoffee.co.za/shop/');
  });

  it('lists images without alt text', () => {
    render(<IssueDetails details={{ count: 2, imagesCount: 9, images: ['https://www.karoocoffee.co.za/img/beans.jpg', 'https://www.karoocoffee.co.za/img/cup.png'] }} />);
    expect(screen.getByText(/2 of 9 images without alt text/)).toBeInTheDocument();
    expect(screen.getByText('/img/beans.jpg, /img/cup.png')).toBeInTheDocument();
  });

  it('shows unfamiliar keys as label and value, and a fallback when empty', () => {
    const { rerender } = render(<IssueDetails details={{ robotsDirective: 'noindex, nofollow', inSitemap: true }} />);
    expect(screen.getByText('Robots directive:')).toBeInTheDocument();
    expect(screen.getByText('noindex, nofollow')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    rerender(<IssueDetails details={null} fallback="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('ComparisonBanner', () => {
  it('says what was fixed and what is new since the previous audit; each figure opens the list', async () => {
    const onOpen = vi.fn();
    render(<ComparisonBanner comparison={{ fixed: 12, new: 3, persisting: 49, previousAuditId: 40 }} previousDate="2026-11-14T09:30:00+02:00" onOpen={onOpen} />);
    expect(screen.getByTestId('comparison-text')).toHaveTextContent('12 issues fixed, 3 new since 14/11/2026.');
    expect(screen.getByText('49 issues still open')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '3 new' }));
    expect(onOpen).toHaveBeenCalledWith('new');
    await userEvent.click(screen.getByRole('button', { name: '12 issues fixed' }));
    expect(onOpen).toHaveBeenCalledWith('fixed');
  });

  it('handles singulars and no change', () => {
    const { rerender } = render(<ComparisonBanner comparison={{ fixed: 1, new: 0, persisting: 1, previousAuditId: 40 }} onOpen={() => {}} />);
    expect(screen.getByTestId('comparison-text')).toHaveTextContent('1 issue fixed, 0 new since the previous audit.');
    expect(screen.getByRole('button', { name: '0 new' })).toBeDisabled();
    rerender(<ComparisonBanner comparison={{ fixed: 0, new: 0, persisting: 5, previousAuditId: 40 }} previousDate="2026-11-14T09:30:00+02:00" onOpen={() => {}} />);
    expect(screen.getByTestId('comparison-text')).toHaveTextContent('No issues fixed or new since 14/11/2026.');
  });
});

describe('vitals colours', () => {
  const metric = (key: 'lcp' | 'inp' | 'cls', value: number) => (
    <VitalMetric reading={{ key, name: key.toUpperCase(), hint: '', value, category: categorise(key, value) }} />
  );

  it.each([
    ['lcp', 2500, 'Good', 'text-ok'],
    ['lcp', 4000, 'Needs improvement', 'text-warn'],
    ['lcp', 4001, 'Poor', 'text-bad'],
    ['inp', 200, 'Good', 'text-ok'],
    ['inp', 500, 'Needs improvement', 'text-warn'],
    ['inp', 501, 'Poor', 'text-bad'],
    ['cls', 0.1, 'Good', 'text-ok'],
    ['cls', 0.25, 'Needs improvement', 'text-warn'],
    ['cls', 0.26, 'Poor', 'text-bad'],
  ] as const)('%s at %s is %s (%s)', (key, value, label, tone) => {
    render(metric(key, value));
    expect(screen.getByText(label)).toHaveClass(tone);
  });
});

describe('scores', () => {
  it('labels the health gauge and the performance ring with their band', () => {
    render(
      <>
        <HealthGauge score={82} />
        <ScoreRing score={48} />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Health score 82 out of 100: Good' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Performance score 48 out of 100: Poor' })).toBeInTheDocument();
  });

  it('colours the health score with its band, like the gauge', () => {
    render(
      <>
        <HealthGauge score={88} />
        <HealthGauge score={64} />
        <HealthGauge score={12} />
      </>,
    );
    expect(screen.getByText('88')).toHaveClass('text-ok');
    expect(screen.getByText('64')).toHaveClass('text-warn');
    expect(screen.getByText('12')).toHaveClass('text-bad');
  });
});

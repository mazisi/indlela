import { describe, expect, it } from 'vitest';
import { audit, site } from '../test/fixtures';
import { comparisonSentence, crawlTarget, finishedMessage, progressLabel } from './auditStatus';
import { healthBand, performanceBand } from './health';
import { decideDetailState } from './pageState';
import { categorise, formatVital, vitalReadings } from './vitals';
import { VITALS } from '../test/fixtures';

describe('Core Web Vitals thresholds', () => {
  it.each([
    ['lcp', 2500, 'good'],
    ['lcp', 2501, 'needs-improvement'],
    ['lcp', 4000, 'needs-improvement'],
    ['lcp', 4001, 'poor'],
    ['inp', 200, 'good'],
    ['inp', 201, 'needs-improvement'],
    ['inp', 500, 'needs-improvement'],
    ['inp', 501, 'poor'],
    ['cls', 0.1, 'good'],
    ['cls', 0.11, 'needs-improvement'],
    ['cls', 0.25, 'needs-improvement'],
    ['cls', 0.26, 'poor'],
  ] as const)('%s %s is %s', (metric, value, category) => {
    expect(categorise(metric, value)).toBe(category);
  });

  it('formats each metric in its unit', () => {
    expect(formatVital('lcp', 2480)).toBe('2.5 s');
    expect(formatVital('inp', 180.4)).toBe('180 ms');
    expect(formatVital('cls', 0.081)).toBe('0.08');
  });

  it('uses field data when Google has it, else lab LCP / TBT / CLS', () => {
    const field = vitalReadings(VITALS[0]);
    expect(field.source).toBe('field');
    expect(field.readings.map((r) => [r.name, r.category])).toEqual([
      ['LCP', 'good'],
      ['INP', 'poor'],
      ['CLS', 'good'],
    ]);
    const lab = vitalReadings(VITALS[1]);
    expect(lab.source).toBe('lab');
    expect(lab.readings.map((r) => [r.name, r.category])).toEqual([
      ['LCP', 'poor'],
      ['TBT', 'good'],
      ['CLS', 'poor'],
    ]);
  });
});

describe('score bands', () => {
  it('bands health at 80 and 50', () => {
    expect(healthBand(80).band).toBe('good');
    expect(healthBand(79).band).toBe('fair');
    expect(healthBand(50).band).toBe('fair');
    expect(healthBand(49).band).toBe('poor');
  });

  it("bands performance like Lighthouse (90 / 50)", () => {
    expect(performanceBand(90).label).toBe('Good');
    expect(performanceBand(89).label).toBe('Needs improvement');
    expect(performanceBand(49).label).toBe('Poor');
  });
});

describe('audit status', () => {
  it('describes progress', () => {
    expect(progressLabel(audit({ status: 'queued' }))).toBe('Waiting in the queue…');
    expect(progressLabel(audit({ status: 'crawling', pagesCrawled: 143, pagesFound: 820, pageLimit: 500 }))).toBe('Crawling… 143 / 500 pages');
    expect(progressLabel(audit({ status: 'crawling', pagesCrawled: 20, pagesFound: 64, pageLimit: 500 }))).toBe('Crawling… 20 / 64 pages');
    expect(progressLabel(audit({ status: 'analysing', pagesCrawled: 312 }))).toBe('Analysing 312 pages…');
    expect(crawlTarget({ pagesFound: 0, pageLimit: 500, pagesCrawled: 0 })).toBe(500);
  });

  it('says what changed in plain English', () => {
    expect(comparisonSentence(12, 3)).toBe('12 issues fixed, 3 new');
    expect(comparisonSentence(1, 0)).toBe('1 issue fixed, none new');
    expect(comparisonSentence(0, 4)).toBe('No issues fixed, 4 new');
    expect(comparisonSentence(0, 0)).toBe('No issues fixed or new');
  });

  it('words the end of a run', () => {
    expect(finishedMessage(audit(), 'Karoo Coffee')).toEqual({ type: 'success', text: 'Audit of Karoo Coffee finished. Health score 82. 12 issues fixed, 3 new.' });
    expect(finishedMessage(audit({ status: 'failed', error: 'The site did not respond.' }), 'Karoo Coffee')).toEqual({
      type: 'error',
      text: 'The audit of Karoo Coffee failed: The site did not respond.',
    });
    expect(finishedMessage(audit({ status: 'cancelled' }), 'Karoo Coffee').type).toBe('default');
  });
});

describe('decideDetailState', () => {
  const running = audit({ id: 50, status: 'crawling', healthScore: null });
  const failed = audit({ id: 45, status: 'failed', error: 'Timed out' });

  it('covers every state', () => {
    expect(decideDetailState(undefined, undefined, undefined, undefined)).toEqual({ kind: 'not_found' });
    expect(decideDetailState(site({ latestAudit: null }), undefined, undefined, [])).toEqual({ kind: 'never_audited' });
    expect(decideDetailState(site({ latestAudit: null }), running, undefined, [])).toEqual({ kind: 'first_running', audit: running });
    expect(decideDetailState(site(), undefined, undefined, undefined)).toEqual({ kind: 'ready', auditId: 41, failedLatest: null });
    expect(decideDetailState(site(), undefined, 40, undefined)).toEqual({ kind: 'ready', auditId: 40, failedLatest: null });
  });

  it('notices a newer failed audit from the history (the sites list only carries the latest done one)', () => {
    expect(decideDetailState(site(), undefined, undefined, [failed, audit()])).toEqual({ kind: 'ready', auditId: 41, failedLatest: failed });
    expect(decideDetailState(site(), undefined, 41, [failed, audit()])).toEqual({ kind: 'ready', auditId: 41, failedLatest: failed });
    const s = site({ latestAudit: null });
    expect(decideDetailState(s, undefined, undefined, undefined)).toEqual({ kind: 'loading' });
    expect(decideDetailState(s, undefined, undefined, [failed])).toEqual({ kind: 'failed', audit: failed });
    expect(decideDetailState(s, running, undefined, [failed])).toEqual({ kind: 'first_running', audit: running });
  });
});

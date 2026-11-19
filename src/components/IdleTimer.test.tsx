import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import IdleTimer from './IdleTimer';
import { session } from '@/features/auth/session';

vi.mock('@/features/auth/session', () => ({ useIsSignedIn: () => true, session: { clear: vi.fn() } }));
vi.mock('@/utils/returnUrl', () => ({ saveReturnUrl: vi.fn() }));

const MINUTE = 60_000;

/** Stands in for public/idleTimer.js: records the countdowns asked for, and lets the test say "time is up". */
class FakeWorker {
  static last: FakeWorker;
  sent: { type: string; duration: number }[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor() {
    FakeWorker.last = this;
  }
  postMessage(m: { type: string; duration: number }) {
    this.sent.push(m);
  }
  get latest() {
    return this.sent[this.sent.length - 1];
  }
  terminate() {}
  expire() {
    act(() => this.onmessage?.({ data: { type: 'expired' } } as MessageEvent));
  }
}

describe('IdleTimer', () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('location', { ...window.location, replace });
    localStorage.clear();
    vi.mocked(session.clear).mockClear();
    replace.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('signs out after 30 minutes without activity in any tab', () => {
    render(<IdleTimer />);
    expect(FakeWorker.last.latest).toEqual({ type: 'reset', duration: 30 * MINUTE });
    fireEvent.keyDown(document);
    expect(Number(localStorage.getItem('wf_last_activity'))).toBeGreaterThan(Date.now() - 1000);

    localStorage.setItem('wf_last_activity', String(Date.now() - 31 * MINUTE));
    FakeWorker.last.expire();
    expect(session.clear).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it("keeps an untouched tab signed in while another tab is in use", () => {
    render(<IdleTimer />);
    // Another tab was used 10 minutes ago: this tab's own 30 minutes are up, but not the user's.
    localStorage.setItem('wf_last_activity', String(Date.now() - 10 * MINUTE));
    FakeWorker.last.expire();
    expect(session.clear).not.toHaveBeenCalled();
    const restarted = FakeWorker.last.latest.duration;
    expect(restarted).toBeGreaterThan(19 * MINUTE);
    expect(restarted).toBeLessThanOrEqual(20 * MINUTE);

    // Activity in another tab restarts this tab's countdown from then.
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'wf_last_activity', newValue: String(Date.now()) }));
    });
    expect(FakeWorker.last.latest.duration).toBeGreaterThan(29 * MINUTE);
  });
});

import { useEffect, useRef, useState } from 'react';
import { useIsSignedIn, session } from '@/features/auth/session';
import { saveReturnUrl } from '@/utils/returnUrl';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_SECONDS = 30;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'] as const;
/** The last activity in any tab, so a tab left alone doesn't sign out one that is in use (they share the session). */
const LAST_ACTIVITY_KEY = 'wf_last_activity';
/** Activity is shared at most this often; a few seconds' lag doesn't matter against 30 minutes. */
const SHARE_EVERY_MS = 5000;

const sharedActivity = (): number => {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * 30 minutes of inactivity signs the user out (ported from bee-compliance).
 * The countdown runs in a Web Worker (public/idleTimer.js) so background-tab
 * throttling can't stretch it; the last 30 seconds show a warning. Activity
 * in any of the user's tabs counts: each tab shares its last activity, and a
 * tab whose own countdown runs out first checks the others before signing out.
 */
const IdleTimer = () => {
  const signedIn = useIsSignedIn();
  const [remaining, setRemaining] = useState<number | null>(null);
  // Guard so the expiry handler signs out + navigates exactly once.
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!signedIn || typeof Worker === 'undefined') return;

    const worker = new Worker('/idleTimer.js');
    const countdown = (ms: number) => {
      worker.postMessage({ type: 'reset', duration: ms });
      setRemaining(null);
    };
    let shared = 0;
    const reset = () => {
      countdown(IDLE_TIMEOUT_MS);
      const now = Date.now();
      if (now - shared < SHARE_EVERY_MS) return;
      shared = now;
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      } catch {
        // Storage blocked: this tab still times out on its own activity.
      }
    };
    // Activity in another tab restarts this tab's countdown from that moment.
    const onOtherTab = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) countdown(IDLE_TIMEOUT_MS - (Date.now() - Number(e.newValue)));
    };

    ACTIVITY_EVENTS.forEach((event) => document.addEventListener(event, reset, true));
    window.addEventListener('storage', onOtherTab);

    worker.onmessage = (e: MessageEvent<{ type: 'tick' | 'expired'; remaining?: number }>) => {
      if (e.data.type === 'expired') {
        // Another tab was used more recently: wait for the rest of its 30 minutes instead.
        const left = IDLE_TIMEOUT_MS - (Date.now() - sharedActivity());
        if (left > 1000) {
          countdown(left);
          return;
        }
        if (hasLoggedOut.current) return;
        hasLoggedOut.current = true;
        // Remember where the user was so sign-in can bring them back — only on
        // idle/401, never on a manual sign-out.
        saveReturnUrl();
        session.clear();
        // Replace history so the dead page isn't reachable via Back.
        window.location.replace('/login');
        return;
      }
      const left = e.data.remaining ?? 0;
      setRemaining(left <= WARNING_SECONDS ? left : null);
    };

    reset();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => document.removeEventListener(event, reset, true));
      window.removeEventListener('storage', onOtherTab);
      worker.terminate();
    };
  }, [signedIn]);

  if (remaining === null) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="top-[10%] translate-y-0 rounded sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center text-primary">Your session is about to end</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-center">
              <p>For your security you'll be signed out after 30 minutes without activity. Signing out in:</p>
              <p className="font-mono text-xl font-semibold tabular-nums text-bad">{remaining} seconds</p>
              <p className="text-xs">Move the mouse or press a key to stay signed in.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default IdleTimer;

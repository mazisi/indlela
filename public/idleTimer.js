let startTime = null;
// The countdown's length, from the latest 'reset' (a tab may restart it with less than the full time).
let duration = 0;
const intervalDuration = 1000; // Check every second
let checkIntervalId = null;

const checkTime = () => {
    const elapsed = Date.now() - startTime;
    if (startTime && elapsed >= duration) {
        postMessage({ type: 'expired', time: elapsed });
        startTime = null; // Reset startTime after expiry
        // Stop ticking once expired so the worker can't keep posting after
        // logout; a later 'reset' restarts the interval.
        if (checkIntervalId) {
            clearInterval(checkIntervalId);
            checkIntervalId = null;
        }
        return;
    }
    if (startTime) {
        postMessage({
            type: 'tick',
            time: elapsed / 1000,
            remaining: ((duration - elapsed) / 1000) | 0 // Truncate fractional part
        });
    }
}

onmessage = (e) => {
    if (e.data && e.data.type === 'reset') {
        startTime = Date.now();
        duration = e.data.duration;

        // Start the interval checker if it's not already running
        if (!checkIntervalId) {
            checkIntervalId = setInterval(checkTime, intervalDuration);
        }
    }
}

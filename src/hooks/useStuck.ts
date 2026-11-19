import { useEffect, useRef, useState } from 'react';

/**
 * Whether a `sticky top-[-1px]` element is pinned: once stuck, its top pixel
 * is clipped by the scroll area (cut off at the top, not the bottom).
 */
export function useStuck<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setStuck(entry.boundingClientRect.top < entry.intersectionRect.top), { threshold: [1] });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, stuck };
}

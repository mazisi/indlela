import { useEffect } from 'react';

/**
 * The share page's own tab: its title (the report and the agency, no app
 * name), `noindex` so search engines leave client reports alone, and the
 * agency's logo as the icon instead of the app's. Restored when it unmounts.
 */
export function usePublicDocument(title: string, iconUrl?: string | null) {
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) return;
    const previous = { href: icon.getAttribute('href'), type: icon.getAttribute('type') };
    if (iconUrl) {
      icon.href = iconUrl;
      icon.removeAttribute('type');
    } else {
      // No logo: a blank icon rather than the app's mark.
      icon.href = 'data:,';
    }
    return () => {
      if (previous.href) icon.setAttribute('href', previous.href);
      if (previous.type) icon.setAttribute('type', previous.type);
    };
  }, [iconUrl]);
}

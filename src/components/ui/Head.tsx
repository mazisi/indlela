import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { APP_NAME } from '@/hooks/useDocumentTitle';

interface HeadProps {
  title?: string;
  separator?: string;
}

/**
 * Sets the browser tab title for the page that renders it.
 *
 * The pathname is a dependency as well as the title: two routes can share a
 * component and a title (a client workspace moving to another client), and the
 * layout's reset has to be overwritten again after each navigation.
 */
export function Head({ title, separator = ' | ' }: HeadProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title ? `${title}${separator}${APP_NAME}` : APP_NAME;
  }, [title, separator, pathname]);

  return null;
}

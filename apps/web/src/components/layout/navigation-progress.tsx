'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shows a bar at the top of the window the moment an internal link is clicked, so a click always
 * gets an immediate response, however long the next page takes to arrive.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => setActive(false), [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setActive(true);
    };
    // Capture phase: next/link cancels the click's default action, which would hide it from a later listener.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Never leave the bar stuck if a navigation is abandoned.
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), 20000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;
  return <div className="nav-progress no-print" data-testid="nav-progress" aria-hidden="true" />;
}

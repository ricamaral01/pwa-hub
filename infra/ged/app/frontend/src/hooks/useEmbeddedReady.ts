'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/** Reveal an embedded GED page only after its session and initial data have painted. */
export function useEmbeddedReady(pageReady: boolean) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!pageReady || isLoading || !isAuthenticated || window.self === window.top ||
        sessionStorage.getItem('ged_embed') !== '1') return;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        window.parent.postMessage({
          type: 'unificado-ged-ready',
          path: window.location.pathname,
        }, window.location.origin);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [pageReady, isLoading, isAuthenticated]);
}

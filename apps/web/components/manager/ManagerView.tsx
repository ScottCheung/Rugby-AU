'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { VIEW_COOKIE, type ManagerView } from './sidebarCookie';

const ViewContext = createContext<{
  view: ManagerView;
  setView: (view: ManagerView) => void;
}>({ view: 'grid', setView: () => {} });

/**
 * The manager's global grid / list choice. Set from the sidebar, read by
 * any list. Kept in a cookie the layout reads, so pages arrive in the
 * chosen view, and in React state, so switching is instant.
 */
export function ManagerViewProvider({
  initialView,
  children,
}: {
  initialView: ManagerView;
  children: ReactNode;
}) {
  const [view, setViewState] = useState(initialView);
  const setView = (next: ManagerView) => {
    setViewState(next);
    document.cookie = `${VIEW_COOKIE}=${next}; path=/manager; max-age=31536000; samesite=lax`;
  };
  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export const useManagerView = () => useContext(ViewContext);

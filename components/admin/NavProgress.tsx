"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin progress bar at the top of the screen: starts the instant an internal link is clicked
 * and finishes when the new page has rendered, so navigation always feels responsive
 * even while the server is still fetching data.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  // Finished: the route (or its query string) changed.
  useEffect(() => {
    stop();
    const finish = setTimeout(() => setWidth(100), 0);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 250);
    return () => {
      clearTimeout(finish);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, search]);

  // Started: any click on an internal link that leads somewhere new.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      stop();
      setVisible(true);
      setWidth(8);
      // Creep towards ~90% and wait there until the page really arrives.
      timer.current = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), 120);
      hideTimer.current = setTimeout(() => {
        stop();
        setVisible(false);
        setWidth(0);
      }, 15000);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      stop();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed left-0 top-0 z-[100] h-[3px] bg-[var(--accent-blue)] shadow-[0_0_8px_var(--accent-blue)] transition-[width,opacity] duration-200 ease-out"
      style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
    />
  );
}

"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function setDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
  listeners.forEach((listener) => listener());
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setDark(!isDark)}
      aria-label="Changer de thème"
      title="Changer de thème"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground transition hover:bg-surface-strong"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm9 4a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM4 13a1 1 0 0 1-1-1 1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H4zm14.36 6.36a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41zM7.05 6.46a1 1 0 0 1-1.41 0l-.71-.71A1 1 0 1 1 6.34 4.34l.71.71a1 1 0 0 1 0 1.41zM12 20a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1zm7.66-14.66a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zM6.34 18.95a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M20.75 14.5A8.25 8.25 0 0 1 9.5 3.25a.75.75 0 0 0-.9-1A9.75 9.75 0 1 0 21.75 15.4a.75.75 0 0 0-1-.9z" />
        </svg>
      )}
    </button>
  );
}

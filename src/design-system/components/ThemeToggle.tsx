'use client';

import React, { useState, useEffect } from 'react';
import { tokens } from '../tokens';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setIsDark(current === 'dark');
  }, []);

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setIsDark(!isDark);
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
        border: `1px solid ${tokens.color.borderDefault}`,
        borderRadius: tokens.radii.sm,
        background: tokens.color.surface,
        color: tokens.color.textPrimary,
        fontSize: '0.875rem',
        cursor: 'pointer',
        fontFamily: tokens.font.family,
      }}
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

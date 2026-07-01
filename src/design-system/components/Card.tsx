import React from 'react';
import { tokens } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof tokens.spacing;
  className?: string;
}

export function Card({ children, padding = 'lg', className }: CardProps) {
  const paddingValue = tokens.spacing[padding];

  return (
    <div
      className={className}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.cardBorder}`,
        borderRadius: tokens.radii.lg,
        padding: paddingValue,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </div>
  );
}

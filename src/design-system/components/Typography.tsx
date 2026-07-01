import React from 'react';
import { tokens } from '../tokens';

type Variant = 'title' | 'body' | 'caption' | 'overline';
type Tone = 'primary' | 'secondary' | 'interactive';

interface TypographyProps {
  children: React.ReactNode;
  variant?: Variant;
  tone?: Tone;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  title: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3 },
  body: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
  overline: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.4,
  },
};

const toneColors: Record<Tone, string> = {
  primary: tokens.color.textPrimary,
  secondary: tokens.color.textSecondary,
  interactive: tokens.color.interactivePrimary,
};

export function Typography({
  children,
  variant = 'body',
  tone = 'primary',
  as: Tag = 'span',
  className,
}: TypographyProps) {
  return (
    <Tag
      className={className}
      style={{
        ...variantStyles[variant],
        color: toneColors[tone],
        fontFamily: tokens.font.family,
      }}
    >
      {children}
    </Tag>
  );
}
